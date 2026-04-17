-- Phase 0 Session 2: bootstrap_building RPC.
-- Lets an authenticated user atomically create a new organization + building
-- and assign themselves as the first committee member. This sidesteps the
-- "only admins can insert organizations" RLS policy for the legitimate
-- onboarding case (any signed-in user can claim ownership of a new building).
--
-- Security: the function is SECURITY DEFINER but it only ever uses auth.uid()
-- as the primary_contact_id / user_id, so a caller cannot impersonate another
-- user or elevate an existing org.

begin;

create or replace function public.bootstrap_building(
  _org_name text,
  _org_type text,
  _building_name text,
  _building_address text default null,
  _ward text default null,
  _thana text default null,
  _district text default null,
  _number_of_floors int default null,
  _number_of_flats int default null,
  _year_constructed int default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_org_id uuid;
  v_building_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if coalesce(trim(_org_name), '') = '' then
    raise exception 'Organization name is required';
  end if;
  if coalesce(trim(_building_name), '') = '' then
    raise exception 'Building name is required';
  end if;
  if _org_type not in ('housing_society', 'property_manager', 'single_owner') then
    raise exception 'Invalid organization type';
  end if;

  insert into public.organizations (name, type, primary_contact_id)
  values (trim(_org_name), _org_type, v_user_id)
  returning id into v_org_id;

  insert into public.buildings (
    org_id, name, address, ward, thana, district,
    number_of_floors, number_of_flats, year_constructed
  )
  values (
    v_org_id, trim(_building_name), _building_address, _ward, _thana, _district,
    _number_of_floors, _number_of_flats, _year_constructed
  )
  returning id into v_building_id;

  insert into public.building_members (
    user_id, building_id, role, is_approved, is_primary, approved_by
  )
  values (
    v_user_id, v_building_id, 'committee', true, true, v_user_id
  );

  return v_building_id;
end;
$$;

-- Only authenticated users may call it.
revoke all on function public.bootstrap_building(text, text, text, text, text, text, text, int, int, int) from public, anon;
grant execute on function public.bootstrap_building(text, text, text, text, text, text, text, int, int, int) to authenticated;

commit;
