import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertEmployeeSchema, 
  insertBehaviorLogSchema,
  insertScreenshotSchema,
  insertWorkSubmissionSchema,
  BehaviorStatus,
} from "@shared/schema";
import { spawn } from "child_process";
import path from "path";
import { WebSocketServer } from "ws";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Use a specific path for our application WebSocket to avoid conflicts with Vite's HMR
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/api/ws' // Use a specific path to avoid conflict with Vite's WebSocket
  });
  
  // Add CORS headers to all responses
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    
    // Handle preflight requests
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
  
  // Log WebSocket setup
  console.log("WebSocket server initialized on path: /api/ws");
  
  // WebSocket for real-time updates
  wss.on("connection", (ws) => {
    console.log("WebSocket client connected");
    
    ws.on("message", (message) => {
      try {
        // Echo back for now, in future can implement more complex behavior
        ws.send(message.toString());
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });
  });

  // Broadcast to all connected clients
  function broadcast(data: any) {
    wss.clients.forEach(client => {
      if (client.readyState === 1) { // OPEN
        client.send(JSON.stringify(data));
      }
    });
  }

  // Employee routes
  app.post("/api/employees", async (req: Request, res: Response) => {
    try {
      const validatedData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(validatedData);
      res.status(201).json(employee);
    } catch (error) {
      res.status(400).json({ message: "Invalid employee data", error });
    }
  });

  app.get("/api/employees", async (_req: Request, res: Response) => {
    const employees = await storage.getAllEmployees();
    res.json(employees);
  });

  app.get("/api/employees/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid employee ID" });
    }
    
    const employee = await storage.getEmployee(id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    
    res.json(employee);
  });

  // Behavior log routes
  app.post("/api/behavior-logs", async (req: Request, res: Response) => {
    try {
      // Validate status is one of the allowed values
      if (!BehaviorStatus.safeParse(req.body.status).success) {
        return res.status(400).json({ 
          message: "Invalid status. Must be one of: working, idle, sleeping, moving, inactive" 
        });
      }

      const validatedData = insertBehaviorLogSchema.parse(req.body);
      const log = await storage.createBehaviorLog(validatedData);

      // Broadcast the new behavior log to all connected clients
      broadcast({
        type: "behavior-update",
        data: log
      });

      res.status(201).json(log);
    } catch (error) {
      res.status(400).json({ message: "Invalid behavior log data", error });
    }
  });

  app.get("/api/behavior-logs/:employeeId", async (req: Request, res: Response) => {
    const employeeId = parseInt(req.params.employeeId);
    if (isNaN(employeeId)) {
      return res.status(400).json({ message: "Invalid employee ID" });
    }
    
    const logs = await storage.getBehaviorLogsByEmployeeId(employeeId);
    res.json(logs);
  });

  app.get("/api/behavior-logs", async (_req: Request, res: Response) => {
    const latestLogs = await storage.getLatestBehaviorLogs();
    res.json(latestLogs);
  });

  // Screenshot routes
  app.post("/api/screenshots", async (req: Request, res: Response) => {
    try {
      const validatedData = insertScreenshotSchema.parse(req.body);
      const screenshot = await storage.createScreenshot(validatedData);

      // Broadcast the new screenshot to all connected clients
      broadcast({
        type: "screenshot-update",
        data: {
          employeeId: screenshot.employeeId,
          id: screenshot.id,
          timestamp: screenshot.timestamp
        }
      });

      res.status(201).json({
        id: screenshot.id,
        employeeId: screenshot.employeeId,
        timestamp: screenshot.timestamp
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid screenshot data", error });
    }
  });

  app.get("/api/screenshots/:employeeId", async (req: Request, res: Response) => {
    const employeeId = parseInt(req.params.employeeId);
    if (isNaN(employeeId)) {
      return res.status(400).json({ message: "Invalid employee ID" });
    }
    
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const screenshots = await storage.getScreenshotsByEmployeeId(employeeId, limit);
    
    res.json(screenshots);
  });

  app.get("/api/screenshots/:employeeId/latest", async (req: Request, res: Response) => {
    const employeeId = parseInt(req.params.employeeId);
    if (isNaN(employeeId)) {
      return res.status(400).json({ message: "Invalid employee ID" });
    }
    
    const screenshot = await storage.getLatestScreenshot(employeeId);
    if (!screenshot) {
      return res.status(404).json({ message: "No screenshots found for this employee" });
    }
    
    res.json(screenshot);
  });

  // Work submission routes
  app.post("/api/work-submissions", async (req: Request, res: Response) => {
    try {
      const validatedData = insertWorkSubmissionSchema.parse(req.body);
      const submission = await storage.createWorkSubmission(validatedData);

      // Broadcast the new work submission to all connected clients
      broadcast({
        type: "work-submission",
        data: {
          id: submission.id,
          employeeId: submission.employeeId,
          fileName: submission.fileName,
          description: submission.description,
          fileSize: submission.fileSize,
          timestamp: submission.timestamp
        }
      });

      res.status(201).json({
        id: submission.id,
        employeeId: submission.employeeId,
        fileName: submission.fileName,
        description: submission.description,
        fileSize: submission.fileSize,
        timestamp: submission.timestamp
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid work submission data", error });
    }
  });

  app.get("/api/work-submissions/:employeeId", async (req: Request, res: Response) => {
    const employeeId = parseInt(req.params.employeeId);
    if (isNaN(employeeId)) {
      return res.status(400).json({ message: "Invalid employee ID" });
    }
    
    const submissions = await storage.getWorkSubmissionsByEmployeeId(employeeId);
    res.json(submissions);
  });

  // Behavior analysis route - execute Python script
  app.post("/api/analyze-behavior", async (req: Request, res: Response) => {
    try {
      const { imageData, employeeId } = req.body;
      
      if (!imageData || !employeeId) {
        return res.status(400).json({ message: "Missing image data or employee ID" });
      }

      // Use simulated behavior detection instead of Python for Replit compatibility
      // In a real implementation, this would call the Python script
      const behaviors = ["working", "idle", "sleeping", "moving"];
      const randomIndex = Math.floor(Math.random() * behaviors.length);
      const detectedBehavior = behaviors[randomIndex];
      
      res.json({ status: detectedBehavior });
    } catch (error) {
      console.error("Error analyzing behavior:", error);
      res.status(500).json({ message: "Error analyzing behavior" });
    }
  });

  return httpServer;
}
