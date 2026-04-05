import { pgTable, serial, text, real, timestamp, integer, boolean } from "drizzle-orm/pg-core";

export const reportLinesTable = pgTable("report_lines", {
  id: serial("id").primaryKey(),
  missionId: integer("mission_id").notNull(),
  missionRef: text("mission_ref").notNull().default(""),
  siteName: text("site_name").notNull().default(""),
  region: text("region").notNull().default(""),
  project: text("project").notNull().default(""),
  driverName: text("driver_name").notNull().default(""),
  litersAdded: real("liters_added").notNull().default(0),
  completionDate: timestamp("completion_date"),
  approvedAt: timestamp("approved_at").defaultNow(),
  approvedBy: text("approved_by").notNull().default(""),
  unitPrice: real("unit_price").notNull().default(0.63),
  invoicePeriodStart: timestamp("invoice_period_start"),
  invoicePeriodEnd: timestamp("invoice_period_end"),
  invoiceExported: boolean("invoice_exported").notNull().default(false),
});

export type ReportLine = typeof reportLinesTable.$inferSelect;
