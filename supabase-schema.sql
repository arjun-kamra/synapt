-- ============================================================
-- FocusLoop Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ── Profiles ──────────────────────────────────────────────
create table if not exists profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  email               text,
  full_name           text,
  created_at          timestamptz default now(),
  best_intervention   text,
  total_sessions      int default 0,
  total_focus_minutes int default 0
);

alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();


-- ── Sessions ──────────────────────────────────────────────
create table if not exists sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete cascade not null,
  started_at       timestamptz default now(),
  ended_at         timestamptz,
  duration_seconds int,
  focus_score      int not null default 100,
  drift_count      int not null default 0,
  status           text not null default 'active' check (status in ('active', 'completed'))
);

alter table sessions enable row level security;

create policy "Users can manage own sessions"
  on sessions for all using (auth.uid() = user_id);


-- ── Interventions ─────────────────────────────────────────
create table if not exists interventions (
  id               uuid primary key default gen_random_uuid(),
  session_id       uuid references sessions(id) on delete cascade not null,
  user_id          uuid references auth.users(id) on delete cascade not null,
  type             text not null check (type in ('breathing', 'posture', 'visual')),
  triggered_at     timestamptz default now(),
  recovered_at     timestamptz,
  recovery_seconds int,
  recovered        boolean not null default false
);

alter table interventions enable row level security;

create policy "Users can manage own interventions"
  on interventions for all using (auth.uid() = user_id);


-- ── Indexes ───────────────────────────────────────────────
create index if not exists idx_sessions_user_id    on sessions(user_id);
create index if not exists idx_sessions_started_at on sessions(started_at desc);
create index if not exists idx_interventions_session_id on interventions(session_id);
create index if not exists idx_interventions_user_id    on interventions(user_id);
