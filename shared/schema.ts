import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Project model
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  jsonUrl: text("json_url").notNull(),
  jsonData: jsonb("json_data").notNull(),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastModified: timestamp("last_modified").defaultNow().notNull(),
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  jsonUrl: true,
  jsonData: true,
  userId: true,
});

// Color history model
export const colorHistory = pgTable("color_history", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  oldColor: text("old_color").notNull(),
  newColor: text("new_color").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertColorHistorySchema = createInsertSchema(colorHistory).pick({
  projectId: true,
  oldColor: true,
  newColor: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type InsertColorHistory = z.infer<typeof insertColorHistorySchema>;
export type ColorHistory = typeof colorHistory.$inferSelect;
