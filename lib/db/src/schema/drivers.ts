import { pgTable, serial, text, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const driversTable = pgTable("drivers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  zone: text("zone").notNull().default(""),
  active: boolean("active").notNull().default(true),
  passwordHash: text("password_hash").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const driverTasksTable = pgTable("driver_tasks", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").notNull(),
  siteId: integer("site_id").notNull().default(0),
  siteName: text("site_name").notNull(),
  missionId: text("mission_id").notNull().default(""),
  scheduledAt: timestamp("scheduled_at").defaultNow(),
  status: text("status").notNull().default("pending"),
  requiredLiters: serial("required_liters"),
  actualInTank: serial("actual_in_tank"),
  quantityAdded: serial("quantity_added"),
  notes: text("notes").default(""),
  observations: text("observations").default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const driverNotificationsTable = pgTable("driver_notifications", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id"),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDriverSchema = createInsertSchema(driversTable).omit({ id: true, createdAt: true });
export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type Driver = typeof driversTable.$inferSelect;

export const insertDriverTaskSchema = createInsertSchema(driverTasksTable).omit({ id: true, createdAt: true });
export type InsertDriverTask = z.infer<typeof insertDriverTaskSchema>;
export type DriverTask = typeof driverTasksTable.$inferSelect;

export const insertDriverNotificationSchema = createInsertSchema(driverNotificationsTable).omit({ id: true, createdAt: true });
export type InsertDriverNotification = z.infer<typeof insertDriverNotificationSchema>;
export type DriverNotification = typeof driverNotificationsTable.$inferSelect;
