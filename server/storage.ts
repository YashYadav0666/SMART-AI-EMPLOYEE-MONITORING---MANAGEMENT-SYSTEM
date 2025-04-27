import { 
  employees, type Employee, type InsertEmployee,
  behaviorLogs, type BehaviorLog, type InsertBehaviorLog, 
  screenshots, type Screenshot, type InsertScreenshot,
  workSubmissions, type WorkSubmission, type InsertWorkSubmission
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Employee methods
  getEmployee(id: number): Promise<Employee | undefined>;
  getAllEmployees(): Promise<Employee[]>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;

  // Behavior log methods
  createBehaviorLog(log: InsertBehaviorLog): Promise<BehaviorLog>;
  getBehaviorLogsByEmployeeId(employeeId: number): Promise<BehaviorLog[]>;
  getLatestBehaviorLogs(): Promise<Record<number, BehaviorLog>>;

  // Screenshot methods
  createScreenshot(screenshot: InsertScreenshot): Promise<Screenshot>;
  getScreenshotsByEmployeeId(employeeId: number, limit?: number): Promise<Screenshot[]>;
  getLatestScreenshot(employeeId: number): Promise<Screenshot | undefined>;

  // Work submission methods
  createWorkSubmission(submission: InsertWorkSubmission): Promise<WorkSubmission>;
  getWorkSubmissionsByEmployeeId(employeeId: number): Promise<WorkSubmission[]>;
}

export class DatabaseStorage implements IStorage {
  // Employee methods
  async getEmployee(id: number): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee;
  }

  async getAllEmployees(): Promise<Employee[]> {
    return await db.select().from(employees);
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const [employee] = await db.insert(employees).values(insertEmployee).returning();
    return employee;
  }

  // Behavior log methods
  async createBehaviorLog(insertLog: InsertBehaviorLog): Promise<BehaviorLog> {
    const [log] = await db.insert(behaviorLogs).values(insertLog).returning();
    return log;
  }

  async getBehaviorLogsByEmployeeId(employeeId: number): Promise<BehaviorLog[]> {
    return await db
      .select()
      .from(behaviorLogs)
      .where(eq(behaviorLogs.employeeId, employeeId))
      .orderBy(desc(behaviorLogs.timestamp));
  }

  async getLatestBehaviorLogs(): Promise<Record<number, BehaviorLog>> {
    // This is a more complex query that requires raw SQL or a subquery
    // First, get all employees
    const allEmployees = await this.getAllEmployees();
    
    // Create an empty result object
    const result: Record<number, BehaviorLog> = {};
    
    // For each employee, get their latest behavior log
    for (const employee of allEmployees) {
      const [latestLog] = await db
        .select()
        .from(behaviorLogs)
        .where(eq(behaviorLogs.employeeId, employee.id))
        .orderBy(desc(behaviorLogs.timestamp))
        .limit(1);
      
      if (latestLog) {
        result[employee.id] = latestLog;
      }
    }
    
    return result;
  }

  // Screenshot methods
  async createScreenshot(insertScreenshot: InsertScreenshot): Promise<Screenshot> {
    const [screenshot] = await db.insert(screenshots).values(insertScreenshot).returning();
    return screenshot;
  }

  async getScreenshotsByEmployeeId(employeeId: number, limit = 10): Promise<Screenshot[]> {
    return await db
      .select()
      .from(screenshots)
      .where(eq(screenshots.employeeId, employeeId))
      .orderBy(desc(screenshots.timestamp))
      .limit(limit);
  }

  async getLatestScreenshot(employeeId: number): Promise<Screenshot | undefined> {
    const [screenshot] = await db
      .select()
      .from(screenshots)
      .where(eq(screenshots.employeeId, employeeId))
      .orderBy(desc(screenshots.timestamp))
      .limit(1);
    
    return screenshot;
  }

  // Work submission methods
  async createWorkSubmission(insertSubmission: InsertWorkSubmission): Promise<WorkSubmission> {
    const [submission] = await db
      .insert(workSubmissions)
      .values(insertSubmission)
      .returning();
    
    return submission;
  }

  async getWorkSubmissionsByEmployeeId(employeeId: number): Promise<WorkSubmission[]> {
    return await db
      .select()
      .from(workSubmissions)
      .where(eq(workSubmissions.employeeId, employeeId))
      .orderBy(desc(workSubmissions.timestamp));
  }
}

export const storage = new DatabaseStorage();
