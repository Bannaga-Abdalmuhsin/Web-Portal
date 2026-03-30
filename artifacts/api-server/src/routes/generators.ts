import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { generatorsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/generators", async (req, res) => {
  try {
    const generators = await db.select().from(generatorsTable).orderBy(generatorsTable.name);
    res.json(generators.map((g) => ({
      id: g.id,
      name: g.name,
      site: g.site,
      siteId: g.siteId,
      dailyVirtual: g.dailyVirtual,
      lastAvg: g.lastAvg,
      rateOk: g.rateOk,
      active: g.active,
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to list generators");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/generators", async (req, res) => {
  try {
    const body = req.body;
    const [generator] = await db.insert(generatorsTable).values({
      name: body.name,
      site: body.site || "",
      siteId: body.siteId || 0,
      dailyVirtual: body.dailyVirtual || 0,
      lastAvg: body.lastAvg || 0,
      rateOk: body.rateOk !== undefined ? body.rateOk : true,
      active: body.active !== undefined ? body.active : true,
    }).returning();
    res.status(201).json(generator);
  } catch (err) {
    req.log.error({ err }, "Failed to create generator");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/generators/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const body = req.body;
    const [generator] = await db.update(generatorsTable).set({
      name: body.name,
      site: body.site,
      siteId: body.siteId,
      dailyVirtual: body.dailyVirtual,
      lastAvg: body.lastAvg,
      rateOk: body.rateOk,
      active: body.active,
    }).where(eq(generatorsTable.id, id)).returning();
    if (!generator) return res.status(404).json({ error: "Not found" });
    res.json(generator);
  } catch (err) {
    req.log.error({ err }, "Failed to update generator");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/generators/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(generatorsTable).where(eq(generatorsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete generator");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
