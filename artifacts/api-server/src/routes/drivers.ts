import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { driversTable, driverTasksTable, driverNotificationsTable, missionsTable } from "@workspace/db/schema";
import { eq, desc, or, isNull } from "drizzle-orm";
import crypto from "crypto";

const router: IRouter = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// List drivers
router.get("/drivers", async (req, res) => {
  try {
    const drivers = await db.select().from(driversTable).orderBy(driversTable.name);
    res.json(drivers.map((d) => ({
      id: d.id,
      name: d.name,
      phone: d.phone,
      email: d.email,
      zone: d.zone,
      active: d.active,
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to list drivers");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create driver
router.post("/drivers", async (req, res) => {
  try {
    const body = req.body;
    const [driver] = await db.insert(driversTable).values({
      name: body.name,
      phone: body.phone || "",
      email: body.email || "",
      zone: body.zone || "",
      active: body.active !== undefined ? body.active : true,
      passwordHash: body.password ? hashPassword(body.password) : "",
    }).returning();
    res.status(201).json({ id: driver.id, name: driver.name, phone: driver.phone, email: driver.email, zone: driver.zone, active: driver.active });
  } catch (err) {
    req.log.error({ err }, "Failed to create driver");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update driver
router.put("/drivers/:id", async (req, res) => {
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
    const [driver] = await db.update(driversTable).set(updateData).where(eq(driversTable.id, id)).returning();
    if (!driver) return res.status(404).json({ error: "Not found" });
    res.json({ id: driver.id, name: driver.name, phone: driver.phone, email: driver.email, zone: driver.zone, active: driver.active });
  } catch (err) {
    req.log.error({ err }, "Failed to update driver");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete driver
router.delete("/drivers/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(driversTable).where(eq(driversTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete driver");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Driver login
router.post("/driver/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const [driver] = await db.select().from(driversTable).where(eq(driversTable.email, email));
    if (!driver) return res.status(401).json({ error: "Invalid credentials" });
    if (!driver.active) return res.status(401).json({ error: "Account is inactive" });

    const hash = hashPassword(password);
    if (driver.passwordHash !== hash) return res.status(401).json({ error: "Invalid credentials" });

    res.json({
      success: true,
      driverId: driver.id,
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      zone: driver.zone,
      token: `driver-${driver.id}-${Date.now()}`,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to login driver");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get driver tasks
router.get("/driver/tasks", async (req, res) => {
  try {
    const driverId = parseInt(String(req.query.driverId));
    const tasks = await db.select().from(driverTasksTable).where(eq(driverTasksTable.driverId, driverId)).orderBy(desc(driverTasksTable.scheduledAt));
    res.json(tasks.map((t) => ({
      id: t.id,
      driverId: t.driverId,
      siteId: t.siteId,
      siteName: t.siteName,
      missionId: t.missionId,
      scheduledAt: t.scheduledAt?.toISOString() ?? null,
      status: t.status,
      requiredLiters: t.requiredLiters,
      actualInTank: t.actualInTank,
      quantityAdded: t.quantityAdded,
      notes: t.notes,
      createdAt: t.createdAt?.toISOString() ?? null,
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to list driver tasks");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get single driver task
router.get("/driver/tasks/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [task] = await db.select().from(driverTasksTable).where(eq(driverTasksTable.id, id));
    if (!task) return res.status(404).json({ error: "Not found" });
    res.json({
      id: task.id,
      driverId: task.driverId,
      siteId: task.siteId,
      siteName: task.siteName,
      missionId: task.missionId,
      scheduledAt: task.scheduledAt?.toISOString() ?? null,
      status: task.status,
      requiredLiters: task.requiredLiters,
      actualInTank: task.actualInTank,
      quantityAdded: task.quantityAdded,
      notes: task.notes,
      createdAt: task.createdAt?.toISOString() ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get driver task");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update driver task
router.put("/driver/tasks/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const body = req.body;
    const [task] = await db.update(driverTasksTable).set({
      status: body.status,
      actualInTank: body.actualInTank,
      quantityAdded: body.quantityAdded,
      notes: body.notes,
      observations: body.observations,
    }).where(eq(driverTasksTable.id, id)).returning();
    if (!task) return res.status(404).json({ error: "Not found" });
    res.json(task);
  } catch (err) {
    req.log.error({ err }, "Failed to update driver task");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get driver notifications
router.get("/driver/notifications", async (req, res) => {
  try {
    const driverId = parseInt(String(req.query.driverId));
    const notifs = await db.select().from(driverNotificationsTable)
      .where(eq(driverNotificationsTable.driverId, driverId))
      .orderBy(desc(driverNotificationsTable.createdAt));
    res.json(notifs.map((n) => ({
      id: n.id,
      driverId: n.driverId,
      title: n.title,
      message: n.message,
      type: n.type,
      read: n.read,
      createdAt: n.createdAt?.toISOString() ?? null,
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to list driver notifications");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all missions for driver app (filtered by driverId if provided)
router.get("/driver/missions", async (req, res) => {
  try {
    const driverId = req.query.driverId ? parseInt(String(req.query.driverId)) : null;
    const query = db.select().from(missionsTable);
    const missions = driverId
      ? await query.where(eq(missionsTable.assignedTechnicianId, driverId)).orderBy(desc(missionsTable.createdAt))
      : await query.orderBy(desc(missionsTable.createdAt));
    res.json(missions.map((m) => ({
      id: m.id,
      missionId: m.missionId,
      siteName: m.siteName,
      generator: m.generator,
      project: m.project,
      driverName: m.driverName,
      assignedDriver: m.assignedDriver,
      city: m.city,
      filledLiters: m.filledLiters,
      virtualCalculated: m.virtualCalculated,
      actualInTank: m.actualInTank,
      quantityAddedLastTask: m.quantityAddedLastTask,
      notes: m.notes,
      missionStatus: m.missionStatus,
      createdBy: m.createdBy,
      createdDate: m.createdDate?.toISOString() ?? null,
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to list driver missions");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get single mission for driver app
router.get("/driver/missions/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [mission] = await db.select().from(missionsTable).where(eq(missionsTable.id, id));
    if (!mission) return res.status(404).json({ error: "Mission not found" });
    res.json({
      id: mission.id,
      missionId: mission.missionId,
      siteName: mission.siteName,
      generator: mission.generator,
      project: mission.project,
      driverName: mission.driverName,
      assignedDriver: mission.assignedDriver,
      city: mission.city,
      filledLiters: mission.filledLiters,
      virtualCalculated: mission.virtualCalculated,
      actualInTank: mission.actualInTank,
      quantityAddedLastTask: mission.quantityAddedLastTask,
      notes: mission.notes,
      missionStatus: mission.missionStatus,
      createdBy: mission.createdBy,
      createdDate: mission.createdDate?.toISOString() ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get driver mission");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Driver updates mission status (e.g. mark as Finished by Driver)
router.put("/driver/missions/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { missionStatus, notes, driverName } = req.body;
    const [updated] = await db
      .update(missionsTable)
      .set({
        ...(missionStatus && { missionStatus }),
        ...(notes !== undefined && { notes }),
        ...(driverName && { driverName }),
      })
      .where(eq(missionsTable.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: "Mission not found" });
    res.json({ success: true, id: updated.id, missionStatus: updated.missionStatus });
  } catch (err) {
    req.log.error({ err }, "Failed to update driver mission");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
