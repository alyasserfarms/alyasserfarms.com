-- Migration 007: Create farm.users table for staff & multi-user management
-- Enables username/password authentication, roles (admin / orders), and employee management.

create table if not exists farm.users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  name text not null,
  password_hash text not null,
  role text not null check (role in ('admin', 'orders')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists farm_users_username_idx on farm.users (lower(username));
