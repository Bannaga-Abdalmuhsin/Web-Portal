import { db } from "@workspace/db";
import { sitesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

const GOOGLE_SHEETS_URL =
  "https://script.google.com/macros/s/AKfycbxU7WENKAEkhJnBvCPbcGqiwZbUr5ZTT93Gfpw6AmiP7lPYfGUobDpOZh1qvppYgF3RVw/exec";

const EXCLUDED_REGIONS = new Set(["west", "south"]);
const EXCLUDED_SITES = new Set(["cow301"]);

const INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function syncSitesFromSheets(): Promise<{
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
  total: number;
}> {
  const response = await fetch(GOOGLE_SHEETS_URL, { redirect: "follow" });
  if (!response.ok) throw new Error(`Google Sheets fetch failed: ${response.status}`);

  const json = await response.json() as {
    energyDashboard?: { headers: string[]; rows: (string | number)[][] };
  };

  const dashboard = json.energyDashboard;
  if (!dashboard?.headers || !dashboard?.rows) throw new Error("Unexpected response format");

  const hdrs = dashboard.headers.map((h) => h.trim().toLowerCase());
  const col = (name: string) => hdrs.findIndex((h) => h === name.toLowerCase());

  const idxName     = col("sitename");
  const idxRegion   = col("regionname");
  const idxDistrict = col("districtname");
  const idxCity     = col("cityname");
  const idxStatus   = col("cowstatus");
  const idxLabel    = col("sitelabel");
  const idxLat      = col("lat");
  const idxLng      = col("lng");
  const idxNextPlan = col("nextfuelingplan");
  const idxLastDate = col("lastfuelingdate");
  const idxLastQty  = col("lastfuelingqty");

  if (idxName === -1) throw new Error("Column 'siteName' not found in Google Sheet");

  const existing = await db.select({ id: sitesTable.id, name: sitesTable.name }).from(sitesTable);
  const byName = new Map(existing.map((s) => [s.name.toLowerCase(), s.id]));

  let inserted = 0, updated = 0, skipped = 0;
  const errors: string[] = [];

  const safeFloat = (v: string | number | undefined) => {
    const n = parseFloat(String(v ?? ""));
    return isNaN(n) ? undefined : n;
  };

  for (const row of dashboard.rows) {
    const name = String(row[idxName] ?? "").trim();
    if (!name) { skipped++; continue; }
    if (EXCLUDED_SITES.has(name.toLowerCase())) { skipped++; continue; }

    const rowRegion = idxRegion >= 0 ? String(row[idxRegion] ?? "").trim().toLowerCase() : "";
    if (EXCLUDED_REGIONS.has(rowRegion)) { skipped++; continue; }

    const payload = {
      name,
      region:          idxRegion   >= 0 ? String(row[idxRegion]   ?? "") : undefined,
      district:        idxDistrict >= 0 ? String(row[idxDistrict] ?? "") : undefined,
      city:            idxCity     >= 0 ? String(row[idxCity]     ?? "") : undefined,
      cowStatus:       idxStatus   >= 0 ? String(row[idxStatus]   ?? "ON-AIR") : undefined,
      siteLabel:       idxLabel    >= 0 ? String(row[idxLabel]    ?? "") : undefined,
      lat:             safeFloat(row[idxLat]  as string),
      lng:             safeFloat(row[idxLng]  as string),
      nextFuelingPlan: idxNextPlan >= 0 ? String(row[idxNextPlan] ?? "") : undefined,
      lastFuelingDate: idxLastDate >= 0 ? String(row[idxLastDate] ?? "") : undefined,
      lastFuelingQty:  safeFloat(row[idxLastQty] as string),
    };

    try {
      const existingId = byName.get(name.toLowerCase());
      if (existingId !== undefined) {
        await db.update(sitesTable).set(payload).where(eq(sitesTable.id, existingId));
        updated++;
      } else {
        await db.insert(sitesTable).values({ ...payload, active: true });
        byName.set(name.toLowerCase(), -1);
        inserted++;
      }
    } catch (err) {
      errors.push(`"${name}": ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { inserted, updated, skipped, errors, total: dashboard.rows.length };
}

export function startSiteSyncScheduler(): void {
  const run = async () => {
    logger.info("Auto-sync: fetching sites from Google Sheets…");
    try {
      const result = await syncSitesFromSheets();
      logger.info(
        { inserted: result.inserted, updated: result.updated, skipped: result.skipped, errors: result.errors.length },
        "Auto-sync complete"
      );
    } catch (err) {
      logger.error({ err }, "Auto-sync failed");
    }
  };

  // Run immediately on startup then every 24 hours
  run();
  setInterval(run, INTERVAL_MS);
  logger.info({ intervalHours: 24 }, "Site auto-sync scheduler started");
}
