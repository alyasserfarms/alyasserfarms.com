import "server-only";
import { createFarmPool } from "./postgres-pool";

const pool = process.env.DATABASE_URL ? createFarmPool(3) : null;
const cairoDay = "(now() at time zone 'Africa/Cairo')::date";
let lastPrune = 0;
export type VisitSummary = { todayViews: number; weekViews: number; todayBrowsers: number; weekBrowsers: number; since: string };
export async function readVisitSummary(): Promise<VisitSummary | null> {
  if (!process.env.DATABASE_URL) return null;
  const { rows } = await pool!.query<{ today_views: string; week_views: string; today_browsers: string; week_browsers: string; since: string }>(`
    select count(*) filter (where day = ${cairoDay})::text as today_views,
      count(*)::text as week_views,
      count(distinct visitor_token) filter (where day = ${cairoDay})::text as today_browsers,
      count(distinct (day,visitor_token))::text as week_browsers,
      (${cairoDay} - interval '6 days')::date::text as since
    from farm.site_visits where day >= ${cairoDay} - 6`);
  const row = rows[0];
  return { todayViews: Number(row.today_views), weekViews: Number(row.week_views), todayBrowsers: Number(row.today_browsers), weekBrowsers: Number(row.week_browsers), since: row.since };
}
export async function recordVisit(token: string, path: string) {
  if (!process.env.DATABASE_URL || !/^[a-f0-9-]{36}$/.test(token) || !/^\/(?:$|shop(?:\/.*)?$|products\/[^/]+$|cart$|delivery$)/.test(path) || path.length > 160) return;
  await pool!.query(`insert into farm.site_visits (day,visitor_token,page_path) values (${cairoDay},$1,$2) on conflict do nothing`, [token,path]);
  if (Date.now() - lastPrune > 86_400_000) { lastPrune = Date.now(); await pool!.query(`delete from farm.site_visits where day < ${cairoDay} - 90`); }
}
