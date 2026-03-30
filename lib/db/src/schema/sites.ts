import { pgTable, serial, text, boolean, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sitesTable = pgTable("sites", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  district: text("district").notNull().default(""),
  city: text("city").notNull().default(""),
  project: text("project").notNull().default("stc COW"),
  cowStatus: text("cow_status").notNull().default("ON-AIR"),
  active: boolean("active").notNull().default(true),
  currentLiters: real("current_liters").notNull().default(0),
  dailyVirtual: real("daily_virtual").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSiteSchema = createInsertSchema(sitesTable).omit({ id: true, createdAt: true });
export type InsertSite = z.infer<typeof insertSiteSchema>;
export type Site = typeof sitesTable.$inferSelect;
