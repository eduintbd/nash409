-- Phase 0 Session 3: tighten RLS on every domain table.
-- Replaces the initial "allow public (true)" policies with building-scoped,
-- role-aware ones using is_building_member() and has_role(, 'admin').
-- Global admins (app_role='admin') retain bypass for operational reasons.
-- Service role bypasses RLS automatically; edge functions using the service
-- role key are unaffected.

begin;

------------------------------------------------------------------
-- Helper: is the caller a committee or manager of the building?
-- Using a function keeps policy predicates readable and lets us tweak the
-- "manager can do X" rule in one place later.
------------------------------------------------------------------

create or replace function public.can_manage_building(_user_id uuid, _building_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.has_role(_user_id, 'admin')
    or public.is_building_member(_user_id, _building_id, 'committee')
    or public.is_building_member(_user_id, _building_id, 'manager')
$$;

------------------------------------------------------------------
-- flats
------------------------------------------------------------------
drop policy if exists "Allow public read flats" on public.flats;
drop policy if exists "Allow public insert flats" on public.flats;
drop policy if exists "Allow public update flats" on public.flats;
drop policy if exists "Allow public delete flats" on public.flats;

create policy "flats_select" on public.flats for select to authenticated
  using (
    public.has_role(auth.uid(), 'admin')
    or public.is_building_member(auth.uid(), building_id)
  );

create policy "flats_write" on public.flats for all to authenticated
  using (public.can_manage_building(auth.uid(), building_id))
  with check (public.can_manage_building(auth.uid(), building_id));

------------------------------------------------------------------
-- owners
------------------------------------------------------------------
drop policy if exists "Allow public read owners" on public.owners;
drop policy if exists "Allow public insert owners" on public.owners;
drop policy if exists "Allow public update owners" on public.owners;
drop policy if exists "Allow public delete owners" on public.owners;

create policy "owners_select" on public.owners for select to authenticated
  using (
    public.has_role(auth.uid(), 'admin')
    or public.is_building_member(auth.uid(), building_id)
  );

create policy "owners_write" on public.owners for all to authenticated
  using (public.can_manage_building(auth.uid(), building_id))
  with check (public.can_manage_building(auth.uid(), building_id));

------------------------------------------------------------------
-- owner_flats (junction — derives scope from owners.building_id)
------------------------------------------------------------------
drop policy if exists "Allow public read owner_flats" on public.owner_flats;
drop policy if exists "Allow public insert owner_flats" on public.owner_flats;
drop policy if exists "Allow public update owner_flats" on public.owner_flats;
drop policy if exists "Allow public delete owner_flats" on public.owner_flats;

create policy "owner_flats_select" on public.owner_flats for select to authenticated
  using (
    public.has_role(auth.uid(), 'admin')
    or exists (
      select 1 from public.owners o
      where o.id = owner_flats.owner_id
        and public.is_building_member(auth.uid(), o.building_id)
    )
  );

create policy "owner_flats_write" on public.owner_flats for all to authenticated
  using (
    exists (
      select 1 from public.owners o
      where o.id = owner_flats.owner_id
        and public.can_manage_building(auth.uid(), o.building_id)
    )
  )
  with check (
    exists (
      select 1 from public.owners o
      where o.id = owner_flats.owner_id
        and public.can_manage_building(auth.uid(), o.building_id)
    )
  );

------------------------------------------------------------------
-- tenants — committee/manager/owners see all; tenants see their own row
------------------------------------------------------------------
drop policy if exists "Allow public read tenants" on public.tenants;
drop policy if exists "Allow public insert tenants" on public.tenants;
drop policy if exists "Allow public update tenants" on public.tenants;
drop policy if exists "Allow public delete tenants" on public.tenants;

create policy "tenants_select" on public.tenants for select to authenticated
  using (
    public.has_role(auth.uid(), 'admin')
    or public.is_building_member(auth.uid(), building_id, 'committee')
    or public.is_building_member(auth.uid(), building_id, 'manager')
    or public.is_building_member(auth.uid(), building_id, 'resident_owner')
    or public.is_building_member(auth.uid(), building_id, 'landlord_owner')
    or user_id = auth.uid()
  );

create policy "tenants_write" on public.tenants for all to authenticated
  using (public.can_manage_building(auth.uid(), building_id))
  with check (public.can_manage_building(auth.uid(), building_id));

------------------------------------------------------------------
-- invoices — committee/manager see all; owner/tenant of the flat see theirs
------------------------------------------------------------------
drop policy if exists "Allow public read invoices" on public.invoices;
drop policy if exists "Allow public insert invoices" on public.invoices;
drop policy if exists "Allow public update invoices" on public.invoices;
drop policy if exists "Allow public delete invoices" on public.invoices;

create policy "invoices_select" on public.invoices for select to authenticated
  using (
    public.has_role(auth.uid(), 'admin')
    or public.can_manage_building(auth.uid(), building_id)
    or public.is_owner_of_flat(auth.uid(), flat_id)
    or exists (
      select 1 from public.tenants t
      where t.flat_id = invoices.flat_id and t.user_id = auth.uid()
    )
  );

create policy "invoices_write" on public.invoices for all to authenticated
  using (public.can_manage_building(auth.uid(), building_id))
  with check (public.can_manage_building(auth.uid(), building_id));

------------------------------------------------------------------
-- payments
------------------------------------------------------------------
drop policy if exists "Allow public read payments" on public.payments;
drop policy if exists "Allow public insert payments" on public.payments;
drop policy if exists "Allow public update payments" on public.payments;
drop policy if exists "Allow public delete payments" on public.payments;

create policy "payments_select" on public.payments for select to authenticated
  using (
    public.has_role(auth.uid(), 'admin')
    or public.can_manage_building(auth.uid(), building_id)
    or public.is_owner_of_flat(auth.uid(), flat_id)
    or exists (
      select 1 from public.tenants t
      where t.flat_id = payments.flat_id and t.user_id = auth.uid()
    )
  );

create policy "payments_write" on public.payments for all to authenticated
  using (public.can_manage_building(auth.uid(), building_id))
  with check (public.can_manage_building(auth.uid(), building_id));

------------------------------------------------------------------
-- expenses — financial data, committee/manager only
------------------------------------------------------------------
drop policy if exists "Allow public read expenses" on public.expenses;
drop policy if exists "Allow public insert expenses" on public.expenses;
drop policy if exists "Allow public update expenses" on public.expenses;
drop policy if exists "Allow public delete expenses" on public.expenses;

create policy "expenses_rw" on public.expenses for all to authenticated
  using (public.can_manage_building(auth.uid(), building_id))
  with check (public.can_manage_building(auth.uid(), building_id));

------------------------------------------------------------------
-- expense_categories — any member may view; committee/manager may edit
------------------------------------------------------------------
drop policy if exists "Allow public read expense_categories" on public.expense_categories;
drop policy if exists "Allow public insert expense_categories" on public.expense_categories;
drop policy if exists "Allow public update expense_categories" on public.expense_categories;
drop policy if exists "Allow public delete expense_categories" on public.expense_categories;

create policy "expense_categories_select" on public.expense_categories for select to authenticated
  using (
    public.has_role(auth.uid(), 'admin')
    or public.is_building_member(auth.uid(), building_id)
  );

create policy "expense_categories_write" on public.expense_categories for all to authenticated
  using (public.can_manage_building(auth.uid(), building_id))
  with check (public.can_manage_building(auth.uid(), building_id));

------------------------------------------------------------------
-- service_requests — tenants can self-submit for their own flat
------------------------------------------------------------------
drop policy if exists "Allow public read service_requests" on public.service_requests;
drop policy if exists "Allow public insert service_requests" on public.service_requests;
drop policy if exists "Allow public update service_requests" on public.service_requests;
drop policy if exists "Allow public delete service_requests" on public.service_requests;

create policy "service_requests_select" on public.service_requests for select to authenticated
  using (
    public.has_role(auth.uid(), 'admin')
    or public.is_building_member(auth.uid(), building_id)
  );

create policy "service_requests_insert" on public.service_requests for insert to authenticated
  with check (
    public.can_manage_building(auth.uid(), building_id)
    or (
      public.is_building_member(auth.uid(), building_id)
      and exists (
        select 1 from public.tenants t
        where t.flat_id = service_requests.flat_id and t.user_id = auth.uid()
      )
    )
    or (
      public.is_building_member(auth.uid(), building_id)
      and public.is_owner_of_flat(auth.uid(), flat_id)
    )
  );

create policy "service_requests_update_delete" on public.service_requests for all to authenticated
  using (public.can_manage_building(auth.uid(), building_id))
  with check (public.can_manage_building(auth.uid(), building_id));

------------------------------------------------------------------
-- employees
------------------------------------------------------------------
drop policy if exists "Allow public read employees" on public.employees;
drop policy if exists "Allow public insert employees" on public.employees;
drop policy if exists "Allow public update employees" on public.employees;
drop policy if exists "Allow public delete employees" on public.employees;

create policy "employees_select" on public.employees for select to authenticated
  using (
    public.has_role(auth.uid(), 'admin')
    or public.can_manage_building(auth.uid(), building_id)
  );

create policy "employees_write" on public.employees for all to authenticated
  using (public.can_manage_building(auth.uid(), building_id))
  with check (public.can_manage_building(auth.uid(), building_id));

------------------------------------------------------------------
-- cameras
------------------------------------------------------------------
drop policy if exists "Allow public read cameras" on public.cameras;
drop policy if exists "Allow public insert cameras" on public.cameras;
drop policy if exists "Allow public update cameras" on public.cameras;
drop policy if exists "Allow public delete cameras" on public.cameras;

create policy "cameras_select" on public.cameras for select to authenticated
  using (
    public.has_role(auth.uid(), 'admin')
    or public.is_building_member(auth.uid(), building_id)
  );

create policy "cameras_write" on public.cameras for all to authenticated
  using (public.can_manage_building(auth.uid(), building_id))
  with check (public.can_manage_building(auth.uid(), building_id));

------------------------------------------------------------------
-- utility_bills — any member may view (building-wide common bills),
-- committee/manager may manage. Flat-scoped visibility for tenants is
-- handled by the flat_id join when flat_id is not null.
------------------------------------------------------------------
drop policy if exists "Allow authenticated read utility_bills" on public.utility_bills;
drop policy if exists "Allow authenticated insert utility_bills" on public.utility_bills;
drop policy if exists "Allow authenticated update utility_bills" on public.utility_bills;
drop policy if exists "Allow authenticated delete utility_bills" on public.utility_bills;

create policy "utility_bills_select" on public.utility_bills for select to authenticated
  using (
    public.has_role(auth.uid(), 'admin')
    or public.is_building_member(auth.uid(), building_id)
  );

create policy "utility_bills_write" on public.utility_bills for all to authenticated
  using (public.can_manage_building(auth.uid(), building_id))
  with check (public.can_manage_building(auth.uid(), building_id));

------------------------------------------------------------------
-- maintenance_schedules — add write policy (previous migration only had
-- admin manage + authenticated select)
------------------------------------------------------------------
drop policy if exists "Admins can manage maintenance_schedules" on public.maintenance_schedules;
drop policy if exists "Authenticated can view maintenance_schedules" on public.maintenance_schedules;

create policy "maintenance_schedules_select" on public.maintenance_schedules for select to authenticated
  using (
    public.has_role(auth.uid(), 'admin')
    or public.is_building_member(auth.uid(), building_id)
  );

create policy "maintenance_schedules_write" on public.maintenance_schedules for all to authenticated
  using (public.can_manage_building(auth.uid(), building_id))
  with check (public.can_manage_building(auth.uid(), building_id));

------------------------------------------------------------------
-- property_documents
------------------------------------------------------------------
drop policy if exists "Allow authenticated read property_documents" on public.property_documents;
drop policy if exists "Allow authenticated insert property_documents" on public.property_documents;
drop policy if exists "Allow authenticated delete property_documents" on public.property_documents;
drop policy if exists "Allow authenticated update property_documents" on public.property_documents;

create policy "property_documents_select" on public.property_documents for select to authenticated
  using (
    public.has_role(auth.uid(), 'admin')
    or public.is_building_member(auth.uid(), building_id)
  );

create policy "property_documents_write" on public.property_documents for all to authenticated
  using (public.can_manage_building(auth.uid(), building_id))
  with check (public.can_manage_building(auth.uid(), building_id));

------------------------------------------------------------------
-- utility_readings + smart_alerts + temperature_readings: the previous
-- migration already has admin + owner_of_flat policies. Extend to also
-- allow committee/manager of the building.
------------------------------------------------------------------
drop policy if exists "Admins can manage utility_readings" on public.utility_readings;
drop policy if exists "Users can view building-wide readings" on public.utility_readings;
drop policy if exists "Owners can view their flat readings" on public.utility_readings;

create policy "utility_readings_select" on public.utility_readings for select to authenticated
  using (
    public.has_role(auth.uid(), 'admin')
    or public.is_building_member(auth.uid(), building_id)
    or public.is_owner_of_flat(auth.uid(), flat_id)
  );

create policy "utility_readings_write" on public.utility_readings for all to authenticated
  using (public.can_manage_building(auth.uid(), building_id))
  with check (public.can_manage_building(auth.uid(), building_id));

drop policy if exists "Admins can manage smart_alerts" on public.smart_alerts;
drop policy if exists "Users can view their flat alerts" on public.smart_alerts;

create policy "smart_alerts_select" on public.smart_alerts for select to authenticated
  using (
    public.has_role(auth.uid(), 'admin')
    or public.is_building_member(auth.uid(), building_id)
    or public.is_owner_of_flat(auth.uid(), flat_id)
  );

create policy "smart_alerts_write" on public.smart_alerts for all to authenticated
  using (public.can_manage_building(auth.uid(), building_id))
  with check (public.can_manage_building(auth.uid(), building_id));

drop policy if exists "Admins can manage temperature_readings" on public.temperature_readings;
drop policy if exists "Users can view temperature readings" on public.temperature_readings;

create policy "temperature_readings_select" on public.temperature_readings for select to authenticated
  using (
    public.has_role(auth.uid(), 'admin')
    or public.is_building_member(auth.uid(), building_id)
  );

create policy "temperature_readings_write" on public.temperature_readings for all to authenticated
  using (public.can_manage_building(auth.uid(), building_id))
  with check (public.can_manage_building(auth.uid(), building_id));

commit;
