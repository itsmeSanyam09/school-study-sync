import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertSubjectSchema, insertTaskSchema, insertStudyLogSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.get("/api/subjects", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const subjects = await storage.getSubjectsForUser(req.user.id);
    res.json(subjects);
  });

  app.post("/api/subjects", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const subjectData = insertSubjectSchema.parse(req.body);
    const subject = await storage.createSubject(req.user.id, subjectData);
    res.status(201).json(subject);
  });

  app.patch("/api/subjects/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const subject = await storage.updateSubject(parseInt(req.params.id), req.body);
    res.json(subject);
  });

  app.get("/api/subjects/:id/tasks", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const tasks = await storage.getTasksForSubject(parseInt(req.params.id));
    res.json(tasks);
  });

  app.post("/api/tasks", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const taskData = insertTaskSchema.parse(req.body);
    const task = await storage.createTask(taskData);
    res.status(201).json(task);
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const task = await storage.updateTask(parseInt(req.params.id), req.body);
    res.json(task);
  });

  app.post("/api/study-logs", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const logData = insertStudyLogSchema.parse(req.body);
    const log = await storage.createStudyLog(req.user.id, logData);
    res.status(201).json(log);
  });

  app.get("/api/study-logs", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const logs = await storage.getStudyLogsForUser(req.user.id);
    res.json(logs);
  });

  app.post("/api/chat", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const messageSchema = z.object({
      message: z.string().min(1)
    });
    
    const { message } = messageSchema.parse(req.body);

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: message }]
        })
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await response.json();
      res.json({ response: data.choices[0].message.content });
    } catch (error) {
      res.status(500).json({ error: "Failed to process chat request" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
