import { pgTable, serial, text, boolean, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const generatorsTable = pgTable("generators", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  site: text("site").notNull().default(""),
  siteId: integer("site_id").default(0),
  dailyVirtual: real("daily_virtual").notNull().default(0),
  lastAvg: real("last_avg").notNull().default(0),
  rateOk: boolean("rate_ok").notNull().default(true),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGeneratorSchema = createInsertSchema(generatorsTable).omit({ id: true, createdAt: true });
export type InsertGenerator = z.infer<typeof insertGeneratorSchema>;
export type Generator = typeof generatorsTable.$inferSelect;
