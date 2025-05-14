import { 
  type Document, 
  type InsertDocument, 
  type UpdateDocument, 
  type User, 
  type InsertUser,
  type TaskGroup,
  type InsertTaskGroup,
  type UpdateTaskGroup,
  type Task,
  type InsertTask,
  type UpdateTask,
  type Session,
  type InsertSession,
  type UpdateSession
} from "@shared/schema";

// Modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods
  getUserById(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByProviderId(providerId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User>;
  
  // Document methods
  getDocuments(): Promise<Document[]>;
  getDocumentsByCategory(category: string): Promise<Document[]>;
  getDocumentsByUser(userId: number): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, document: UpdateDocument): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;
  
  // TaskGroup methods
  getTaskGroups(): Promise<TaskGroup[]>;
  getTaskGroupsByUser(userId: number): Promise<TaskGroup[]>;
  getTaskGroup(id: number): Promise<TaskGroup | undefined>;
  createTaskGroup(taskGroup: InsertTaskGroup): Promise<TaskGroup>;
  updateTaskGroup(id: number, taskGroup: UpdateTaskGroup): Promise<TaskGroup | undefined>;
  deleteTaskGroup(id: number): Promise<boolean>;
  
  // Task methods
  getTasks(): Promise<Task[]>;
  getTasksByUser(userId: number): Promise<Task[]>;
  getTasksByGroup(groupId: number): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: UpdateTask): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  
  // Session methods
  getSessions(): Promise<Session[]>;
  getSessionsByUser(userId: number): Promise<Session[]>;
  getSession(id: number): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: number, session: UpdateSession): Promise<Session | undefined>;
  deleteSession(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return user || undefined;
  }

  async getUserByProviderId(providerId: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.providerId, providerId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(schema.users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(schema.users)
      .set({
        ...userData,
        updatedAt: new Date()
      })
      .where(eq(schema.users.id, id))
      .returning();
    return updatedUser;
  }

  // Document methods
  async getDocuments(): Promise<Document[]> {
    return await db.select().from(schema.documents);
  }

  async getDocumentsByCategory(category: string): Promise<Document[]> {
    return await db
      .select()
      .from(schema.documents)
      .where(eq(schema.documents.category, category));
  }
  
  async getDocumentsByUser(userId: number): Promise<Document[]> {
    return await db
      .select()
      .from(schema.documents)
      .where(eq(schema.documents.userId, userId));
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db
      .select()
      .from(schema.documents)
      .where(eq(schema.documents.id, id));
    return document || undefined;
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [document] = await db
      .insert(schema.documents)
      .values(insertDocument)
      .returning();
    return document;
  }

  async updateDocument(id: number, updateDocument: UpdateDocument): Promise<Document | undefined> {
    const [document] = await db
      .update(schema.documents)
      .set({
        ...updateDocument,
        updatedAt: new Date()
      })
      .where(eq(schema.documents.id, id))
      .returning();
    return document || undefined;
  }

  async deleteDocument(id: number): Promise<boolean> {
    const result = await db
      .delete(schema.documents)
      .where(eq(schema.documents.id, id));
    return true; // For now, assume it succeeded
  }

  // TaskGroup methods
  async getTaskGroups(): Promise<TaskGroup[]> {
    return await db.select().from(schema.taskGroups);
  }

  async getTaskGroupsByUser(userId: number): Promise<TaskGroup[]> {
    return await db
      .select()
      .from(schema.taskGroups)
      .where(eq(schema.taskGroups.userId, userId))
      .orderBy(schema.taskGroups.order);
  }

  async getTaskGroup(id: number): Promise<TaskGroup | undefined> {
    const [taskGroup] = await db
      .select()
      .from(schema.taskGroups)
      .where(eq(schema.taskGroups.id, id));
    return taskGroup || undefined;
  }

  async createTaskGroup(insertTaskGroup: InsertTaskGroup): Promise<TaskGroup> {
    const [taskGroup] = await db
      .insert(schema.taskGroups)
      .values(insertTaskGroup)
      .returning();
    return taskGroup;
  }

  async updateTaskGroup(id: number, updateTaskGroup: UpdateTaskGroup): Promise<TaskGroup | undefined> {
    const [taskGroup] = await db
      .update(schema.taskGroups)
      .set({
        ...updateTaskGroup,
        updatedAt: new Date()
      })
      .where(eq(schema.taskGroups.id, id))
      .returning();
    return taskGroup || undefined;
  }

  async deleteTaskGroup(id: number): Promise<boolean> {
    // Note: Tasks associated with the group will be deleted automatically 
    // due to the cascade deletion setup in the schema
    const result = await db
      .delete(schema.taskGroups)
      .where(eq(schema.taskGroups.id, id));
    return true;
  }

  // Task methods
  async getTasks(): Promise<Task[]> {
    return await db.select().from(schema.tasks);
  }

  async getTasksByUser(userId: number): Promise<Task[]> {
    return await db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.userId, userId));
  }

  async getTasksByGroup(groupId: number): Promise<Task[]> {
    return await db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.groupId, groupId))
      .orderBy(schema.tasks.order);
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.id, id));
    return task || undefined;
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db
      .insert(schema.tasks)
      .values(insertTask)
      .returning();
    return task;
  }

  async updateTask(id: number, updateTask: UpdateTask): Promise<Task | undefined> {
    const [task] = await db
      .update(schema.tasks)
      .set({
        ...updateTask,
        updatedAt: new Date()
      })
      .where(eq(schema.tasks.id, id))
      .returning();
    return task || undefined;
  }

  async deleteTask(id: number): Promise<boolean> {
    const result = await db
      .delete(schema.tasks)
      .where(eq(schema.tasks.id, id));
    return true;
  }

  // Session methods
  async getSessions(): Promise<Session[]> {
    return await db.select().from(schema.sessions).orderBy(desc(schema.sessions.createdAt));
  }

  async getSessionsByUser(userId: number): Promise<Session[]> {
    return await db
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.userId, userId))
      .orderBy(desc(schema.sessions.createdAt));
  }

  async getSession(id: number): Promise<Session | undefined> {
    const [session] = await db
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.id, id));
    return session;
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const [session] = await db
      .insert(schema.sessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async updateSession(id: number, updateSession: UpdateSession): Promise<Session | undefined> {
    const [session] = await db
      .update(schema.sessions)
      .set({
        ...updateSession,
        updatedAt: new Date(),
      })
      .where(eq(schema.sessions.id, id))
      .returning();
    return session;
  }

  async deleteSession(id: number): Promise<boolean> {
    try {
      await db.delete(schema.sessions).where(eq(schema.sessions.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting session:', error);
      return false;
    }
  }

  // Seed function to populate initial data
  async seedInitialData() {
    // Check if we have any documents
    const existingDocs = await db.select().from(schema.documents);
    if (existingDocs.length > 0) {
      return; // Database already has data
    }

    // Define categories and sample documents
    const categoryDocs = [
      {
        title: "AI Assistant",
        category: "ai_assistance",
        content: {
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 1 },
              content: [{ type: "text", text: "AI Assistant" }]
            },
            {
              type: "paragraph",
              content: [{ type: "text", text: "This is your AI assistant workspace. Add your notes or commands here." }]
            }
          ]
        }
      },
      {
        title: "Settings & Search",
        category: "settings_search",
        content: {
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 1 },
              content: [{ type: "text", text: "Settings & Search" }]
            },
            {
              type: "paragraph",
              content: [{ type: "text", text: "Configure your settings and search preferences here." }]
            }
          ]
        }
      },
      {
        title: "Collection Bucket",
        category: "collection_bucket",
        content: {
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 1 },
              content: [{ type: "text", text: "Collection Bucket" }]
            },
            {
              type: "paragraph",
              content: [{ type: "text", text: "Your ideas collection area. Gather thoughts before organizing them." }]
            }
          ]
        }
      },
      {
        title: "AI Memory",
        category: "ai_memory",
        content: {
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 1 },
              content: [{ type: "text", text: "AI Memory" }]
            },
            {
              type: "paragraph",
              content: [{ type: "text", text: "Storage for AI generated content and conversations." }]
            }
          ]
        }
      },
      {
        title: "Actionables",
        category: "actionables",
        content: {
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 1 },
              content: [{ type: "text", text: "Actionables" }]
            },
            {
              type: "paragraph",
              content: [{ type: "text", text: "Tasks and items that require your attention and action." }]
            },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Next Actions" }]
            },
            {
              type: "paragraph",
              content: [{ type: "text", text: "Immediate next steps." }]
            }
          ]
        }
      },
      {
        title: "Non-Actionables",
        category: "non_actionables",
        content: {
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 1 },
              content: [{ type: "text", text: "Non-Actionables" }]
            },
            {
              type: "paragraph",
              content: [{ type: "text", text: "Information storage that doesn't require immediate action." }]
            }
          ]
        }
      },
      {
        title: "Prioritization",
        category: "prioritization",
        content: {
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 1 },
              content: [{ type: "text", text: "Prioritization" }]
            },
            {
              type: "paragraph",
              content: [{ type: "text", text: "Organize and prioritize your tasks and projects." }]
            }
          ]
        }
      },
      {
        title: "Reminders & Plans",
        category: "reminders_plans",
        content: {
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 1 },
              content: [{ type: "text", text: "Reminders & Plans" }]
            },
            {
              type: "paragraph",
              content: [{ type: "text", text: "Time-based organization of tasks and events." }]
            }
          ]
        }
      },
      {
        title: "Learning Dashboard",
        category: "learning_dashboard",
        content: {
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 1 },
              content: [{ type: "text", text: "Learning Dashboard" }]
            },
            {
              type: "paragraph",
              content: [{ type: "text", text: "Track your learning progress and educational goals." }]
            }
          ]
        }
      },
      {
        title: "Strategy Toolbox",
        category: "strategy_toolbox",
        content: {
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 1 },
              content: [{ type: "text", text: "Strategy Toolbox" }]
            },
            {
              type: "paragraph",
              content: [{ type: "text", text: "Strategic planning tools and frameworks." }]
            }
          ]
        }
      }
    ];
    
    // Insert all documents in a batch
    await db.insert(schema.documents).values(categoryDocs);
  }
}

import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import * as schema from "@shared/schema";

export const storage = new DatabaseStorage();
