import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { techniciansTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

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

router.post("/technicians", async (req, res) => {
  try {
    const body = req.body;
    const [technician] = await db.insert(techniciansTable).values({
      name: body.name,
      phone: body.phone || "",
      email: body.email || "",
      zone: body.zone || "",
      active: body.active !== undefined ? body.active : true,
    }).returning();
    res.status(201).json(technician);
  } catch (err) {
    req.log.error({ err }, "Failed to create technician");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/technicians/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const body = req.body;
    const [technician] = await db.update(techniciansTable).set({
      name: body.name,
      phone: body.phone,
      email: body.email,
      zone: body.zone,
      active: body.active,
    }).where(eq(techniciansTable.id, id)).returning();
    if (!technician) return res.status(404).json({ error: "Not found" });
    res.json(technician);
  } catch (err) {
    req.log.error({ err }, "Failed to update technician");
    res.status(500).json({ error: "Internal server error" });
  }
});

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

export default router;
