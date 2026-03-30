import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const techniciansTable = pgTable("technicians", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  zone: text("zone").notNull().default(""),
  active: boolean("active").notNull().default(true),
  passwordHash: text("password_hash").notNull().default(""),
  expoPushToken: text("expo_push_token"),
  fcmToken: text("fcm_token"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTechnicianSchema = createInsertSchema(techniciansTable).omit({ id: true, createdAt: true });
export type InsertTechnician = z.infer<typeof insertTechnicianSchema>;
export type Technician = typeof techniciansTable.$inferSelect;
