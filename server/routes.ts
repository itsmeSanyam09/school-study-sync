import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertSubjectSchema, insertTaskSchema, insertStudyLogSchema } from "@shared/schema";
import { z } from "zod";
import fetch from "node-fetch";

type OpenRouterResponse = {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

async function fetchNCERTChapters(subject: string, grade: string) {
  try {
    const prompt = `Generate 5 realistic chapter names for ${subject} textbook for ${grade}. Format each chapter as "Chapter N: Title". Only return the chapter names, no additional text.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST", 
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error("Failed to get AI response");
    }

    const data = await response.json() as OpenRouterResponse;
    const chapters = data.choices[0].message.content
      .split('\n')
      .filter(line => line.trim().length > 0);

    return chapters;
  } catch (error) {
    console.error('Error generating chapters:', error);
    throw new Error('Failed to generate chapters');
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.get("/api/subjects", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const subjects = await storage.getSubjectsForUser(req.user.id);
      res.json(subjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      res.status(500).json({ error: "Failed to fetch subjects" });
    }
  });

  app.post("/api/subjects", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const subjectData = insertSubjectSchema.parse(req.body);
      const subject = await storage.createSubject(req.user.id, subjectData);
      res.status(201).json(subject);
    } catch (error) {
      console.error("Error creating subject:", error);
      res.status(400).json({ error: "Failed to create subject" });
    }
  });

  app.patch("/api/subjects/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const subject = await storage.updateSubject(parseInt(req.params.id), req.body);
      res.json(subject);
    } catch (error) {
      console.error("Error updating subject:", error);
      res.status(404).json({ error: "Subject not found or update failed" });
    }
  });

  app.get("/api/subjects/:id/tasks", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const tasks = await storage.getTasksForSubject(parseInt(req.params.id));
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const taskData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(taskData);
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(400).json({ error: "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const taskId = parseInt(req.params.id);
      const updates = req.body;

      // First check if task exists
      const existingTask = await storage.getTask(taskId);
      if (!existingTask) {
        return res.status(404).json({ error: "Task not found" });
      }

      const task = await storage.updateTask(taskId, updates);
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  app.post("/api/study-logs", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const logData = insertStudyLogSchema.parse(req.body);
      const log = await storage.createStudyLog(req.user.id, logData);
      res.status(201).json(log);
    } catch (error) {
      console.error("Error creating study log:", error);
      res.status(400).json({ error: "Failed to create study log" });
    }
  });

  app.get("/api/study-logs", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const logs = await storage.getStudyLogsForUser(req.user.id);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching study logs:", error);
      res.status(500).json({ error: "Failed to fetch study logs" });
    }
  });

  app.post("/api/chat", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const messageSchema = z.object({
        message: z.string().min(1)
      });

      const { message } = messageSchema.parse(req.body);

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

      const data = await response.json() as OpenRouterResponse;
      res.json({ response: data.choices[0].message.content });
    } catch (error) {
      console.error("Error in chat request:", error);
      res.status(500).json({ error: "Failed to process chat request" });
    }
  });

  app.post("/api/subjects/:id/fetch-chapters", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const subjectId = parseInt(req.params.id);
      const subject = await storage.getSubject(subjectId);

      if (!subject) {
        return res.status(404).json({ error: "Subject not found" });
      }

      if (!req.user.grade) {
        return res.status(400).json({ error: "User grade is not set" });
      }

      console.log(`Fetching chapters for subject: ${subject.name}, grade: ${req.user.grade}`);
      const chapters = await fetchNCERTChapters(subject.name, req.user.grade);
      console.log(`Generated chapters:`, chapters);

      if (!chapters || chapters.length === 0) {
        return res.status(404).json({ error: "No chapters found for this subject" });
      }

      // Create tasks for each chapter
      const tasks = await Promise.all(
        chapters.map(chapter =>
          storage.createTask({
            subjectId,
            description: chapter,
            completed: false
          })
        )
      );

      console.log(`Created tasks:`, tasks);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching chapters:", error);
      res.status(500).json({ error: "Failed to fetch chapters" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}