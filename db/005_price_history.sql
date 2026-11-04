-- Immutable price history. No product FK: records remain when a product is removed.
create table if not exists farm.price_changes (
  id uuid primary key,
  product_id text not null,
  product_name text not null,
  unit text not null,
  old_price numeric(12,2) not null check (old_price > 0),
  new_price numeric(12,2) not null check (new_price > 0),
  occurred_at timestamptz not null default now()
);
create index if not exists farm_price_changes_recent_idx on farm.price_changes (occurred_at desc, id desc);
