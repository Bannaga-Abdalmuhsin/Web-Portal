import { pgTable, serial, text, real, timestamp, integer } from "drizzle-orm/pg-core";

export const driverEntriesTable = pgTable("driver_entries", {
  id: serial("id").primaryKey(),
  missionId: integer("mission_id").notNull(),
  missionRef: text("mission_ref").notNull().default(""),
  siteName: text("site_name").notNull().default(""),
  driverId: integer("driver_id"),
  driverName: text("driver_name").notNull().default(""),
  litersBefore: real("liters_before"),
  litersAdded: real("liters_added"),
  completionDate: timestamp("completion_date"),
  notes: text("notes").default(""),
  odoBeforePhoto: text("odo_before_photo"),
  odoAfterPhoto: text("odo_after_photo"),
  tankBeforePhoto: text("tank_before_photo"),
  tankAfterPhoto: text("tank_after_photo"),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

export type DriverEntry = typeof driverEntriesTable.$inferSelect;
