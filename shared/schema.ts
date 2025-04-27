import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Employee schema
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Behavior log schema
export const behaviorLogs = pgTable("behavior_logs", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employees.id, { onDelete: 'cascade' }),
  status: text("status").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Screenshot schema
export const screenshots = pgTable("screenshots", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employees.id, { onDelete: 'cascade' }),
  imageData: text("image_data").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Work submission schema
export const workSubmissions = pgTable("work_submissions", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employees.id, { onDelete: 'cascade' }),
  description: text("description").notNull(),
  fileData: text("file_data").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Screen recording schema
export const recordings = pgTable("recordings", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employees.id, { onDelete: 'cascade' }),
  videoData: text("video_data").notNull(),
  mimeType: text("mime_type").notNull(),
  duration: integer("duration"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Relations
export const employeesRelations = relations(employees, ({ many }) => ({
  behaviorLogs: many(behaviorLogs),
  screenshots: many(screenshots),
  workSubmissions: many(workSubmissions),
  recordings: many(recordings),
}));

export const behaviorLogsRelations = relations(behaviorLogs, ({ one }) => ({
  employee: one(employees, {
    fields: [behaviorLogs.employeeId],
    references: [employees.id],
  }),
}));

export const screenshotsRelations = relations(screenshots, ({ one }) => ({
  employee: one(employees, {
    fields: [screenshots.employeeId],
    references: [employees.id],
  }),
}));

export const workSubmissionsRelations = relations(workSubmissions, ({ one }) => ({
  employee: one(employees, {
    fields: [workSubmissions.employeeId],
    references: [employees.id],
  }),
}));

export const recordingsRelations = relations(recordings, ({ one }) => ({
  employee: one(employees, {
    fields: [recordings.employeeId],
    references: [employees.id],
  }),
}));

// Zod insert schemas
export const insertEmployeeSchema = createInsertSchema(employees).pick({ name: true });
export const insertBehaviorLogSchema = createInsertSchema(behaviorLogs).pick({ employeeId: true, status: true });
export const insertScreenshotSchema = createInsertSchema(screenshots).pick({ employeeId: true, imageData: true });
export const insertWorkSubmissionSchema = createInsertSchema(workSubmissions).pick({
  employeeId: true,
  description: true,
  fileData: true,
  fileName: true,
  fileSize: true,
});
export const insertRecordingSchema = createInsertSchema(recordings).pick({
  employeeId: true,
  videoData: true,
  mimeType: true,
  duration: true,
});

// Type exports
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type BehaviorLog = typeof behaviorLogs.$inferSelect;
export type InsertBehaviorLog = z.infer<typeof insertBehaviorLogSchema>;

export type Screenshot = typeof screenshots.$inferSelect;
export type InsertScreenshot = z.infer<typeof insertScreenshotSchema>;

export type WorkSubmission = typeof workSubmissions.$inferSelect;
export type InsertWorkSubmission = z.infer<typeof insertWorkSubmissionSchema>;

export type Recording = typeof recordings.$inferSelect;
export type InsertRecording = z.infer<typeof insertRecordingSchema>;

// Status type validation
export const BehaviorStatus = z.enum(["working", "idle", "sleeping", "moving", "inactive"]);
export type BehaviorStatusType = z.infer<typeof BehaviorStatus>;
