-- Phase 1.3: Generator run logging + per-flat cost allocation.
--
-- Tracks every time the building's standby generator runs during load shedding
-- or scheduled tests. Each run captures start/end time, fuel consumed, and
-- fuel price; the app then splits the cost across flats using a chosen method
-- and emits service-charge invoices. This dissolves the most common
-- service-charge dispute: residents asking "why did my charge go up this month?"

begin;

------------------------------------------------------------------
-- generator_runs
------------------------------------------------------------------

create table if not exists public.generator_runs (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  fuel_liters numeric(10, 2) not null check (fuel_liters >= 0),
  fuel_price_per_liter numeric(10, 2) not null check (fuel_price_per_liter >= 0),
  reason text not null default 'load_shedding'
    check (reason in ('load_shedding', 'scheduled_test', 'maintenance', 'outage', 'other')),
  notes text,
  logged_by uuid references auth.users(id) on delete set null,
  is_allocated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint generator_runs_duration_positive check (ended_at > started_at)
);

create index if not exists generator_runs_building_started_idx
  on public.generator_runs (building_id, started_at desc);

drop trigger if exists update_generator_runs_updated_at on public.generator_runs;
create trigger update_generator_runs_updated_at
  before update on public.generator_runs
  for each row execute function public.update_updated_at_column();

alter table public.generator_runs enable row level security;

drop policy if exists "generator_runs_select" on public.generator_runs;
create policy "generator_runs_select" on public.generator_runs for select to authenticated
  using (
    public.has_role(auth.uid(), 'admin')
    or public.is_building_member(auth.uid(), building_id)
  );

drop policy if exists "generator_runs_write" on public.generator_runs;
create policy "generator_runs_write" on public.generator_runs for all to authenticated
  using (public.can_manage_building(auth.uid(), building_id))
  with check (public.can_manage_building(auth.uid(), building_id));

------------------------------------------------------------------
-- generator_run_allocations
------------------------------------------------------------------

create table if not exists public.generator_run_allocations (
  id uuid primary key default gen_random_uuid(),
  generator_run_id uuid not null references public.generator_runs(id) on delete cascade,
  flat_id uuid not null references public.flats(id) on delete cascade,
  share_amount numeric(10, 2) not null check (share_amount >= 0),
  invoice_id uuid references public.invoices(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (generator_run_id, flat_id)
);

create index if not exists generator_run_allocations_run_idx
  on public.generator_run_allocations (generator_run_id);
create index if not exists generator_run_allocations_flat_idx
  on public.generator_run_allocations (flat_id);

alter table public.generator_run_allocations enable row level security;

drop policy if exists "generator_run_allocations_select" on public.generator_run_allocations;
create policy "generator_run_allocations_select" on public.generator_run_allocations for select to authenticated
  using (
    public.has_role(auth.uid(), 'admin')
    or exists (
      select 1 from public.generator_runs gr
      where gr.id = generator_run_allocations.generator_run_id
        and public.is_building_member(auth.uid(), gr.building_id)
    )
  );

drop policy if exists "generator_run_allocations_write" on public.generator_run_allocations;
create policy "generator_run_allocations_write" on public.generator_run_allocations for all to authenticated
  using (
    exists (
      select 1 from public.generator_runs gr
      where gr.id = generator_run_allocations.generator_run_id
        and public.can_manage_building(auth.uid(), gr.building_id)
    )
  )
  with check (
    exists (
      select 1 from public.generator_runs gr
      where gr.id = generator_run_allocations.generator_run_id
        and public.can_manage_building(auth.uid(), gr.building_id)
    )
  );

------------------------------------------------------------------
-- allocate_generator_run: atomically split cost across flats and emit invoices
------------------------------------------------------------------

create or replace function public.allocate_generator_run(
  _run_id uuid,
  _method text default 'equal',
  _due_date date default null,
  _description_prefix text default 'Generator fuel'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_run public.generator_runs%rowtype;
  v_total_cost numeric(10, 2);
  v_flat_count int;
  v_total_size numeric(14, 2);
  v_due_date date;
  v_month text;
  v_year int;
  v_inv_id uuid;
  flat_row record;
  share numeric(10, 2);
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select * into v_run from public.generator_runs where id = _run_id for update;
  if not found then
    raise exception 'Generator run not found';
  end if;

  if not public.can_manage_building(v_user_id, v_run.building_id) then
    raise exception 'Not allowed to allocate costs for this building';
  end if;

  if v_run.is_allocated then
    raise exception 'This run has already been allocated';
  end if;

  if _method not in ('equal', 'size_weighted') then
    raise exception 'Unsupported allocation method: %', _method;
  end if;

  v_total_cost := v_run.fuel_liters * v_run.fuel_price_per_liter;
  if v_total_cost <= 0 then
    raise exception 'Total cost must be positive';
  end if;

  select count(*), coalesce(sum(size), 0)
    into v_flat_count, v_total_size
    from public.flats
    where building_id = v_run.building_id;

  if v_flat_count = 0 then
    raise exception 'No flats in this building to allocate against';
  end if;

  v_due_date := coalesce(_due_date, (v_run.ended_at::date + interval '14 days')::date);
  v_month := to_char(v_run.ended_at, 'Month');
  v_month := trim(v_month);
  v_year := extract(year from v_run.ended_at)::int;

  for flat_row in select id, size from public.flats where building_id = v_run.building_id loop
    if _method = 'size_weighted' and v_total_size > 0 then
      share := round(v_total_cost * (flat_row.size / v_total_size), 2);
    else
      share := round(v_total_cost / v_flat_count, 2);
    end if;

    if share > 0 then
      insert into public.invoices (
        flat_id, building_id, month, year, amount, due_date,
        invoice_type, status, description
      ) values (
        flat_row.id, v_run.building_id, v_month, v_year, share, v_due_date,
        'service_charge', 'unpaid',
        _description_prefix || ' — run ' || to_char(v_run.started_at, 'DD Mon YYYY HH24:MI')
      ) returning id into v_inv_id;

      insert into public.generator_run_allocations (
        generator_run_id, flat_id, share_amount, invoice_id
      ) values (_run_id, flat_row.id, share, v_inv_id);
    end if;
  end loop;

  update public.generator_runs set is_allocated = true where id = _run_id;

  return _run_id;
end;
$$;

revoke all on function public.allocate_generator_run(uuid, text, date, text) from public, anon;
grant execute on function public.allocate_generator_run(uuid, text, date, text) to authenticated;

commit;
