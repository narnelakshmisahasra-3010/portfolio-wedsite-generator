-- PortfolioForge database schema
-- Run this complete script in Supabase Dashboard > SQL Editor.
-- The Express backend uses the server-side service-role key and checks ownership in every portfolio query.
-- RLS is enabled as an additional protection; no anon/authenticated client policies are created because
-- browser clients must never access these custom-auth tables directly.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  name varchar(80) not null check (char_length(trim(name)) >= 2),
  email varchar(254) not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title varchar(100) not null default 'My Portfolio',
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portfolios_content_is_object check (jsonb_typeof(content) = 'object')
);

create index if not exists portfolios_user_updated_idx
  on public.portfolios(user_id, updated_at desc);
create index if not exists profiles_email_lower_idx
  on public.profiles(lower(email));

alter table public.profiles enable row level security;
alter table public.portfolios enable row level security;

-- Intentionally no policies for direct browser access. Server-side service role bypasses RLS,
-- so all API routes must continue enforcing authentication and user ownership.
