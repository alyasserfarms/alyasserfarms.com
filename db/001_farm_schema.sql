-- Apply once in the Supabase SQL Editor. The farm schema is not exposed by the Data API.
create schema if not exists farm;
revoke all on schema farm from public;

create table if not exists farm.revision (
  id smallint primary key default 1 check (id = 1),
  value bigint not null default 0 check (value >= 0)
);

create table if not exists farm.settings (
  id smallint primary key default 1 check (id = 1),
  minimum_bulk_kg integer not null default 24 check (minimum_bulk_kg between 1 and 10000),
  eid boolean not null default true,
  receive_orders boolean not null default true,
  delivery text not null default ''
);

create table if not exists farm.products (
  id text primary key,
  name text not null,
  category text not null check (category in ('meat','poultry','vegetables','fruit','dairy','farm')),
  image text not null,
  unit text not null,
  sale text not null check (sale in ('kg','pack','head','live-kg')),
  price numeric(12,2) not null check (price > 0),
  description text not null default '',
  preparation text not null default '',
  stock integer not null default 0 check (stock >= 0),
  minimum integer not null default 1 check (minimum between 1 and 10000),
  status text not null default 'draft' check (status in ('draft','available','hidden')),
  sort_order integer not null default 0
);
create index if not exists farm_products_visibility_idx on farm.products (status, sort_order);

create table if not exists farm.orders (
  id uuid primary key,
  idempotency_key uuid not null unique,
  created_at timestamptz not null,
  status text not null check (status in ('new','reviewed','confirmed','preparing','delivered','cancelled')),
  customer_name text not null,
  customer_phone text not null,
  customer_city text not null,
  customer_address text not null,
  customer_notes text not null default '',
  kind text not null check (kind in ('retail','bulk')),
  total numeric(12,2) not null check (total >= 0),
  reserved boolean not null default false
);
create index if not exists farm_orders_created_idx on farm.orders (created_at desc);
create index if not exists farm_orders_status_idx on farm.orders (status, created_at desc);

create table if not exists farm.order_items (
  order_id uuid not null references farm.orders(id) on delete restrict,
  line_number integer not null check (line_number >= 0),
  product_id text not null references farm.products(id) on delete restrict,
  name text not null,
  unit text not null,
  quantity integer not null check (quantity > 0),
  price numeric(12,2) not null check (price >= 0),
  primary key (order_id, line_number)
);

-- Reserved for the next content-management step. No video is published by this migration.
create table if not exists farm.videos (
  id uuid primary key,
  youtube_id varchar(11) not null,
  title text not null,
  description text not null default '',
  status text not null default 'draft' check (status in ('draft','published','hidden')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into farm.revision (id, value) values (1, 0) on conflict (id) do nothing;
insert into farm.settings (id) values (1) on conflict (id) do nothing;
