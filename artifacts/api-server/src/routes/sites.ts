import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sitesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function mapSite(s: typeof sitesTable.$inferSelect) {
  return {
    id: s.id,
    name: s.name,
    region: s.region ?? "",
    district: s.district,
    city: s.city,
    project: s.project,
    cowStatus: s.cowStatus,
    siteLabel: s.siteLabel ?? "",
    lat: s.lat ?? null,
    lng: s.lng ?? null,
    nextFuelingPlan: s.nextFuelingPlan ?? "",
    lastFuelingDate: s.lastFuelingDate ?? "",
    lastFuelingQty: s.lastFuelingQty ?? null,
    active: s.active,
    currentLiters: s.currentLiters,
    dailyVirtual: s.dailyVirtual,
    assignedTechnicianId: s.assignedTechnicianId ?? null,
  };
}

/** Normalise a raw CSV/sheet header to a lowercase key without spaces */
function normHeader(h: string) {
  return h.trim().toLowerCase().replace(/\s+/g, "");
}

/** Resolve aliases → canonical field names */
function resolveAlias(key: string): string {
  const aliases: Record<string, string> = {
    latitude: "lat",
    longitude: "lng",
    "cow status": "cowstatus",
    status: "cowstatus",
  };
  return aliases[key] ?? key;
}

/** Parse a CSV string (with quoted fields) into an array of row-objects */
function parseCsv(csv: string): Record<string, string>[] {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const rawHeaders = lines[0].split(",").map((h) => h.replace(/^"|"$/g, "").trim());
  const headers = rawHeaders.map((h) => resolveAlias(normHeader(h)));

  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.replace(/^"|"$/g, "").trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ""; });
    return row;
  });
}

router.get("/sites", async (req, res) => {
  try {
    const sites = await db.select().from(sitesTable).orderBy(sitesTable.name);
    res.json(sites.map(mapSite));
  } catch (err) {
    req.log.error({ err }, "Failed to list sites");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/sites", async (req, res) => {
  try {
    const body = req.body;
    const [site] = await db.insert(sitesTable).values({
      name: body.name,
      region: body.region || "",
      district: body.district || "",
      city: body.city || "",
      project: body.project || "stc COW",
      cowStatus: body.cowStatus || "ON-AIR",
      siteLabel: body.siteLabel || "",
      lat: body.lat != null ? parseFloat(body.lat) : undefined,
      lng: body.lng != null ? parseFloat(body.lng) : undefined,
      nextFuelingPlan: body.nextFuelingPlan || "",
      lastFuelingDate: body.lastFuelingDate || "",
      lastFuelingQty: body.lastFuelingQty != null ? parseFloat(body.lastFuelingQty) : undefined,
      active: body.active !== undefined ? body.active : true,
      assignedTechnicianId: body.assignedTechnicianId ? parseInt(body.assignedTechnicianId) : undefined,
    }).returning();
    res.status(201).json(mapSite(site));
  } catch (err) {
    req.log.error({ err }, "Failed to create site");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/sites/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const body = req.body;
    const [site] = await db.update(sitesTable).set({
      name: body.name,
      region: body.region,
      district: body.district,
      city: body.city,
      project: body.project,
      cowStatus: body.cowStatus,
      siteLabel: body.siteLabel,
      lat: body.lat != null ? parseFloat(body.lat) : undefined,
      lng: body.lng != null ? parseFloat(body.lng) : undefined,
      nextFuelingPlan: body.nextFuelingPlan,
      lastFuelingDate: body.lastFuelingDate,
      lastFuelingQty: body.lastFuelingQty != null ? parseFloat(body.lastFuelingQty) : undefined,
      active: body.active,
      assignedTechnicianId: body.assignedTechnicianId != null
        ? parseInt(body.assignedTechnicianId) : undefined,
    }).where(eq(sitesTable.id, id)).returning();
    if (!site) return res.status(404).json({ error: "Not found" });
    res.json(mapSite(site));
  } catch (err) {
    req.log.error({ err }, "Failed to update site");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/sites/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(sitesTable).where(eq(sitesTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete site");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /sites/import-csv
 * Body: { csv: string }
 * Accepts the CSV format described in the Google Sheets spec.
 * Returns { inserted, skipped, errors }.
 */
router.post("/sites/import-csv", async (req, res) => {
  try {
    const { csv } = req.body as { csv?: string };
    if (!csv || typeof csv !== "string") {
      return res.status(400).json({ error: "Request body must include a 'csv' string field" });
    }

    const rows = parseCsv(csv);
    if (rows.length === 0) {
      return res.status(400).json({ error: "No data rows found in CSV" });
    }

    let inserted = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of rows) {
      const name = row["sitename"];
      if (!name) { skipped++; continue; }

      try {
        const lat = row["lat"] ? parseFloat(row["lat"]) : undefined;
        const lng = row["lng"] ? parseFloat(row["lng"]) : undefined;
        const lastQty = row["lastfuelingqty"] ? parseFloat(row["lastfuelingqty"]) : undefined;

        await db.insert(sitesTable).values({
          name,
          region: row["regionname"] || "",
          district: row["districtname"] || "",
          city: row["cityname"] || "",
          cowStatus: row["cowstatus"] || "ON-AIR",
          siteLabel: row["sitelabel"] || "",
          lat: isNaN(lat!) ? undefined : lat,
          lng: isNaN(lng!) ? undefined : lng,
          nextFuelingPlan: row["nextfuelingplan"] || "",
          lastFuelingDate: row["lastfuelingdate"] || "",
          lastFuelingQty: lastQty != null && !isNaN(lastQty) ? lastQty : undefined,
          active: true,
        }).onConflictDoNothing();
        inserted++;
      } catch (err) {
        errors.push(`Row "${name}": ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    res.json({ inserted, skipped, errors, total: rows.length });
  } catch (err) {
    req.log.error({ err }, "Failed to import sites CSV");
    res.status(500).json({ error: "Internal server error" });
  }
});

const GOOGLE_SHEETS_URL =
  "https://script.google.com/macros/s/AKfycbxU7WENKAEkhJnBvCPbcGqiwZbUr5ZTT93Gfpw6AmiP7lPYfGUobDpOZh1qvppYgF3RVw/exec";

/**
 * POST /sites/sync-sheets
 * Fetches live data from the Google Sheets Apps Script endpoint and upserts
 * all sites (by name). Only the allowed columns are copied.
 */
router.post("/sites/sync-sheets", async (req, res) => {
  try {
    const response = await fetch(GOOGLE_SHEETS_URL, { redirect: "follow" });
    if (!response.ok) {
      return res.status(502).json({ error: `Google Sheets fetch failed: ${response.status}` });
    }

    const json = await response.json() as {
      energyDashboard?: { headers: string[]; rows: (string | number)[][] };
    };

    const dashboard = json.energyDashboard;
    if (!dashboard?.headers || !dashboard?.rows) {
      return res.status(502).json({ error: "Unexpected response format from Google Sheets" });
    }

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

    if (idxName === -1) {
      return res.status(502).json({ error: "Column 'siteName' not found in Google Sheet" });
    }

    // Load existing sites keyed by name for O(1) lookup
    const existing = await db.select({ id: sitesTable.id, name: sitesTable.name }).from(sitesTable);
    const byName = new Map(existing.map((s) => [s.name.toLowerCase(), s.id]));

    let inserted = 0;
    let updated  = 0;
    let skipped  = 0;
    const errors: string[] = [];

    const safeFloat = (v: string | number | undefined) => {
      const n = parseFloat(String(v ?? ""));
      return isNaN(n) ? undefined : n;
    };

    for (const row of dashboard.rows) {
      const name = String(row[idxName] ?? "").trim();
      if (!name) { skipped++; continue; }

      const payload = {
        name,
        region:          idxRegion   >= 0 ? String(row[idxRegion]   ?? "")  : undefined,
        district:        idxDistrict >= 0 ? String(row[idxDistrict] ?? "")  : undefined,
        city:            idxCity     >= 0 ? String(row[idxCity]     ?? "")  : undefined,
        cowStatus:       idxStatus   >= 0 ? String(row[idxStatus]   ?? "ON-AIR") : undefined,
        siteLabel:       idxLabel    >= 0 ? String(row[idxLabel]    ?? "")  : undefined,
        lat:             safeFloat(row[idxLat]  as string),
        lng:             safeFloat(row[idxLng]  as string),
        nextFuelingPlan: idxNextPlan >= 0 ? String(row[idxNextPlan] ?? "")  : undefined,
        lastFuelingDate: idxLastDate >= 0 ? String(row[idxLastDate] ?? "")  : undefined,
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

    res.json({ inserted, updated, skipped, errors, total: dashboard.rows.length });
  } catch (err) {
    req.log.error({ err }, "Failed to sync sites from Google Sheets");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
