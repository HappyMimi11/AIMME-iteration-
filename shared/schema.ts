import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password"), // Optional for OAuth users
  displayName: text("display_name"),
  photoURL: text("photo_url"),
  provider: text("provider").default("local"), // "local", "google", etc.
  providerId: text("provider_id"), // For OAuth users
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  displayName: true,
  photoURL: true,
  provider: true,
  providerId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Documents table
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: jsonb("content").notNull().default({}),
  category: text("category").notNull().default('default'), // e.g. 'collection_bucket', 'next_actions', etc.
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  title: true,
  content: true,
  category: true,
  userId: true,
});

export const updateDocumentSchema = createInsertSchema(documents).pick({
  title: true,
  content: true,
  category: true,
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type UpdateDocument = z.infer<typeof updateDocumentSchema>;
export type Document = typeof documents.$inferSelect;

// Define relations
import { relations } from "drizzle-orm";

export const userRelations = relations(users, ({ many }) => ({
  documents: many(documents),
  taskGroups: many(taskGroups),
  tasks: many(tasks),
}));

export const documentRelations = relations(documents, ({ one }) => ({
  user: one(users, {
    fields: [documents.userId],
    references: [users.id],
  }),
}));

// Task Groups table
export const taskGroups = pgTable("task_groups", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  color: text("color").default("#2563EB"),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTaskGroupSchema = createInsertSchema(taskGroups).pick({
  title: true,
  color: true,
  userId: true,
  order: true,
});

export const updateTaskGroupSchema = createInsertSchema(taskGroups).pick({
  title: true,
  color: true,
  order: true,
});

export type InsertTaskGroup = z.infer<typeof insertTaskGroupSchema>;
export type UpdateTaskGroup = z.infer<typeof updateTaskGroupSchema>;
export type TaskGroup = typeof taskGroups.$inferSelect;

// Tasks table
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  completed: boolean("completed").notNull().default(false),
  description: text("description").default(""),
  groupId: integer("group_id").references(() => taskGroups.id, { onDelete: 'cascade' }),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }),
  order: integer("order").notNull().default(0),
  dueDate: timestamp("due_date"),
  priority: text("priority").default("medium"), // low, medium, high
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasks).pick({
  title: true,
  completed: true,
  description: true,
  groupId: true,
  userId: true,
  order: true,
  dueDate: true,
  priority: true,
});

export const updateTaskSchema = createInsertSchema(tasks).pick({
  title: true,
  completed: true,
  description: true,
  groupId: true,
  order: true,
  dueDate: true,
  priority: true,
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;
export type Task = typeof tasks.$inferSelect;

// Additional relations
export const taskGroupRelations = relations(taskGroups, ({ one, many }) => ({
  user: one(users, {
    fields: [taskGroups.userId],
    references: [users.id],
  }),
  tasks: many(tasks),
}));

export const taskRelations = relations(tasks, ({ one }) => ({
  group: one(taskGroups, {
    fields: [tasks.groupId],
    references: [taskGroups.id],
  }),
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
}));

// Sessions table
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  importantAction: text("important_action").notNull(),
  smartGoals: text("smart_goals").notNull(),
  metastrategicThinking: text("metastrategic_thinking").notNull(),
  murphyjitsu: text("murphyjitsu"),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }),
  isCompleted: boolean("is_completed").notNull().default(false),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Create schema without date fields first
const baseInsertSessionSchema = createInsertSchema(sessions).pick({
  title: true,
  importantAction: true,
  smartGoals: true,
  metastrategicThinking: true,
  murphyjitsu: true,
  userId: true,
  isCompleted: true,
});

// Now create a custom insert schema with proper date handling
export const insertSessionSchema = baseInsertSessionSchema.extend({
  // Make startedAt and completedAt optional in the schema and handle them in the API
  startedAt: z.union([z.date(), z.string(), z.null()]).optional(),
  completedAt: z.union([z.date(), z.string(), z.null()]).optional(),
});

// Create the base update schema without date fields
const baseUpdateSessionSchema = createInsertSchema(sessions).partial().pick({
  title: true,
  importantAction: true,
  smartGoals: true,
  metastrategicThinking: true,
  murphyjitsu: true,
  isCompleted: true,
});

// Now create a custom update schema with proper date handling
export const updateSessionSchema = baseUpdateSessionSchema.extend({
  // Accept both Date objects and strings for completedAt
  completedAt: z.union([z.date(), z.string(), z.null()]).optional(),
});

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type UpdateSession = z.infer<typeof updateSessionSchema>;
export type Session = typeof sessions.$inferSelect;

export const sessionRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const userRelationsWithSessions = relations(users, ({ many }) => ({
  documents: many(documents),
  taskGroups: many(taskGroups),
  tasks: many(tasks),
  sessions: many(sessions),
}));
