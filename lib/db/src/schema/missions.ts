import { pgTable, serial, text, real, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const missionsTable = pgTable("missions", {
  id: serial("id").primaryKey(),
  missionId: text("mission_id").notNull().default(""),
  siteName: text("site_name").notNull(),
  generator: text("generator").notNull().default(""),
  project: text("project").notNull().default("stc COW"),
  driverName: text("driver_name").notNull().default(""),
  assignedDriver: text("assigned_driver").notNull().default(""),
  createdDate: timestamp("created_date").defaultNow(),
  filledLiters: real("filled_liters").notNull().default(0),
  virtualCalculated: real("virtual_calculated").notNull().default(0),
  actualInTank: real("actual_in_tank").notNull().default(0),
  quantityAddedLastTask: real("quantity_added_last_task").notNull().default(0),
  city: text("city").notNull().default(""),
  notes: text("notes").default(""),
  missionStatus: text("mission_status").notNull().default("Creation"),
  createdBy: text("created_by").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMissionSchema = createInsertSchema(missionsTable).omit({ id: true, createdAt: true });
export type InsertMission = z.infer<typeof insertMissionSchema>;
export type Mission = typeof missionsTable.$inferSelect;
