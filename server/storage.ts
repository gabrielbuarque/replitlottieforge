import { 
  users, projects, colorHistory,
  type User, type InsertUser,
  type Project, type InsertProject,
  type ColorHistory, type InsertColorHistory
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Project operations
  getProject(id: number): Promise<Project | undefined>;
  getProjects(userId?: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, projectData: Partial<Omit<Project, 'id'>>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  
  // Color history operations
  getColorHistory(projectId: number, limit?: number): Promise<ColorHistory[]>;
  createColorHistory(colorHistory: InsertColorHistory): Promise<ColorHistory>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }
  
  async getProjects(userId?: number): Promise<Project[]> {
    if (userId) {
      return db.select()
        .from(projects)
        .where(eq(projects.userId, userId))
        .orderBy(desc(projects.lastModified));
    }
    
    // If no userId provided, return all projects (admin/demo functionality)
    return db.select()
      .from(projects)
      .orderBy(desc(projects.lastModified));
  }
  
  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db
      .insert(projects)
      .values(project)
      .returning();
    return newProject;
  }
  
  async updateProject(id: number, projectData: Partial<Omit<Project, 'id'>>): Promise<Project | undefined> {
    const [updated] = await db
      .update(projects)
      .set({
        ...projectData,
        lastModified: new Date() // Update the last modified timestamp
      })
      .where(eq(projects.id, id))
      .returning();
    
    return updated;
  }
  
  async deleteProject(id: number): Promise<boolean> {
    // First delete related color history
    await db
      .delete(colorHistory)
      .where(eq(colorHistory.projectId, id));
    
    // Then delete the project
    const result = await db
      .delete(projects)
      .where(eq(projects.id, id))
      .returning();
    
    return result.length > 0;
  }
  
  async getColorHistory(projectId: number, limit: number = 20): Promise<ColorHistory[]> {
    return db.select()
      .from(colorHistory)
      .where(eq(colorHistory.projectId, projectId))
      .orderBy(desc(colorHistory.timestamp))
      .limit(limit);
  }
  
  async createColorHistory(history: InsertColorHistory): Promise<ColorHistory> {
    const [newHistory] = await db
      .insert(colorHistory)
      .values(history)
      .returning();
    
    return newHistory;
  }
}

export const storage = new DatabaseStorage();
