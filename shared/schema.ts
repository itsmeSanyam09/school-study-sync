import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  grade: text("grade"),
  totalStudyHours: integer("total_study_hours").default(0)
});

export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  examDate: timestamp("exam_date").notNull(),
  completed: boolean("completed").default(false)
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id").notNull(),
  description: text("description").notNull(),
  completed: boolean("completed").default(false)
});

export const studyLogs = pgTable("study_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  subjectId: integer("subject_id").notNull(),
  duration: integer("duration").notNull(),
  date: timestamp("date").notNull()
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  grade: true
});

export const insertSubjectSchema = createInsertSchema(subjects).pick({
  name: true,
  examDate: true
});

export const insertTaskSchema = createInsertSchema(tasks).pick({
  description: true,
  subjectId: true
});

export const insertStudyLogSchema = createInsertSchema(studyLogs).pick({
  subjectId: true,
  duration: true,
  date: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertStudyLog = z.infer<typeof insertStudyLogSchema>;

export type User = typeof users.$inferSelect;
export type Subject = typeof subjects.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type StudyLog = typeof studyLogs.$inferSelect;
