import { pgTable, serial, real, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  fuelUnitPrice: real("fuel_unit_price").notNull().default(0.63),
  vatRate: real("vat_rate").notNull().default(0.15),
  supplierName: text("supplier_name").notNull().default(""),
  supplierAddress: text("supplier_address").notNull().default(""),
  invoicePrefix: text("invoice_prefix").notNull().default("INV-SEC-"),
  invoiceSequence: integer("invoice_sequence").notNull().default(1),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSettingsSchema = createInsertSchema(settingsTable).omit({ id: true, updatedAt: true });
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type AppSettings = typeof settingsTable.$inferSelect;
