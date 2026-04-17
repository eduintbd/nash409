-- Generic rate-limit attempts table used by edge functions to throttle abuse.
create table if not exists public.rate_limit_attempts (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null,
  identifier text not null,
  attempted_at timestamptz not null default now()
);

create index if not exists rate_limit_attempts_lookup_idx
  on public.rate_limit_attempts (endpoint, identifier, attempted_at desc);

alter table public.rate_limit_attempts enable row level security;

-- Only service-role (edge functions) should read/write this table.
-- No policies granted to authenticated/anon → RLS denies access by default.

-- Best-effort cleanup of rows older than 24h on each insert (keeps table small
-- without a scheduled job).
create or replace function public._rate_limit_cleanup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.rate_limit_attempts
  where attempted_at < now() - interval '24 hours';
  return new;
end;
$$;

drop trigger if exists rate_limit_attempts_cleanup on public.rate_limit_attempts;
create trigger rate_limit_attempts_cleanup
  after insert on public.rate_limit_attempts
  for each statement
  execute function public._rate_limit_cleanup();
