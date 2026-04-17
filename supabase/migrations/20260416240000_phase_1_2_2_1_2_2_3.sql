-- Combined migration for phases 3, 1.2, 2.2, and 2.1.
--   Phase 3   : buildings.join_code + request_building_membership() RPC
--   Phase 1.2 : payment_intents + approve_payment_intent() RPC
--   Phase 2.2 : compliance_documents
--   Phase 2.1 : staff_shifts + staff_attendance + payroll_periods + payroll_entries

begin;

------------------------------------------------------------------
-- PHASE 3: buildings.join_code + request_building_membership RPC
------------------------------------------------------------------

alter table public.buildings
  add column if not exists join_code text;

-- Generate stable 8-char codes for existing rows.
do $$
declare
  b record;
  code text;
begin
  for b in select id from public.buildings where join_code is null loop
    -- Upper-case alphanumerics, excluding easily-confused chars.
    code := upper(substring(replace(replace(gen_random_uuid()::text, '-', ''), '0', 'O'), 1, 8));
    update public.buildings set join_code = code where id = b.id;
  end loop;
end
$$;

alter table public.buildings
  alter column join_code set not null,
  add constraint buildings_join_code_unique unique (join_code);

-- Auto-populate join_code for inserts that don't provide one.
create or replace function public.buildings_set_join_code()
returns trigger
language plpgsql
as $$
begin
  if new.join_code is null or length(new.join_code) = 0 then
    new.join_code := upper(
      substring(replace(replace(gen_random_uuid()::text, '-', ''), '0', 'O'), 1, 8)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists buildings_set_join_code_trg on public.buildings;
create trigger buildings_set_join_code_trg
  before insert on public.buildings
  for each row execute function public.buildings_set_join_code();

create or replace function public.request_building_membership(
  _join_code text,
  _role public.building_role
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_building_id uuid;
  v_existing uuid;
  v_member_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if _role not in ('landlord_owner', 'resident_owner', 'tenant', 'staff', 'vendor') then
    raise exception 'Role % cannot self-request; committee must invite', _role;
  end if;

  select id into v_building_id from public.buildings
    where upper(join_code) = upper(trim(_join_code));
  if v_building_id is null then
    raise exception 'Invalid join code';
  end if;

  -- Prevent duplicate requests of the same role.
  select id into v_existing from public.building_members
    where user_id = v_user_id and building_id = v_building_id and role = _role;
  if v_existing is not null then
    return v_existing;
  end if;

  insert into public.building_members (user_id, building_id, role, is_approved, is_primary)
  values (v_user_id, v_building_id, _role, false, false)
  returning id into v_member_id;

  return v_member_id;
end;
$$;

revoke all on function public.request_building_membership(text, public.building_role) from public, anon;
grant execute on function public.request_building_membership(text, public.building_role) to authenticated;

-- Also allow lookup of building name by join_code without seeing other data.
-- The committee approval UI uses this.
create or replace function public.lookup_building_by_code(_join_code text)
returns table (id uuid, name text, address text)
language sql
stable
security definer
set search_path = public
as $$
  select b.id, b.name, b.address
  from public.buildings b
  where upper(b.join_code) = upper(trim(_join_code))
$$;

revoke all on function public.lookup_building_by_code(text) from public, anon;
grant execute on function public.lookup_building_by_code(text) to authenticated;

------------------------------------------------------------------
-- PHASE 1.2: payment_intents
------------------------------------------------------------------

create table if not exists public.payment_intents (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  submitted_by uuid references auth.users(id) on delete set null,
  amount numeric(10, 2) not null check (amount > 0),
  method text not null default 'bkash'
    check (method in ('bkash', 'nagad', 'rocket', 'bank', 'cash', 'cheque', 'other')),
  reference text,
  payer_phone text,
  notes text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payment_intents_building_status_idx
  on public.payment_intents (building_id, status, created_at desc);
create index if not exists payment_intents_invoice_idx
  on public.payment_intents (invoice_id);

drop trigger if exists update_payment_intents_updated_at on public.payment_intents;
create trigger update_payment_intents_updated_at
  before update on public.payment_intents
  for each row execute function public.update_updated_at_column();

alter table public.payment_intents enable row level security;

drop policy if exists "payment_intents_select" on public.payment_intents;
create policy "payment_intents_select" on public.payment_intents for select to authenticated
  using (
    public.has_role(auth.uid(), 'admin')
    or public.can_manage_building(auth.uid(), building_id)
    or submitted_by = auth.uid()
    or exists (
      select 1 from public.invoices inv
      where inv.id = payment_intents.invoice_id
        and (
          public.is_owner_of_flat(auth.uid(), inv.flat_id)
          or exists (
            select 1 from public.tenants t
            where t.flat_id = inv.flat_id and t.user_id = auth.uid()
          )
        )
    )
  );

-- Tenants/owners may INSERT pending intents for invoices on their flat.
drop policy if exists "payment_intents_insert" on public.payment_intents;
create policy "payment_intents_insert" on public.payment_intents for insert to authenticated
  with check (
    submitted_by = auth.uid()
    and status = 'pending'
    and (
      public.can_manage_building(auth.uid(), building_id)
      or exists (
        select 1 from public.invoices inv
        where inv.id = payment_intents.invoice_id
          and inv.building_id = payment_intents.building_id
          and (
            public.is_owner_of_flat(auth.uid(), inv.flat_id)
            or exists (
              select 1 from public.tenants t
              where t.flat_id = inv.flat_id and t.user_id = auth.uid()
            )
          )
      )
    )
  );

drop policy if exists "payment_intents_update" on public.payment_intents;
create policy "payment_intents_update" on public.payment_intents for update to authenticated
  using (public.can_manage_building(auth.uid(), building_id))
  with check (public.can_manage_building(auth.uid(), building_id));

drop policy if exists "payment_intents_delete" on public.payment_intents;
create policy "payment_intents_delete" on public.payment_intents for delete to authenticated
  using (
    public.can_manage_building(auth.uid(), building_id)
    or (submitted_by = auth.uid() and status = 'pending')
  );

create or replace function public.approve_payment_intent(_intent_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_intent public.payment_intents%rowtype;
  v_invoice public.invoices%rowtype;
  v_payment_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then raise exception 'Authentication required'; end if;

  select * into v_intent from public.payment_intents where id = _intent_id for update;
  if not found then raise exception 'Payment intent not found'; end if;

  if not public.can_manage_building(v_user_id, v_intent.building_id) then
    raise exception 'Only committee/manager may approve';
  end if;
  if v_intent.status <> 'pending' then
    raise exception 'Intent already %', v_intent.status;
  end if;

  select * into v_invoice from public.invoices where id = v_intent.invoice_id for update;
  if not found then raise exception 'Invoice not found'; end if;

  insert into public.payments (invoice_id, flat_id, building_id, amount, method, reference)
  values (
    v_invoice.id, v_invoice.flat_id, v_invoice.building_id, v_intent.amount,
    v_intent.method::payment_method, v_intent.reference
  )
  returning id into v_payment_id;

  update public.invoices
    set status = 'paid', paid_date = current_date
    where id = v_invoice.id;

  update public.payment_intents
    set status = 'approved', approved_by = v_user_id, approved_at = now()
    where id = _intent_id;

  return v_payment_id;
end;
$$;

revoke all on function public.approve_payment_intent(uuid) from public, anon;
grant execute on function public.approve_payment_intent(uuid) to authenticated;

create or replace function public.reject_payment_intent(_intent_id uuid, _reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_intent public.payment_intents%rowtype;
begin
  select * into v_intent from public.payment_intents where id = _intent_id for update;
  if not found then raise exception 'Payment intent not found'; end if;
  if not public.can_manage_building(auth.uid(), v_intent.building_id) then
    raise exception 'Only committee/manager may reject';
  end if;
  if v_intent.status <> 'pending' then
    raise exception 'Intent already %', v_intent.status;
  end if;
  update public.payment_intents
    set status = 'rejected', rejection_reason = _reason, approved_by = auth.uid(), approved_at = now()
    where id = _intent_id;
end;
$$;

revoke all on function public.reject_payment_intent(uuid, text) from public, anon;
grant execute on function public.reject_payment_intent(uuid, text) to authenticated;

------------------------------------------------------------------
-- PHASE 2.2: compliance_documents
------------------------------------------------------------------

create table if not exists public.compliance_documents (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings(id) on delete cascade,
  document_type text not null
    check (document_type in (
      'rajuk_approval', 'occupancy_cert', 'fire_noc', 'lift_safety',
      'extinguisher', 'earthquake_drill', 'boiler', 'lightning_arrester',
      'electrical_safety', 'other'
    )),
  title text not null,
  issuing_authority text,
  reference_number text,
  issued_on date,
  expires_on date,
  file_path text,
  notes text,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists compliance_documents_building_idx
  on public.compliance_documents (building_id);
create index if not exists compliance_documents_expiry_idx
  on public.compliance_documents (expires_on);

drop trigger if exists update_compliance_documents_updated_at on public.compliance_documents;
create trigger update_compliance_documents_updated_at
  before update on public.compliance_documents
  for each row execute function public.update_updated_at_column();

alter table public.compliance_documents enable row level security;

drop policy if exists "compliance_documents_select" on public.compliance_documents;
create policy "compliance_documents_select" on public.compliance_documents for select to authenticated
  using (
    public.has_role(auth.uid(), 'admin')
    or public.is_building_member(auth.uid(), building_id)
  );

drop policy if exists "compliance_documents_write" on public.compliance_documents;
create policy "compliance_documents_write" on public.compliance_documents for all to authenticated
  using (public.can_manage_building(auth.uid(), building_id))
  with check (public.can_manage_building(auth.uid(), building_id));

------------------------------------------------------------------
-- PHASE 2.1: staff shifts + attendance + payroll
------------------------------------------------------------------

create table if not exists public.staff_shifts (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  shift_date date not null,
  start_time time not null,
  end_time time not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists staff_shifts_building_date_idx
  on public.staff_shifts (building_id, shift_date desc);
create index if not exists staff_shifts_employee_idx
  on public.staff_shifts (employee_id);

alter table public.staff_shifts enable row level security;

drop policy if exists "staff_shifts_select" on public.staff_shifts;
create policy "staff_shifts_select" on public.staff_shifts for select to authenticated
  using (
    public.has_role(auth.uid(), 'admin')
    or public.is_building_member(auth.uid(), building_id)
  );

drop policy if exists "staff_shifts_write" on public.staff_shifts;
create policy "staff_shifts_write" on public.staff_shifts for all to authenticated
  using (public.can_manage_building(auth.uid(), building_id))
  with check (public.can_manage_building(auth.uid(), building_id));

create table if not exists public.staff_attendance (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  shift_id uuid references public.staff_shifts(id) on delete set null,
  check_in_at timestamptz not null default now(),
  check_out_at timestamptz,
  method text not null default 'manual'
    check (method in ('gate_qr', 'manual', 'whatsapp', 'app')),
  recorded_by uuid references auth.users(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists staff_attendance_building_idx
  on public.staff_attendance (building_id, check_in_at desc);
create index if not exists staff_attendance_employee_idx
  on public.staff_attendance (employee_id);

alter table public.staff_attendance enable row level security;

drop policy if exists "staff_attendance_select" on public.staff_attendance;
create policy "staff_attendance_select" on public.staff_attendance for select to authenticated
  using (
    public.has_role(auth.uid(), 'admin')
    or public.can_manage_building(auth.uid(), building_id)
    or public.is_building_member(auth.uid(), building_id, 'staff')
  );

drop policy if exists "staff_attendance_write" on public.staff_attendance;
create policy "staff_attendance_write" on public.staff_attendance for all to authenticated
  using (public.can_manage_building(auth.uid(), building_id))
  with check (public.can_manage_building(auth.uid(), building_id));

create table if not exists public.payroll_periods (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings(id) on delete cascade,
  month text not null,
  year int not null,
  status text not null default 'draft'
    check (status in ('draft', 'finalized', 'paid')),
  total_amount numeric(12, 2) not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  finalized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (building_id, month, year)
);

drop trigger if exists update_payroll_periods_updated_at on public.payroll_periods;
create trigger update_payroll_periods_updated_at
  before update on public.payroll_periods
  for each row execute function public.update_updated_at_column();

alter table public.payroll_periods enable row level security;

drop policy if exists "payroll_periods_select" on public.payroll_periods;
create policy "payroll_periods_select" on public.payroll_periods for select to authenticated
  using (
    public.has_role(auth.uid(), 'admin')
    or public.can_manage_building(auth.uid(), building_id)
  );

drop policy if exists "payroll_periods_write" on public.payroll_periods;
create policy "payroll_periods_write" on public.payroll_periods for all to authenticated
  using (public.can_manage_building(auth.uid(), building_id))
  with check (public.can_manage_building(auth.uid(), building_id));

create table if not exists public.payroll_entries (
  id uuid primary key default gen_random_uuid(),
  payroll_period_id uuid not null references public.payroll_periods(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  base_salary numeric(10, 2) not null default 0,
  bonuses numeric(10, 2) not null default 0,
  deductions numeric(10, 2) not null default 0,
  advance_adjustment numeric(10, 2) not null default 0,
  net_amount numeric(10, 2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (payroll_period_id, employee_id)
);

drop trigger if exists update_payroll_entries_updated_at on public.payroll_entries;
create trigger update_payroll_entries_updated_at
  before update on public.payroll_entries
  for each row execute function public.update_updated_at_column();

alter table public.payroll_entries enable row level security;

drop policy if exists "payroll_entries_select" on public.payroll_entries;
create policy "payroll_entries_select" on public.payroll_entries for select to authenticated
  using (
    public.has_role(auth.uid(), 'admin')
    or exists (
      select 1 from public.payroll_periods pp
      where pp.id = payroll_entries.payroll_period_id
        and public.can_manage_building(auth.uid(), pp.building_id)
    )
  );

drop policy if exists "payroll_entries_write" on public.payroll_entries;
create policy "payroll_entries_write" on public.payroll_entries for all to authenticated
  using (
    exists (
      select 1 from public.payroll_periods pp
      where pp.id = payroll_entries.payroll_period_id
        and public.can_manage_building(auth.uid(), pp.building_id)
    )
  )
  with check (
    exists (
      select 1 from public.payroll_periods pp
      where pp.id = payroll_entries.payroll_period_id
        and public.can_manage_building(auth.uid(), pp.building_id)
    )
  );

-- RPC: generate_payroll_period creates draft entries using each employee's base salary.
create or replace function public.generate_payroll_period(
  _building_id uuid,
  _month text,
  _year int
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_period_id uuid;
  emp record;
begin
  if not public.can_manage_building(auth.uid(), _building_id) then
    raise exception 'Only committee/manager may generate payroll';
  end if;

  insert into public.payroll_periods (building_id, month, year, status, created_by)
  values (_building_id, _month, _year, 'draft', auth.uid())
  on conflict (building_id, month, year) do update set updated_at = now()
  returning id into v_period_id;

  -- Seed entries from employees table if period just created (no rows yet).
  if not exists (select 1 from public.payroll_entries where payroll_period_id = v_period_id) then
    for emp in select id, salary from public.employees where building_id = _building_id loop
      insert into public.payroll_entries (payroll_period_id, employee_id, base_salary, net_amount)
      values (v_period_id, emp.id, emp.salary, emp.salary)
      on conflict (payroll_period_id, employee_id) do nothing;
    end loop;
  end if;

  return v_period_id;
end;
$$;

revoke all on function public.generate_payroll_period(uuid, text, int) from public, anon;
grant execute on function public.generate_payroll_period(uuid, text, int) to authenticated;

commit;
