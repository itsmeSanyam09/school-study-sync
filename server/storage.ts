import { IStorage } from "./types";
import {
  User, Subject, Task, StudyLog,
  InsertUser, InsertSubject, InsertTask, InsertStudyLog
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private subjects: Map<number, Subject>;
  private tasks: Map<number, Task>;
  private studyLogs: Map<number, StudyLog>;
  sessionStore: session.Store;
  currentId: { [key: string]: number };

  constructor() {
    this.users = new Map();
    this.subjects = new Map();
    this.tasks = new Map();
    this.studyLogs = new Map();
    this.currentId = {
      users: 1,
      subjects: 1,
      tasks: 1,
      studyLogs: 1
    };
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const user: User = { 
      ...insertUser, 
      id, 
      totalStudyHours: 0,
      grade: insertUser.grade || null 
    };
    this.users.set(id, user);
    return user;
  }

  async getSubjectsForUser(userId: number): Promise<Subject[]> {
    return Array.from(this.subjects.values()).filter(
      (subject) => subject.userId === userId
    );
  }

  async createSubject(userId: number, insertSubject: InsertSubject): Promise<Subject> {
    const id = this.currentId.subjects++;
    const subject: Subject = { ...insertSubject, id, userId, completed: false };
    this.subjects.set(id, subject);
    return subject;
  }

  async updateSubject(id: number, updates: Partial<Subject>): Promise<Subject> {
    const subject = this.subjects.get(id);
    if (!subject) throw new Error("Subject not found");
    const updated = { ...subject, ...updates };
    this.subjects.set(id, updated);
    return updated;
  }

  async getSubject(id: number): Promise<Subject | undefined> {
    return this.subjects.get(id);
  }

  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getTasksForSubject(subjectId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.subjectId === subjectId
    );
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.currentId.tasks++;
    const task: Task = { ...insertTask, id, completed: false };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: number, updates: Partial<Task>): Promise<Task> {
    const task = this.tasks.get(id);
    if (!task) throw new Error("Task not found");
    const updated = { ...task, ...updates };
    this.tasks.set(id, updated);
    return updated;
  }

  async createStudyLog(userId: number, insertStudyLog: InsertStudyLog): Promise<StudyLog> {
    const id = this.currentId.studyLogs++;
    const studyLog: StudyLog = { ...insertStudyLog, id, userId };
    this.studyLogs.set(id, studyLog);
    return studyLog;
  }

  async getStudyLogsForUser(userId: number): Promise<StudyLog[]> {
    return Array.from(this.studyLogs.values()).filter(
      (log) => log.userId === userId
    );
  }
}

export const storage = new MemStorage();