-- Run in Supabase SQL editor before enabling accounts.
create table public.financial_backups (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null check (octet_length(payload::text) <= 1500000),
  updated_at timestamptz not null default now()
);
alter table public.financial_backups enable row level security;
revoke all on public.financial_backups from anon;
revoke all on public.financial_backups from authenticated;
grant select, delete on public.financial_backups to authenticated;
grant all on public.financial_backups to service_role;
create policy "Read own backup" on public.financial_backups for select to authenticated using ((select auth.uid()) = user_id);
create policy "Delete own backup" on public.financial_backups for delete to authenticated using ((select auth.uid()) = user_id);

-- Only the server can create billing mappings. Never expose service_role to Vite.
create table public.billing_customers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  customer_id text not null unique
);
alter table public.billing_customers enable row level security;
revoke all on public.billing_customers from anon, authenticated;
grant all on public.billing_customers to service_role;
