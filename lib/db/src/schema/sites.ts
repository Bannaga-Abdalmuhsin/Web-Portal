import { pgTable, serial, text, boolean, real, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sitesTable = pgTable("sites", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  region: text("region").default(""),
  district: text("district").notNull().default(""),
  city: text("city").notNull().default(""),
  project: text("project").notNull().default("stc COW"),
  cowStatus: text("cow_status").notNull().default("ON-AIR"),
  siteLabel: text("site_label").default(""),
  lat: real("lat"),
  lng: real("lng"),
  nextFuelingPlan: text("next_fueling_plan").default(""),
  lastFuelingDate: text("last_fueling_date").default(""),
  lastFuelingQty: real("last_fueling_qty"),
  active: boolean("active").notNull().default(true),
  currentLiters: real("current_liters").notNull().default(0),
  dailyVirtual: real("daily_virtual").notNull().default(0),
  assignedTechnicianId: integer("assigned_technician_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSiteSchema = createInsertSchema(sitesTable).omit({ id: true, createdAt: true });
export type InsertSite = z.infer<typeof insertSiteSchema>;
export type Site = typeof sitesTable.$inferSelect;
