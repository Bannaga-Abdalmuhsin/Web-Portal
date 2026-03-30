import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { missionsTable, techniciansTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

async function sendExpoPushNotification(token: string, title: string, body: string, data?: Record<string, unknown>) {
  // Accept both "ExponentPushToken[...]" (Expo Go) and "ExpoPushToken[...]" (EAS builds)
  if (!token || !(token.startsWith("ExponentPushToken") || token.startsWith("ExpoPushToken"))) return;
  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ to: token, title, body, data: data ?? {} }),
    });
  } catch {
    // Non-critical: push failures should not break the request
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

export default router;
