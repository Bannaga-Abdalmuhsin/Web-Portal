import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { adminsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const router: IRouter = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

router.get("/admins", async (req, res) => {
  try {
    const admins = await db.select().from(adminsTable).orderBy(adminsTable.name);
    res.json(admins.map((a) => ({
      id: a.id,
      name: a.name,
      username: a.username,
      email: a.email,
      position: a.position,
      role: a.role,
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to list admins");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admins", async (req, res) => {
  try {
    const body = req.body;
    const [admin] = await db.insert(adminsTable).values({
      name: body.name,
      username: body.username,
      email: body.email || "",
      passwordHash: body.password ? hashPassword(body.password) : "",
      position: body.position || "User",
      role: body.role || "superadmin",
    }).returning();
    res.status(201).json({ id: admin.id, name: admin.name, username: admin.username, email: admin.email, position: admin.position, role: admin.role });
  } catch (err) {
    req.log.error({ err }, "Failed to create admin");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/admins/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const body = req.body;
    const updateData: any = {
      name: body.name,
      username: body.username,
      email: body.email,
      position: body.position,
      role: body.role,
    };
    if (body.password) updateData.passwordHash = hashPassword(body.password);
    const [admin] = await db.update(adminsTable).set(updateData).where(eq(adminsTable.id, id)).returning();
    if (!admin) return res.status(404).json({ error: "Not found" });
    res.json({ id: admin.id, name: admin.name, username: admin.username, email: admin.email, position: admin.position, role: admin.role });
  } catch (err) {
    req.log.error({ err }, "Failed to update admin");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/admins/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(adminsTable).where(eq(adminsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete admin");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Username and password required" });

    const admins = await db.select().from(adminsTable).where(eq(adminsTable.username, username));
    const admin = admins[0];

    if (admin) {
      const hash = hashPassword(password);
      if (admin.passwordHash !== hash) return res.status(401).json({ error: "Invalid credentials" });
      return res.json({
        success: true,
        role: admin.role || "superadmin",
        username: admin.username,
      });
    }

    // Fallback: hardcoded default admin
    if (username === "Bannaga" && password === "Aces@6343") {
      return res.json({
        success: true,
        role: "superadmin",
        username: "Bannaga",
      });
    }

    res.status(401).json({ error: "Invalid credentials" });
  } catch (err) {
    req.log.error({ err }, "Failed to login admin");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
