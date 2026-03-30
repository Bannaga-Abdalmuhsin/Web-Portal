import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { techniciansTable, missionsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import crypto from "crypto";

const router: IRouter = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// List technicians
router.get("/technicians", async (req, res) => {
  try {
    const technicians = await db.select().from(techniciansTable).orderBy(techniciansTable.name);
    res.json(technicians.map((t) => ({
      id: t.id,
      name: t.name,
      phone: t.phone,
      email: t.email,
      zone: t.zone,
      active: t.active,
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to list technicians");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create technician
router.post("/technicians", async (req, res) => {
  try {
    const body = req.body;
    const [technician] = await db.insert(techniciansTable).values({
      name: body.name,
      phone: body.phone || "",
      email: body.email || "",
      zone: body.zone || "",
      active: body.active !== undefined ? body.active : true,
      passwordHash: body.password ? hashPassword(body.password) : hashPassword("Tech@1234"),
    }).returning();
    res.status(201).json({ id: technician.id, name: technician.name, phone: technician.phone, email: technician.email, zone: technician.zone, active: technician.active });
  } catch (err) {
    req.log.error({ err }, "Failed to create technician");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update technician
router.put("/technicians/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const body = req.body;
    const updateData: any = {
      name: body.name,
      phone: body.phone,
      email: body.email,
      zone: body.zone,
      active: body.active,
    };
    if (body.password) updateData.passwordHash = hashPassword(body.password);
    const [technician] = await db.update(techniciansTable).set(updateData).where(eq(techniciansTable.id, id)).returning();
    if (!technician) return res.status(404).json({ error: "Not found" });
    res.json({ id: technician.id, name: technician.name, phone: technician.phone, email: technician.email, zone: technician.zone, active: technician.active });
  } catch (err) {
    req.log.error({ err }, "Failed to update technician");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete technician
router.delete("/technicians/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(techniciansTable).where(eq(techniciansTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete technician");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Technician App Routes ─────────────────────────────────────────────────────

// Technician login
router.post("/technician/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const [tech] = await db.select().from(techniciansTable).where(eq(techniciansTable.email, email));
    if (!tech) return res.status(401).json({ error: "Invalid credentials" });
    if (!tech.active) return res.status(401).json({ error: "Account is inactive" });

    if (tech.passwordHash !== hashPassword(password)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.json({
      success: true,
      technicianId: tech.id,
      name: tech.name,
      email: tech.email,
      zone: tech.zone,
      token: `tech-${tech.id}-${Date.now()}`,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to login technician");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Register Expo push token for technician
router.put("/technicians/:id/expo-push-token", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { expoPushToken } = req.body;
    if (!expoPushToken) return res.status(400).json({ error: "expoPushToken required" });
    const [tech] = await db.update(techniciansTable)
      .set({ expoPushToken })
      .where(eq(techniciansTable.id, id))
      .returning();
    if (!tech) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to register push token");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Technician missions list (for follow-up)
router.get("/technician/missions", async (req, res) => {
  try {
    const statusFilter = req.query.status as string | undefined;
    const technicianId = req.query.technicianId ? parseInt(req.query.technicianId as string) : undefined;

    let missions = await db.select().from(missionsTable).orderBy(desc(missionsTable.createdAt));

    if (statusFilter) {
      missions = missions.filter((m) => m.missionStatus === statusFilter);
    }

    if (technicianId) {
      missions = missions.filter((m) => m.assignedTechnicianId === technicianId);
    }

    res.json(missions.map((m) => ({
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
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to list technician missions");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Technician follow-up on mission
router.put("/technician/missions/:id/followup", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { technicianRemark, technicianStatus, reviewedBy } = req.body;

    const [mission] = await db.update(missionsTable).set({
      technicianRemark: technicianRemark ?? "",
      technicianStatus: technicianStatus ?? "Reviewed",
      reviewedBy: reviewedBy ?? "",
      reviewedAt: new Date(),
    }).where(eq(missionsTable.id, id)).returning();

    if (!mission) return res.status(404).json({ error: "Not found" });

    res.json({
      id: mission.id,
      missionId: mission.missionId,
      siteName: mission.siteName,
      generator: mission.generator,
      project: mission.project,
      driverName: mission.driverName,
      filledLiters: mission.filledLiters,
      virtualCalculated: mission.virtualCalculated,
      actualInTank: mission.actualInTank,
      quantityAddedLastTask: mission.quantityAddedLastTask,
      city: mission.city,
      notes: mission.notes,
      missionStatus: mission.missionStatus,
      createdBy: mission.createdBy,
      technicianRemark: mission.technicianRemark,
      technicianStatus: mission.technicianStatus,
      reviewedBy: mission.reviewedBy,
      reviewedAt: mission.reviewedAt?.toISOString() ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to follow up on mission");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
