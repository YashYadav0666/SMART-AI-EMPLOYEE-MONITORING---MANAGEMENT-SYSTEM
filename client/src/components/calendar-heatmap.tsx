import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, addDays, startOfWeek, subDays, isToday, isSameDay } from "date-fns";
import { Employee, BehaviorLog } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
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

// Helper function to get day status based on behavior logs with enhanced accuracy
const getDayStatus = (
  logs: BehaviorLog[],
  date: Date
): "active" | "medium" | "idle" | "absent" | "future" => {
  // For future dates
  if (date > getSimulatedDate()) {
    return "future";
  }

  // Filter logs for the specific date
  const dayLogs = logs.filter(log => {
    const logDate = new Date(log.timestamp);
    return isSameDay(logDate, date);
  });

  if (dayLogs.length === 0) {
    return "absent";
  }

  // Group logs by employee for more accurate time tracking
  const employeeLogMap: Record<number, BehaviorLog[]> = {};
  
  // Organize logs by employee
  dayLogs.forEach(log => {
    if (!employeeLogMap[log.employeeId]) {
      employeeLogMap[log.employeeId] = [];
    }
    employeeLogMap[log.employeeId].push(log);
  });

  // Status durations in minutes
  const durations = {
    working: 0,
    idle: 0,
    sleeping: 0,
    moving: 0,
    inactive: 0,
  };
  
  // For each employee, calculate time spent in each state
  Object.values(employeeLogMap).forEach(empLogs => {
    if (empLogs.length === 0) return;
    
    // Sort logs by timestamp (oldest first)
    empLogs.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Process each log
    empLogs.forEach((log, index) => {
      const currentTime = new Date(log.timestamp).getTime();
      let duration = 0;
      
      if (index < empLogs.length - 1) {
        // Calculate time until next log
        const nextTime = new Date(empLogs[index + 1].timestamp).getTime();
        duration = Math.min((nextTime - currentTime) / (1000 * 60), 30); // Cap at 30 minutes
      } else {
        // Add fixed time for last log (15 minutes)
        duration = 15;
      }
      
      // Add duration to the appropriate status
      if (log.status in durations) {
        durations[log.status as keyof typeof durations] += duration;
      }
    });
  });
  
  // Calculate total tracked time
  const totalDuration = Object.values(durations).reduce((sum, val) => sum + val, 0);
  
  if (totalDuration === 0) return "absent";
  
  // Calculate percentages based on time spent in each state
  const workingPercent = ((durations.working + durations.moving) / totalDuration) * 100;
  const idlePercent = ((durations.idle + durations.sleeping) / totalDuration) * 100;
  
  // More accurate status determination with higher thresholds
  if (workingPercent >= 65) {
    return "active";
  } else if (workingPercent >= 35) {
    return "medium";
  } else {
    return "idle";
  }
};

interface CalendarHeatmapProps {
  employees: Employee[];
}

export default function CalendarHeatmap({ employees }: CalendarHeatmapProps) {
  const [simulatedDate, setSimulatedDate] = useState<Date>(getSimulatedDate());
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);

  // Refresh the calendar every minute to simulate time progression
  useEffect(() => {
    const timer = setInterval(() => {
      setSimulatedDate(getSimulatedDate());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Get behavior logs for the selected employee or all employees
  const { data: behaviorLogsResponse = {} } = useQuery<Record<number, BehaviorLog>>({
    queryKey: ["/api/behavior-logs"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  // Convert record to array for processing
  const behaviorLogs = Object.values(behaviorLogsResponse);

  // Generate calendar data (4 weeks)
  const generateCalendarData = () => {
    const today = simulatedDate;
    const startDate = startOfWeek(subDays(today, 21));
    
    const weeks = [];
    let currentWeek = [];
    
    for (let i = 0; i < 28; i++) {
      const date = addDays(startDate, i);
      
      currentWeek.push({
        date,
        status: getDayStatus(behaviorLogs as BehaviorLog[], date),
        isToday: isSameDay(date, today),
      });
      
      if (currentWeek.length === 7) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    }
    
    return weeks;
  };

  const calendar = generateCalendarData();
  
  const handleInfoClick = () => {
    toast({
      title: "Calendar Heatmap Info",
      description: "Green: Active day, Yellow: Medium effort, Red: Idle/Sleeping day. For demo purposes, 1 day = 10 minutes.",
      variant: "default",
    });
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">Employee Activity Calendar</CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700"
              onClick={handleInfoClick}
            >
              <Info className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="text-sm text-gray-500 flex items-center">
          Current simulated date: {format(simulatedDate, "MMMM d, yyyy")}
          <span className="ml-2 text-xs text-blue-500">
            (1 day = 10 mins for demo)
          </span>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <div className="flex bg-gray-50">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="flex-1 text-center py-2 text-xs font-medium text-gray-600">
                {day}
              </div>
            ))}
          </div>
          
          <div>
            {calendar.map((week, weekIndex) => (
              <div key={weekIndex} className="flex border-t">
                {week.map((day, dayIndex) => {
                  let bgColor = "";
                  switch (day.status) {
                    case "active":
                      bgColor = "bg-green-100 hover:bg-green-200";
                      break;
                    case "medium":
                      bgColor = "bg-yellow-100 hover:bg-yellow-200";
                      break;
                    case "idle":
                      bgColor = "bg-red-100 hover:bg-red-200";
                      break;
                    case "absent":
                      bgColor = "bg-gray-100 hover:bg-gray-200";
                      break;
                    case "future":
                      bgColor = "bg-white hover:bg-gray-50";
                      break;
                  }
                  
                  return (
                    <div 
                      key={dayIndex} 
                      className={`flex-1 h-16 p-1 border-r last:border-r-0 ${bgColor} ${
                        day.isToday ? "ring-2 ring-blue-500 ring-inset" : ""
                      }`}
                    >
                      <div className="flex flex-col h-full">
                        <div className={`text-xs font-medium mb-1 ${day.isToday ? "text-blue-600" : "text-gray-600"}`}>
                          {format(day.date, "d")}
                        </div>
                        {day.status === "active" && (
                          <div className="text-xs text-green-600">Active</div>
                        )}
                        {day.status === "medium" && (
                          <div className="text-xs text-yellow-600">Medium</div>
                        )}
                        {day.status === "idle" && (
                          <div className="text-xs text-red-600">Idle</div>
                        )}
                        {day.status === "absent" && (
                          <div className="text-xs text-gray-600">Absent</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-4 flex">
          <div className="flex items-center mr-4">
            <div className="w-3 h-3 bg-green-100 border border-green-200 rounded-sm mr-1"></div>
            <span className="text-xs text-gray-600">Active</span>
          </div>
          <div className="flex items-center mr-4">
            <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded-sm mr-1"></div>
            <span className="text-xs text-gray-600">Medium Effort</span>
          </div>
          <div className="flex items-center mr-4">
            <div className="w-3 h-3 bg-red-100 border border-red-200 rounded-sm mr-1"></div>
            <span className="text-xs text-gray-600">Idle/Sleeping</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded-sm mr-1"></div>
            <span className="text-xs text-gray-600">Absent</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}