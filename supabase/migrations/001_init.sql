-- JokoHub initial schema (Supabase / Postgres)
-- Apply in Supabase SQL editor or via CLI when leaving demo mode.

create extension if not exists "pgcrypto";

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  widget_key text not null unique,
  allowed_origins text[] not null default '{}',
  seat_limit int not null default 3,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_subscription_status text,
  widget_settings jsonb not null default '{"primaryColor":"#0A3D3A","greeting":"Hi — how can we help?","position":"right"}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.org_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'agent')),
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);

create table if not exists public.visitors (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  session_key text not null,
  display_name text,
  email text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (org_id, session_key)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  visitor_id uuid not null references public.visitors(id) on delete cascade,
  status text not null default 'open' check (status in ('open', 'resolved')),
  assigned_to uuid references auth.users(id) on delete set null,
  last_message_at timestamptz not null default now(),
  unread_for_agents int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists conversations_org_status_idx
  on public.conversations (org_id, status, last_message_at desc);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  sender_type text not null check (sender_type in ('visitor', 'agent', 'system')),
  sender_user_id uuid references auth.users(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_idx
  on public.messages (conversation_id, created_at);

alter table public.organizations enable row level security;
alter table public.org_members enable row level security;
alter table public.visitors enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create or replace function public.is_org_member(check_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.org_members m
    where m.org_id = check_org and m.user_id = auth.uid()
  );
$$;

create policy org_select on public.organizations
  for select using (public.is_org_member(id));

create policy org_update on public.organizations
  for update using (
    exists (
      select 1 from public.org_members m
      where m.org_id = id and m.user_id = auth.uid() and m.role = 'owner'
    )
  );

create policy members_select on public.org_members
  for select using (public.is_org_member(org_id));

create policy conversations_member on public.conversations
  for all using (public.is_org_member(org_id))
  with check (public.is_org_member(org_id));

create policy messages_member on public.messages
  for all using (public.is_org_member(org_id))
  with check (public.is_org_member(org_id));

create policy visitors_member on public.visitors
  for select using (public.is_org_member(org_id));

-- Realtime for agent inbox
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;
