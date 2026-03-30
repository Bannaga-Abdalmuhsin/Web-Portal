import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db/schema";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/notifications", async (req, res) => {
  try {
    const notifs = await db.select().from(notificationsTable).orderBy(desc(notificationsTable.createdAt));
    res.json(notifs.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      driverName: n.driverName,
      sentBy: n.sentBy,
      createdAt: n.createdAt?.toISOString() ?? null,
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to list notifications");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/notifications", async (req, res) => {
  try {
    const body = req.body;
    const [notif] = await db.insert(notificationsTable).values({
      title: body.title,
      message: body.message,
      driverName: body.driverName || null,
      sentBy: body.sentBy || "Admin",
    }).returning();
    res.status(201).json(notif);
  } catch (err) {
    req.log.error({ err }, "Failed to create notification");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
