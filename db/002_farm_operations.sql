-- Additive migration for forward crop planning. No example farm data is inserted.
create table if not exists farm.crop_plans (
  id uuid primary key,
  crop_name text not null check (length(crop_name) between 2 and 80),
  plot_name text not null default '',
  area_feddan numeric(10,2) check (area_feddan > 0),
  planned_planting date,
  expected_harvest date,
  expected_quantity_kg numeric(12,2) check (expected_quantity_kg > 0),
  status text not null default 'planned' check (status in ('planned','growing','harvested','cancelled')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expected_harvest is null or planned_planting is null or expected_harvest >= planned_planting)
);
create index if not exists farm_crop_plans_harvest_idx on farm.crop_plans (expected_harvest, status);
