-- Anonymous daily aggregates. Tokens are random per browser and day; no IP or user agent is stored.
create table if not exists farm.site_visits (
  day date not null,
  visitor_token uuid not null,
  page_path text not null check (length(page_path) between 1 and 160),
  first_seen_at timestamptz not null default now(),
  primary key (day, visitor_token, page_path)
);
create index if not exists farm_site_visits_day_idx on farm.site_visits (day);
