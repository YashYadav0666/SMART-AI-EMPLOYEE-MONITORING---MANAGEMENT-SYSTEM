import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { BehaviorStatusType } from "@shared/schema";
import { Employee } from "@shared/schema";

import EmployeeMonitor from "@/components/employee-monitor";
import EmployeeStats from "@/components/employee-stats";
import ActivityLog from "@/components/activity-log";
import SubmitWork from "@/components/submit-work";

export interface Activity {
  id: number;
  type: "project_start" | "project_stop" | "behavior" | "work_submission";
  status?: BehaviorStatusType;
  message: string;
  details?: string;
  timestamp: Date;
}

export default function EmployeeDashboard() {
  const [location, setLocation] = useLocation();
  const [employeeName, setEmployeeName] = useState<string>("");
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentTime, setCurrentTime] = useState<string>(getCurrentTimeString());
  const queryClient = useQueryClient();

  // Get current time in format "10:30 AM"
  function getCurrentTimeString() {
    return format(new Date(), "h:mm a");
  }

  // Fetch or create employee
  useEffect(() => {
    const storedName = sessionStorage.getItem("employeeName");
    
    if (!storedName) {
      setLocation("/");
      return;
    }
    
    setEmployeeName(storedName);
    
    const createEmployee = async () => {
      try {
        const response = await apiRequest("POST", "/api/employees", { name: storedName });
        const employee = await response.json() as Employee;
        setEmployeeId(employee.id);
        
        // Add initial activity
        const initialActivity: Activity = {
          id: 0,
          type: "project_start",
          message: "Session Started",
          details: "Monitoring ready to be activated",
          timestamp: new Date()
        };
        
        setActivities([initialActivity]);
      } catch (error) {
        console.error("Error creating employee:", error);
      }
    };
    
    createEmployee();
    
    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(getCurrentTimeString());
    }, 60000);
    
    return () => clearInterval(timer);
  }, [setLocation]);

  // Add new activity
  const addActivity = (newActivity: Omit<Activity, "id" | "timestamp">) => {
    setActivities(prev => [
      {
        ...newActivity,
        id: prev.length,
        timestamp: new Date(),
      },
      ...prev
    ]);
  };

  // Handle employee logout
  const handleLogout = () => {
    sessionStorage.removeItem("employeeName");
    setLocation("/");
  };

  // Behavior log mutation
  const behaviorMutation = useMutation({
    mutationFn: async (data: { employeeId: number, status: BehaviorStatusType }) => {
      return apiRequest("POST", "/api/behavior-logs", data);
    },
    onSuccess: (_, variables) => {
      addActivity({
        type: "behavior",
        status: variables.status,
        message: variables.status.charAt(0).toUpperCase() + variables.status.slice(1),
        details: getBehaviorDescription(variables.status)
      });
      
      queryClient.invalidateQueries({ queryKey: [`/api/behavior-logs/${employeeId}`] });
    }
  });

  // Get description for behavior status
  const getBehaviorDescription = (status: BehaviorStatusType): string => {
    switch (status) {
      case "working": return "Focused on task";
      case "idle": return "No movement detected";
      case "sleeping": return "Eyes closed detected";
      case "moving": return "Frequent movement detected";
      default: return "Status unknown";
    }
  };

  if (!employeeId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Loading...</h2>
          <p>Setting up your dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Employee Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-800">Employee Dashboard</h1>
            <span className="ml-4 text-gray-600">Welcome, {employeeName}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-gray-100 rounded-full text-gray-700 text-sm">
              <i className="fas fa-clock mr-1"></i> {currentTime}
            </span>
            <button 
              onClick={handleLogout}
              className="px-3 py-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              Exit
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Camera and Status */}
          <div className="lg:col-span-2 space-y-6">
            <EmployeeMonitor 
              employeeId={employeeId} 
              onBehaviorChange={(status) => {
                if (employeeId) {
                  behaviorMutation.mutate({ 
                    employeeId, 
                    status 
                  });
                }
              }}
              onProjectStart={() => {
                addActivity({
                  type: "project_start",
                  message: "Project Started",
                  details: "Monitoring activated"
                });
              }}
              onProjectStop={() => {
                addActivity({
                  type: "project_stop",
                  message: "Project Stopped",
                  details: "Monitoring deactivated"
                });
              }}
            />
            
            <EmployeeStats employeeId={employeeId} />
            
            <SubmitWork 
              employeeId={employeeId} 
              onSubmit={(fileName) => {
                addActivity({
                  type: "work_submission",
                  message: "Work Submitted",
                  details: `${fileName} uploaded`
                });
              }}
            />
          </div>
          
          {/* Right Column - Activity Log */}
          <div>
            <ActivityLog activities={activities} />
          </div>
        </div>
      </main>
    </div>
  );
}
