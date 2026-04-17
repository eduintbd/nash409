-- Phase 0: Multi-building foundation.
-- Introduces organizations, buildings, and building_members so the app can
-- eventually support many buildings per database. Existing data is assigned to
-- a "Default Building" so nothing breaks. RLS tightening and frontend hook
-- rewrites happen in later sessions.

begin;

------------------------------------------------------------------
-- 1. Role enum for building-scoped memberships
------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'building_role') then
    create type public.building_role as enum (
      'committee',
      'manager',
      'staff',
      'vendor',
      'landlord_owner',
      'resident_owner',
      'tenant'
    );
  end if;
end
$$;

------------------------------------------------------------------
-- 2. organizations
------------------------------------------------------------------

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'housing_society'
    check (type in ('housing_society', 'property_manager', 'single_owner')),
  primary_contact_id uuid references auth.users(id) on delete set null,
  address text,
  phone text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists update_organizations_updated_at on public.organizations;
create trigger update_organizations_updated_at
  before update on public.organizations
  for each row execute function public.update_updated_at_column();

alter table public.organizations enable row level security;

------------------------------------------------------------------
-- 3. buildings
------------------------------------------------------------------

create table if not exists public.buildings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete restrict,
  name text not null,
  address text,
  ward text,
  thana text,
  district text,
  occupancy_cert_number text,
  rajuk_approval_number text,
  number_of_floors int,
  number_of_flats int,
  year_constructed int,
  registered_office text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists update_buildings_updated_at on public.buildings;
create trigger update_buildings_updated_at
  before update on public.buildings
  for each row execute function public.update_updated_at_column();

create index if not exists buildings_org_id_idx on public.buildings(org_id);

alter table public.buildings enable row level security;

------------------------------------------------------------------
-- 4. building_members
------------------------------------------------------------------

create table if not exists public.building_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  building_id uuid not null references public.buildings(id) on delete cascade,
  role public.building_role not null,
  flat_id uuid references public.flats(id) on delete set null,
  is_approved boolean not null default false,
  is_primary boolean not null default false,
  approved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, building_id, role)
);

drop trigger if exists update_building_members_updated_at on public.building_members;
create trigger update_building_members_updated_at
  before update on public.building_members
  for each row execute function public.update_updated_at_column();

create index if not exists building_members_user_idx on public.building_members(user_id);
create index if not exists building_members_building_idx on public.building_members(building_id);
create index if not exists building_members_flat_idx on public.building_members(flat_id);

alter table public.building_members enable row level security;

------------------------------------------------------------------
-- 5. Helper functions
------------------------------------------------------------------

-- Returns the set of building_ids the user is an approved member of.
create or replace function public.current_user_buildings(_user_id uuid)
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select distinct building_id
  from public.building_members
  where user_id = _user_id and is_approved = true
$$;

-- Membership predicate used by RLS. If _role is null, any role matches.
create or replace function public.is_building_member(
  _user_id uuid,
  _building_id uuid,
  _role public.building_role default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.building_members
    where user_id = _user_id
      and building_id = _building_id
      and is_approved = true
      and (_role is null or role = _role)
  )
$$;

------------------------------------------------------------------
-- 6. RLS policies for the new tables
--    Minimal: authenticated users can see orgs/buildings they're a member of;
--    global admins can see everything.
------------------------------------------------------------------

drop policy if exists "Members can view their organizations" on public.organizations;
create policy "Members can view their organizations"
  on public.organizations for select
  to authenticated
  using (
    id in (
      select org_id from public.buildings
      where id in (select public.current_user_buildings(auth.uid()))
    )
    or public.has_role(auth.uid(), 'admin')
  );

drop policy if exists "Admins manage organizations" on public.organizations;
create policy "Admins manage organizations"
  on public.organizations for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Members can view their buildings" on public.buildings;
create policy "Members can view their buildings"
  on public.buildings for select
  to authenticated
  using (
    id in (select public.current_user_buildings(auth.uid()))
    or public.has_role(auth.uid(), 'admin')
  );

drop policy if exists "Admins manage buildings" on public.buildings;
create policy "Admins manage buildings"
  on public.buildings for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Users view own memberships" on public.building_members;
create policy "Users view own memberships"
  on public.building_members for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.has_role(auth.uid(), 'admin')
    or public.is_building_member(auth.uid(), building_id, 'committee')
  );

drop policy if exists "Committee can manage memberships" on public.building_members;
create policy "Committee can manage memberships"
  on public.building_members for all
  to authenticated
  using (
    public.has_role(auth.uid(), 'admin')
    or public.is_building_member(auth.uid(), building_id, 'committee')
  )
  with check (
    public.has_role(auth.uid(), 'admin')
    or public.is_building_member(auth.uid(), building_id, 'committee')
  );

------------------------------------------------------------------
-- 7. Seed a default org + default building, then backfill building_id on
--    every existing domain table.
------------------------------------------------------------------

do $$
declare
  default_org_id uuid;
  default_building_id uuid;
begin
  -- Skip if already seeded.
  select id into default_org_id from public.organizations where name = 'Default Organization' limit 1;

  if default_org_id is null then
    insert into public.organizations (name, type)
    values ('Default Organization', 'housing_society')
    returning id into default_org_id;
  end if;

  select id into default_building_id
  from public.buildings
  where org_id = default_org_id and name = 'Default Building'
  limit 1;

  if default_building_id is null then
    insert into public.buildings (org_id, name)
    values (default_org_id, 'Default Building')
    returning id into default_building_id;
  end if;
end
$$;

-- Add building_id columns (nullable first).
alter table public.flats               add column if not exists building_id uuid references public.buildings(id) on delete restrict;
alter table public.owners              add column if not exists building_id uuid references public.buildings(id) on delete restrict;
alter table public.tenants             add column if not exists building_id uuid references public.buildings(id) on delete restrict;
alter table public.employees           add column if not exists building_id uuid references public.buildings(id) on delete restrict;
alter table public.invoices            add column if not exists building_id uuid references public.buildings(id) on delete restrict;
alter table public.payments            add column if not exists building_id uuid references public.buildings(id) on delete restrict;
alter table public.expenses            add column if not exists building_id uuid references public.buildings(id) on delete restrict;
alter table public.expense_categories  add column if not exists building_id uuid references public.buildings(id) on delete restrict;
alter table public.service_requests    add column if not exists building_id uuid references public.buildings(id) on delete restrict;
alter table public.cameras             add column if not exists building_id uuid references public.buildings(id) on delete restrict;
alter table public.utility_readings    add column if not exists building_id uuid references public.buildings(id) on delete restrict;
alter table public.utility_bills       add column if not exists building_id uuid references public.buildings(id) on delete restrict;
alter table public.smart_alerts        add column if not exists building_id uuid references public.buildings(id) on delete restrict;
alter table public.maintenance_schedules add column if not exists building_id uuid references public.buildings(id) on delete restrict;
alter table public.temperature_readings  add column if not exists building_id uuid references public.buildings(id) on delete restrict;
alter table public.property_documents  add column if not exists building_id uuid references public.buildings(id) on delete restrict;

-- Backfill: point every existing row to the default building.
update public.flats               set building_id = (select id from public.buildings where name = 'Default Building' limit 1) where building_id is null;
update public.owners              set building_id = (select id from public.buildings where name = 'Default Building' limit 1) where building_id is null;
update public.tenants             set building_id = (select id from public.buildings where name = 'Default Building' limit 1) where building_id is null;
update public.employees           set building_id = (select id from public.buildings where name = 'Default Building' limit 1) where building_id is null;
update public.invoices            set building_id = (select id from public.buildings where name = 'Default Building' limit 1) where building_id is null;
update public.payments            set building_id = (select id from public.buildings where name = 'Default Building' limit 1) where building_id is null;
update public.expenses            set building_id = (select id from public.buildings where name = 'Default Building' limit 1) where building_id is null;
update public.expense_categories  set building_id = (select id from public.buildings where name = 'Default Building' limit 1) where building_id is null;
update public.service_requests    set building_id = (select id from public.buildings where name = 'Default Building' limit 1) where building_id is null;
update public.cameras             set building_id = (select id from public.buildings where name = 'Default Building' limit 1) where building_id is null;
update public.utility_readings    set building_id = (select id from public.buildings where name = 'Default Building' limit 1) where building_id is null;
update public.utility_bills       set building_id = (select id from public.buildings where name = 'Default Building' limit 1) where building_id is null;
update public.smart_alerts        set building_id = (select id from public.buildings where name = 'Default Building' limit 1) where building_id is null;
update public.maintenance_schedules set building_id = (select id from public.buildings where name = 'Default Building' limit 1) where building_id is null;
update public.temperature_readings  set building_id = (select id from public.buildings where name = 'Default Building' limit 1) where building_id is null;
update public.property_documents  set building_id = (select id from public.buildings where name = 'Default Building' limit 1) where building_id is null;

-- Indexes on the new column for lookup performance.
create index if not exists flats_building_idx              on public.flats(building_id);
create index if not exists owners_building_idx             on public.owners(building_id);
create index if not exists tenants_building_idx            on public.tenants(building_id);
create index if not exists employees_building_idx          on public.employees(building_id);
create index if not exists invoices_building_idx           on public.invoices(building_id);
create index if not exists payments_building_idx           on public.payments(building_id);
create index if not exists expenses_building_idx           on public.expenses(building_id);
create index if not exists expense_categories_building_idx on public.expense_categories(building_id);
create index if not exists service_requests_building_idx   on public.service_requests(building_id);
create index if not exists cameras_building_idx            on public.cameras(building_id);
create index if not exists utility_readings_building_idx   on public.utility_readings(building_id);
create index if not exists utility_bills_building_idx      on public.utility_bills(building_id);
create index if not exists smart_alerts_building_idx       on public.smart_alerts(building_id);
create index if not exists maintenance_schedules_building_idx on public.maintenance_schedules(building_id);
create index if not exists temperature_readings_building_idx on public.temperature_readings(building_id);
create index if not exists property_documents_building_idx on public.property_documents(building_id);

------------------------------------------------------------------
-- 8. Bootstrap building_members from existing user_roles so the existing
--    app keeps working. Role mapping:
--      admin  -> committee (plus a global admin row already exists in user_roles)
--      owner  -> resident_owner (committee can reassign to landlord_owner later)
--      tenant -> tenant
--      user   -> no member row yet (they haven't been approved)
------------------------------------------------------------------

do $$
declare
  default_building_id uuid;
begin
  select id into default_building_id
  from public.buildings where name = 'Default Building' limit 1;

  if default_building_id is null then return; end if;

  -- Admin / committee
  insert into public.building_members (user_id, building_id, role, is_approved, is_primary)
  select ur.user_id, default_building_id, 'committee'::public.building_role, true, true
  from public.user_roles ur
  where ur.role = 'admin' and ur.is_approved = true
  on conflict (user_id, building_id, role) do nothing;

  -- Owners -> resident_owner (best-guess default)
  insert into public.building_members (user_id, building_id, role, flat_id, is_approved, is_primary)
  select ur.user_id,
         default_building_id,
         'resident_owner'::public.building_role,
         (select of.flat_id
          from public.owners o
          join public.owner_flats of on of.owner_id = o.id
          where o.user_id = ur.user_id
          limit 1),
         true,
         true
  from public.user_roles ur
  where ur.role = 'owner' and ur.is_approved = true
  on conflict (user_id, building_id, role) do nothing;

  -- Tenants
  insert into public.building_members (user_id, building_id, role, flat_id, is_approved, is_primary)
  select ur.user_id,
         default_building_id,
         'tenant'::public.building_role,
         (select t.flat_id from public.tenants t where t.user_id = ur.user_id limit 1),
         true,
         true
  from public.user_roles ur
  where ur.role = 'tenant' and ur.is_approved = true
  on conflict (user_id, building_id, role) do nothing;
end
$$;

commit;
