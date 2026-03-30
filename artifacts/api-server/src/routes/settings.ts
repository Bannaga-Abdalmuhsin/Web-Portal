import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/settings", async (req, res) => {
  try {
    const [settings] = await db.select().from(settingsTable).limit(1);
    if (!settings) {
      const [created] = await db.insert(settingsTable).values({}).returning();
      return res.json({
        id: created.id,
        fuelUnitPrice: created.fuelUnitPrice,
        vatRate: created.vatRate,
        supplierName: created.supplierName,
        supplierAddress: created.supplierAddress,
        invoicePrefix: created.invoicePrefix,
        invoiceSequence: created.invoiceSequence,
      });
    }
    res.json({
      id: settings.id,
      fuelUnitPrice: settings.fuelUnitPrice,
      vatRate: settings.vatRate,
      supplierName: settings.supplierName,
      supplierAddress: settings.supplierAddress,
      invoicePrefix: settings.invoicePrefix,
      invoiceSequence: settings.invoiceSequence,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get settings");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/settings", async (req, res) => {
  try {
    const body = req.body;
    const [existing] = await db.select().from(settingsTable).limit(1);
    if (!existing) {
      const [created] = await db.insert(settingsTable).values({
        fuelUnitPrice: body.fuelUnitPrice ?? 0.63,
        vatRate: body.vatRate ?? 0.15,
        supplierName: body.supplierName ?? "",
        supplierAddress: body.supplierAddress ?? "",
        invoicePrefix: body.invoicePrefix ?? "INV-SEC-",
        invoiceSequence: body.invoiceSequence ?? 1,
      }).returning();
      return res.json(created);
    }
    const [updated] = await db.update(settingsTable).set({
      fuelUnitPrice: body.fuelUnitPrice,
      vatRate: body.vatRate,
      supplierName: body.supplierName,
      supplierAddress: body.supplierAddress,
      invoicePrefix: body.invoicePrefix,
      invoiceSequence: body.invoiceSequence,
    }).where(eq(settingsTable.id, existing.id)).returning();
    res.json({
      id: updated.id,
      fuelUnitPrice: updated.fuelUnitPrice,
      vatRate: updated.vatRate,
      supplierName: updated.supplierName,
      supplierAddress: updated.supplierAddress,
      invoicePrefix: updated.invoicePrefix,
      invoiceSequence: updated.invoiceSequence,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update settings");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
