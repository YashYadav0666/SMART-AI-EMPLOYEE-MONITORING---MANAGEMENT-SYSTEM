import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, addDays, isSameDay, subDays } from "date-fns";
import { Employee, BehaviorLog } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Simulated day for demo purposes (1 day = 10 minutes)
const SIMULATION_FACTOR = 10 * 60 * 1000; // 10 minutes in milliseconds

// Returns current date, but for demo purposes, 1 day represents 10 minutes
const getSimulatedDate = (): Date => {
  const now = new Date();
  const realTimeElapsed = now.getTime() - new Date().setHours(0, 0, 0, 0);
  const simulatedDays = Math.floor(realTimeElapsed / SIMULATION_FACTOR);
  return addDays(new Date().setHours(0, 0, 0, 0), simulatedDays);
};

// Check if an employee was active yesterday but absent today
const isEmployeeAbsentToday = (employee: Employee, logs: BehaviorLog[]): boolean => {
  const today = getSimulatedDate();
  const yesterday = subDays(today, 1);
  
  // Filter logs for this employee on the current day
  const todayLogs = logs.filter(log => {
    return log.employeeId === employee.id && isSameDay(new Date(log.timestamp), today);
  });
  
  // Filter logs for this employee on yesterday
  const yesterdayLogs = logs.filter(log => {
    return log.employeeId === employee.id && isSameDay(new Date(log.timestamp), yesterday);
  });
  
  // Employee is absent if they have no logs for today but had logs yesterday
  return todayLogs.length === 0 && yesterdayLogs.length > 0;
};

interface AbsentEmployeeNotificationsProps {
  employees: Employee[];
}

export default function AbsentEmployeeNotifications({ employees }: AbsentEmployeeNotificationsProps) {
  const [notifiedEmployees, setNotifiedEmployees] = useState<Set<number>>(new Set());
  const [simulatedDate, setSimulatedDate] = useState<Date>(getSimulatedDate());

  // Get all behavior logs
  const { data: behaviorLogsResponse = {} } = useQuery<Record<number, BehaviorLog>>({
    queryKey: ["/api/behavior-logs"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  // Convert record to array for processing
  const behaviorLogs = Object.values(behaviorLogsResponse);

  // Update simulated date every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setSimulatedDate(getSimulatedDate());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Check for absent employees and notify
  useEffect(() => {
    if (employees.length === 0 || behaviorLogs.length === 0) return;

    // Find absent employees for today
    const absentEmployees = employees.filter(employee => isEmployeeAbsentToday(employee, behaviorLogs));
    
    // Send notification for newly absent employees
    absentEmployees.forEach(employee => {
      if (!notifiedEmployees.has(employee.id)) {
        toast({
          title: "Employee Absence Notification",
          description: `${employee.name} was active yesterday but is absent today.`,
          variant: "destructive",
        });
        
        // Update notified list
        setNotifiedEmployees(prev => {
          const newSet = new Set(prev);
          newSet.add(employee.id);
          return newSet;
        });
      }
    });
  }, [employees, behaviorLogs, notifiedEmployees, simulatedDate]);

  // Calculate absent employees
  const absentEmployees = employees.filter(employee => isEmployeeAbsentToday(employee, behaviorLogs));

  if (absentEmployees.length === 0) {
    return null;
  }

  return (
    <Card className="border-red-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center text-red-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Employees Absent Today (Active Yesterday)
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {absentEmployees.map(employee => (
            <div 
              key={employee.id}
              className="flex items-center p-3 bg-red-50 rounded-lg"
            >
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-700 mr-3">
                {employee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
              <div>
                <div className="font-medium text-gray-800">{employee.name}</div>
                <div className="text-xs text-red-600">
                  Has not logged in today ({format(simulatedDate, "MMMM d, yyyy")})
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}