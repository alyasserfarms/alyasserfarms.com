-- Per-order delivery quote and assignment. Apply before deploying the matching app code.
alter table farm.orders add column if not exists delivery_fee numeric(12,2) check (delivery_fee >= 0);
alter table farm.orders add column if not exists delivery_date date;
alter table farm.orders add column if not exists delivery_agent text not null default '';
alter table farm.orders add column if not exists delivery_note text not null default '';
alter table farm.orders drop constraint if exists orders_status_check;
alter table farm.orders add constraint orders_status_check check (status in ('new','reviewed','confirmed','preparing','out_for_delivery','delivered','cancelled'));
