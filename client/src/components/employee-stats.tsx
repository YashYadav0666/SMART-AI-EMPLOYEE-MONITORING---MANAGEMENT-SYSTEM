import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { BehaviorLog, BehaviorStatusType } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface BehaviorTime {
  status: BehaviorStatusType;
  minutes: number;
}

interface ChartData {
  name: string;
  value: number;
  color: string;
}

interface EmployeeStatsProps {
  employeeId: number;
}

// Color mapping for behavior statuses
const STATUS_COLORS = {
  working: "#10B981", // emerald-500
  idle: "#F59E0B",    // amber-500
  sleeping: "#EF4444", // red-500
  moving: "#8B5CF6",   // purple-500
  inactive: "#9CA3AF"  // gray-400
};

export default function EmployeeStats({ employeeId }: EmployeeStatsProps) {
  const [behaviorTimes, setBehaviorTimes] = useState<Record<BehaviorStatusType, number>>({
    working: 0,
    idle: 0,
    sleeping: 0,
    moving: 0,
    inactive: 0
  });
  
  const [chartData, setChartData] = useState<ChartData[]>([]);
  
  // Fetch behavior logs
  const { data: behaviorLogs = [] } = useQuery<BehaviorLog[]>({
    queryKey: [`/api/behavior-logs/${employeeId}`],
    refetchInterval: 5000, // Poll every 5 seconds
  });
  
  // Update behavior times based on logs
  useEffect(() => {
    if (!behaviorLogs.length) return;
    
    // Group logs by status and count them
    const statusCounts: Record<BehaviorStatusType, number> = {
      working: 0,
      idle: 0,
      sleeping: 0,
      moving: 0,
      inactive: 0
    };
    
    behaviorLogs.forEach(log => {
      statusCounts[log.status as BehaviorStatusType] += 1;
    });
    
    // Convert counts to minutes (assuming each log represents a 5-second interval)
    const newBehaviorTimes: Record<BehaviorStatusType, number> = {} as Record<BehaviorStatusType, number>;
    Object.entries(statusCounts).forEach(([status, count]) => {
      newBehaviorTimes[status as BehaviorStatusType] = Math.round((count * 5) / 60);
    });
    
    setBehaviorTimes(newBehaviorTimes);
    
    // Update chart data
    const newChartData: ChartData[] = [];
    Object.entries(newBehaviorTimes).forEach(([status, minutes]) => {
      if (minutes > 0) {
        newChartData.push({
          name: status.charAt(0).toUpperCase() + status.slice(1),
          value: minutes,
          color: STATUS_COLORS[status as BehaviorStatusType]
        });
      }
    });
    
    setChartData(newChartData);
  }, [behaviorLogs]);

  // Format status name for display
  const formatStatusName = (status: BehaviorStatusType): string => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <Card>
      <CardHeader className="border-b border-gray-200 px-6 py-4">
        <CardTitle className="text-lg font-semibold text-gray-800">Today's Stats</CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(behaviorTimes).map(([status, minutes]) => (
            <div key={status} className="bg-gray-50 rounded-lg p-4">
              <div className={`text-${status} font-semibold`} style={{ color: STATUS_COLORS[status as BehaviorStatusType] }}>
                {formatStatusName(status as BehaviorStatusType)}
              </div>
              <div className="text-2xl font-bold mt-1">{minutes}m</div>
            </div>
          ))}
        </div>
        
        <div className="mt-6">
          <h3 className="text-base font-medium text-gray-700 mb-3">Behavior Distribution</h3>
          <div className="h-[180px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} minutes`, '']}
                  />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <p>No data available yet</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
