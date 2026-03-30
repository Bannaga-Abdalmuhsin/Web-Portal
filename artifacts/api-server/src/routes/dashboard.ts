import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { missionsTable, driversTable } from "@workspace/db/schema";
import { sql, and, gte, eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard/kpis", async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [litersToday] = await db
      .select({ total: sql<number>`COALESCE(SUM(${missionsTable.filledLiters}), 0)` })
      .from(missionsTable)
      .where(gte(missionsTable.createdDate, todayStart));

    const [liters30d] = await db
      .select({ total: sql<number>`COALESCE(SUM(${missionsTable.filledLiters}), 0)` })
      .from(missionsTable)
      .where(gte(missionsTable.createdDate, thirtyDaysAgo));

    const [activeMissions] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(missionsTable)
      .where(eq(missionsTable.missionStatus, "Creation"));

    const [activeDrivers] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(driversTable)
      .where(eq(driversTable.active, true));

    const missionsByStatus = await db
      .select({ status: missionsTable.missionStatus, count: sql<number>`COUNT(*)` })
      .from(missionsTable)
      .groupBy(missionsTable.missionStatus);

    const missionsByZone = await db
      .select({ zone: missionsTable.city, count: sql<number>`COUNT(*)` })
      .from(missionsTable)
      .groupBy(missionsTable.city);

    const litersByZone = await db
      .select({ zone: missionsTable.city, liters: sql<number>`COALESCE(SUM(${missionsTable.filledLiters}), 0)` })
      .from(missionsTable)
      .groupBy(missionsTable.city);

    const missionsByCategory = await db
      .select({ category: missionsTable.project, count: sql<number>`COUNT(*)` })
      .from(missionsTable)
      .groupBy(missionsTable.project);

    const approvedForInvoicing = await db
      .select({
        siteName: missionsTable.siteName,
        liters: missionsTable.filledLiters,
        date: missionsTable.createdDate,
      })
      .from(missionsTable)
      .where(eq(missionsTable.missionStatus, "Task approved"))
      .limit(20);

    res.json({
      litersToday: Number(litersToday?.total ?? 0),
      liters30d: Number(liters30d?.total ?? 0),
      activeMissions: Number(activeMissions?.count ?? 0),
      activeDrivers: Number(activeDrivers?.count ?? 0),
      missionsByStatus: missionsByStatus.map((r) => ({ status: r.status, count: Number(r.count) })),
      missionsByZone: missionsByZone.map((r) => ({ zone: r.zone || "Unknown", count: Number(r.count) })),
      litersByZone: litersByZone.map((r) => ({ zone: r.zone || "Unknown", liters: Number(r.liters) })),
      missionsByCategory: missionsByCategory.map((r) => ({ category: r.category || "Unknown", count: Number(r.count) })),
      approvedForInvoicing: approvedForInvoicing.map((r) => ({
        siteName: r.siteName,
        liters: r.liters,
        date: r.date?.toISOString() ?? null,
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get dashboard KPIs");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
