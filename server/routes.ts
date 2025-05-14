import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ZodError } from "zod";
import { 
  insertDocumentSchema, 
  updateDocumentSchema,
  insertTaskGroupSchema,
  updateTaskGroupSchema,
  insertTaskSchema,
  updateTaskSchema,
  insertSessionSchema,
  updateSessionSchema
} from "@shared/schema";
import { setupAuth, isAuthenticated } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  
  // API routes for documents
  
  // Get all documents
  app.get("/api/documents", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Get only documents that belong to the current user
      const documents = await storage.getDocumentsByUser(req.user!.id);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // Get documents by category
  app.get("/api/documents/category/:category", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { category } = req.params;
      // Allow fetching by parent category (e.g., actionables/next_actions should return actionables)
      const categoryPath = category.split('/');
      const mainCategory = categoryPath[0]; // Get the first part of the path
      
      // Get documents for this category but only for the current user
      const allUserDocs = await storage.getDocumentsByUser(req.user!.id);
      const documents = allUserDocs.filter(doc => doc.category === mainCategory);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documents by category" });
    }
  });

  // Get a specific document
  app.get("/api/documents/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }

      const document = await storage.getDocument(id);
      
      // Check if document exists and belongs to the current user
      if (!document || (document.userId && document.userId !== req.user!.id)) {
        return res.status(404).json({ message: "Document not found" });
      }

      res.json(document);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch document" });
    }
  });

  // Create a new document
  app.post("/api/documents", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const documentData = insertDocumentSchema.parse(req.body);
      // Add the current user's ID to the document data
      documentData.userId = req.user!.id;
      const newDocument = await storage.createDocument(documentData);
      res.status(201).json(newDocument);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid document data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create document" });
    }
  });

  // Update a document
  app.put("/api/documents/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }

      // First check if document exists and belongs to the current user
      const existingDocument = await storage.getDocument(id);
      if (!existingDocument || (existingDocument.userId && existingDocument.userId !== req.user!.id)) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      const documentData = updateDocumentSchema.parse(req.body);
      const updatedDocument = await storage.updateDocument(id, documentData);

      res.json(updatedDocument);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid document data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update document" });
    }
  });

  // Delete a document
  app.delete("/api/documents/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }

      // First check if document exists and belongs to the current user
      const existingDocument = await storage.getDocument(id);
      if (!existingDocument || (existingDocument.userId && existingDocument.userId !== req.user!.id)) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      const success = await storage.deleteDocument(id);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete document" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // ============== Task Group Routes ==============

  // Get all task groups for current user
  app.get("/api/task-groups", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const taskGroups = await storage.getTaskGroupsByUser(req.user!.id);
      res.json(taskGroups);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task groups" });
    }
  });

  // Get a specific task group
  app.get("/api/task-groups/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task group ID" });
      }

      const taskGroup = await storage.getTaskGroup(id);
      
      // Check if task group exists and belongs to the current user
      if (!taskGroup || taskGroup.userId !== req.user!.id) {
        return res.status(404).json({ message: "Task group not found" });
      }

      res.json(taskGroup);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task group" });
    }
  });

  // Create a new task group
  app.post("/api/task-groups", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const taskGroupData = insertTaskGroupSchema.parse(req.body);
      // Add the current user's ID to the task group data
      taskGroupData.userId = req.user!.id;
      
      const newTaskGroup = await storage.createTaskGroup(taskGroupData);
      res.status(201).json(newTaskGroup);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid task group data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create task group" });
    }
  });

  // Update a task group
  app.put("/api/task-groups/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task group ID" });
      }

      // First check if task group exists and belongs to the current user
      const existingTaskGroup = await storage.getTaskGroup(id);
      if (!existingTaskGroup || existingTaskGroup.userId !== req.user!.id) {
        return res.status(404).json({ message: "Task group not found" });
      }
      
      const taskGroupData = updateTaskGroupSchema.parse(req.body);
      const updatedTaskGroup = await storage.updateTaskGroup(id, taskGroupData);

      res.json(updatedTaskGroup);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid task group data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update task group" });
    }
  });

  // Delete a task group
  app.delete("/api/task-groups/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task group ID" });
      }

      // First check if task group exists and belongs to the current user
      const existingTaskGroup = await storage.getTaskGroup(id);
      if (!existingTaskGroup || existingTaskGroup.userId !== req.user!.id) {
        return res.status(404).json({ message: "Task group not found" });
      }
      
      const success = await storage.deleteTaskGroup(id);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete task group" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task group" });
    }
  });

  // ============== Task Routes ==============

  // Get all tasks for current user
  app.get("/api/tasks", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const tasks = await storage.getTasksByUser(req.user!.id);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  // Get tasks for a specific group
  app.get("/api/task-groups/:groupId/tasks", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const groupId = parseInt(req.params.groupId);
      if (isNaN(groupId)) {
        return res.status(400).json({ message: "Invalid task group ID" });
      }

      // Check if task group exists and belongs to the current user
      const taskGroup = await storage.getTaskGroup(groupId);
      if (!taskGroup || taskGroup.userId !== req.user!.id) {
        return res.status(404).json({ message: "Task group not found" });
      }

      const tasks = await storage.getTasksByGroup(groupId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  // Get a specific task
  app.get("/api/tasks/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      const task = await storage.getTask(id);
      
      // Check if task exists and belongs to the current user
      if (!task || task.userId !== req.user!.id) {
        return res.status(404).json({ message: "Task not found" });
      }

      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  // Create a new task
  app.post("/api/tasks", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const taskData = insertTaskSchema.parse(req.body);
      // Add the current user's ID to the task data
      taskData.userId = req.user!.id;
      
      // Verify that the task group exists and belongs to the current user
      if (taskData.groupId) {
        const taskGroup = await storage.getTaskGroup(taskData.groupId);
        if (!taskGroup || taskGroup.userId !== req.user!.id) {
          return res.status(400).json({ message: "Invalid task group" });
        }
      }
      
      const newTask = await storage.createTask(taskData);
      res.status(201).json(newTask);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid task data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  // Update a task
  app.put("/api/tasks/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      // First check if task exists and belongs to the current user
      const existingTask = await storage.getTask(id);
      if (!existingTask || existingTask.userId !== req.user!.id) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      const taskData = updateTaskSchema.parse(req.body);
      
      // If the group ID is changing, verify that the new group belongs to the user
      if (taskData.groupId && taskData.groupId !== existingTask.groupId) {
        const taskGroup = await storage.getTaskGroup(taskData.groupId);
        if (!taskGroup || taskGroup.userId !== req.user!.id) {
          return res.status(400).json({ message: "Invalid task group" });
        }
      }
      
      const updatedTask = await storage.updateTask(id, taskData);

      res.json(updatedTask);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid task data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  // Delete a task
  app.delete("/api/tasks/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      // First check if task exists and belongs to the current user
      const existingTask = await storage.getTask(id);
      if (!existingTask || existingTask.userId !== req.user!.id) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      const success = await storage.deleteTask(id);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete task" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // ============== Session Routes ==============

  // Get all sessions for current user
  app.get("/api/sessions", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const sessions = await storage.getSessionsByUser(req.user!.id);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  // Get a specific session
  app.get("/api/sessions/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }

      const session = await storage.getSession(id);
      
      // Check if session exists and belongs to the current user
      if (!session || session.userId !== req.user!.id) {
        return res.status(404).json({ message: "Session not found" });
      }

      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch session" });
    }
  });

  // Create a new session
  app.post("/api/sessions", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Parse the request body with our schema
      const sessionData = insertSessionSchema.parse(req.body);
      
      // Add the current user's ID to the session data
      sessionData.userId = req.user!.id;
      
      // Handle dates properly - let the database use its default if not provided
      if (!sessionData.startedAt) {
        // Remove the field entirely to let DB default handle it
        delete sessionData.startedAt;
      }
      
      // Create the session with our sanitized data
      const newSession = await storage.createSession(sessionData);
      res.status(201).json(newSession);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error("Validation error:", error.errors);
        return res.status(400).json({ 
          message: "Invalid session data", 
          errors: error.errors 
        });
      }
      console.error("Error creating session:", error);
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  // Update a session
  app.put("/api/sessions/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }

      // First check if session exists and belongs to the current user
      const existingSession = await storage.getSession(id);
      if (!existingSession || existingSession.userId !== req.user!.id) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      console.log("Session update request body:", req.body);
      
      // Make sure completedAt is a proper Date object if provided
      let reqBody = { ...req.body };
      if (reqBody.completedAt && typeof reqBody.completedAt === 'string') {
        reqBody.completedAt = new Date(reqBody.completedAt);
      }
      
      // Full validation using the schema
      const sessionData = updateSessionSchema.parse(reqBody);
      
      console.log("Session data to update:", sessionData);
      const updatedSession = await storage.updateSession(id, sessionData);
      res.json(updatedSession);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error("Validation error updating session:", error.errors);
        return res.status(400).json({ 
          message: "Invalid session data", 
          errors: error.errors 
        });
      }
      console.error("Error updating session:", error);
      res.status(500).json({ message: "Failed to update session" });
    }
  });

  // Delete a session
  app.delete("/api/sessions/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }

      // First check if session exists and belongs to the current user
      const existingSession = await storage.getSession(id);
      if (!existingSession || existingSession.userId !== req.user!.id) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      const success = await storage.deleteSession(id);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete session" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete session" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
