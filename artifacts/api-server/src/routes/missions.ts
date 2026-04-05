import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { missionsTable, techniciansTable, sitesTable } from "@workspace/db/schema";
import { eq, desc, ne, and } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

async function sendExpoPushNotification(token: string, title: string, body: string, data?: Record<string, unknown>) {
  // Accept both "ExponentPushToken[...]" (Expo Go) and "ExpoPushToken[...]" (EAS builds)
  if (!token || !(token.startsWith("ExponentPushToken") || token.startsWith("ExpoPushToken"))) return;
  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ to: token, title, body, data: data ?? {} }),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      logger.warn({ status: response.status, body: text }, "Expo push send returned non-OK status");
    }
  } catch (err) {
    // Non-critical: push failures should not break the mission update request
    logger.warn({ err }, "Expo push notification failed (network/timeout)");
  }
}

router.get("/missions", async (req, res) => {
  try {
    const missions = await db.select().from(missionsTable).orderBy(desc(missionsTable.createdAt));
    const result = missions.map((m) => ({
      id: m.id,
      missionId: m.missionId,
      siteName: m.siteName,
      generator: m.generator,
      project: m.project,
      driverName: m.driverName,
      assignedDriver: m.assignedDriver,
      createdDate: m.createdDate?.toISOString() ?? null,
      filledLiters: m.filledLiters,
      virtualCalculated: m.virtualCalculated,
      actualInTank: m.actualInTank,
      quantityAddedLastTask: m.quantityAddedLastTask,
      city: m.city,
      notes: m.notes,
      missionStatus: m.missionStatus,
      createdBy: m.createdBy,
      technicianRemark: m.technicianRemark,
      technicianStatus: m.technicianStatus,
      reviewedBy: m.reviewedBy,
      reviewedAt: m.reviewedAt?.toISOString() ?? null,
      assignedTechnicianId: m.assignedTechnicianId,
    }));
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to list missions");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/missions", async (req, res) => {
  try {
    const body = req.body;
    const missionId = `MSN-${Date.now()}`;
    const [mission] = await db.insert(missionsTable).values({
      missionId,
      siteName: body.siteName || "",
      generator: body.generator || "",
      project: body.project || "stc COW",
      driverName: body.driverName || "",
      assignedDriver: body.assignedDriver || "",
      filledLiters: body.filledLiters || 0,
      virtualCalculated: body.virtualCalculated || 0,
      actualInTank: body.actualInTank || 0,
      quantityAddedLastTask: body.quantityAddedLastTask || 0,
      city: body.city || "",
      notes: body.notes || "",
      missionStatus: body.missionStatus || "Creation",
      createdBy: body.createdBy || "",
      assignedTechnicianId: body.assignedTechnicianId ?? null,
    }).returning();
    // Send push notification if a technician was assigned at creation time
    if (mission.assignedTechnicianId) {
      const [tech] = await db.select().from(techniciansTable)
        .where(eq(techniciansTable.id, mission.assignedTechnicianId));
      const pushToken = tech?.fcmToken ?? tech?.expoPushToken ?? null;
      if (pushToken) {
        sendExpoPushNotification(
          pushToken,
          "New Mission Assigned",
          `Site: ${mission.siteName} — ${mission.missionId}`,
          { missionId: mission.id },
        );
      }
    }

    res.status(201).json(mission);
  } catch (err) {
    req.log.error({ err }, "Failed to create mission");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/missions/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [mission] = await db.select().from(missionsTable).where(eq(missionsTable.id, id));
    if (!mission) return res.status(404).json({ error: "Not found" });
    res.json(mission);
  } catch (err) {
    req.log.error({ err }, "Failed to get mission");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/missions/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const body = req.body;

    const [before] = await db.select().from(missionsTable).where(eq(missionsTable.id, id));

    const updateData: Partial<typeof missionsTable.$inferInsert> = {
      siteName: body.siteName,
      generator: body.generator,
      project: body.project,
      driverName: body.driverName,
      assignedDriver: body.assignedDriver,
      filledLiters: body.filledLiters,
      virtualCalculated: body.virtualCalculated,
      actualInTank: body.actualInTank,
      quantityAddedLastTask: body.quantityAddedLastTask,
      city: body.city,
      notes: body.notes,
      missionStatus: body.missionStatus,
    };

    if (body.assignedTechnicianId !== undefined) {
      updateData.assignedTechnicianId = body.assignedTechnicianId ?? null;
    }

    const [updated] = await db.update(missionsTable).set(updateData).where(eq(missionsTable.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "Not found" });

    // Send push notification if a technician was newly assigned
    const newTechId = body.assignedTechnicianId;
    const oldTechId = before?.assignedTechnicianId;
    if (newTechId && newTechId !== oldTechId) {
      const [tech] = await db.select().from(techniciansTable).where(eq(techniciansTable.id, newTechId));
      const pushToken = tech?.fcmToken ?? tech?.expoPushToken ?? null;
      if (pushToken) {
        sendExpoPushNotification(
          pushToken,
          "New Mission Assigned",
          `Site: ${updated.siteName} — ${updated.missionId}`,
          { missionId: updated.id },
        );
      }
    }

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update mission");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/missions/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(missionsTable).where(eq(missionsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete mission");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /missions/generate-from-sites
 * Creates missions for every site whose nextFuelingPlan is today or overdue,
 * skipping any site that already has an open (non-Canceled) mission.
 */
router.post("/missions/generate-from-sites", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch all sites with a fueling plan date
    const sites = await db.select().from(sitesTable);

    // Fetch existing open missions (not Canceled) to avoid duplicates
    const openMissions = await db
      .select({ siteName: missionsTable.siteName })
      .from(missionsTable)
      .where(ne(missionsTable.missionStatus, "Canceled"));
    const openSiteNames = new Set(openMissions.map((m) => m.siteName.toLowerCase()));

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Date stamp for mission IDs: YYYYMMDD
    const stamp = today.toISOString().slice(0, 10).replace(/-/g, "");

    for (const site of sites) {
      const planStr = (site.nextFuelingPlan ?? "").trim();
      if (!planStr || planStr === "#N/A") { skipped++; continue; }

      // Parse MM-DD-YYYY format
      const parts = planStr.split("-");
      if (parts.length !== 3) { skipped++; continue; }
      const [mm, dd, yyyy] = parts;
      const planDate = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
      planDate.setHours(0, 0, 0, 0);
      if (isNaN(planDate.getTime()) || planDate > today) { skipped++; continue; }

      // Skip if an open mission already exists for this site
      if (openSiteNames.has(site.name.toLowerCase())) { skipped++; continue; }

      try {
        const missionId = `MSN-${stamp}-${site.name}`;
        await db.insert(missionsTable).values({
          missionId,
          siteName:              site.name,
          generator:             site.name,
          project:               site.project || "stc COW",
          city:                  site.city || "",
          driverName:            "",
          assignedDriver:        "",
          filledLiters:          0,
          virtualCalculated:     0,
          actualInTank:          0,
          quantityAddedLastTask: site.lastFuelingQty ?? 0,
          missionStatus:         "Creation",
          createdBy:             "System",
          notes:                 `Auto-generated — plan date: ${planStr}`,
          assignedTechnicianId:  site.assignedTechnicianId ?? undefined,
        });
        openSiteNames.add(site.name.toLowerCase()); // prevent double-insert in same run
        created++;
      } catch (err) {
        errors.push(`"${site.name}": ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    res.json({ created, skipped, errors, total: sites.length });
  } catch (err) {
    req.log.error({ err }, "Failed to generate missions from sites");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
