import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sitesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/sites", async (req, res) => {
  try {
    const sites = await db.select().from(sitesTable).orderBy(sitesTable.name);
    res.json(sites.map((s) => ({
      id: s.id,
      name: s.name,
      generator: s.name,
      district: s.district,
      city: s.city,
      project: s.project,
      cowStatus: s.cowStatus,
      active: s.active,
      currentLiters: s.currentLiters,
      dailyVirtual: s.dailyVirtual,
    })));
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
      district: body.district || "",
      city: body.city || "",
      project: body.project || "stc COW",
      cowStatus: body.cowStatus || "ON-AIR",
      active: body.active !== undefined ? body.active : true,
    }).returning();
    res.status(201).json(site);
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
      district: body.district,
      city: body.city,
      project: body.project,
      cowStatus: body.cowStatus,
      active: body.active,
    }).where(eq(sitesTable.id, id)).returning();
    if (!site) return res.status(404).json({ error: "Not found" });
    res.json(site);
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

export default router;
