import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Employee, BehaviorLog, BehaviorStatusType } from "@shared/schema";
import HostSidebar from "@/components/host-sidebar";
import HostHeader from "@/components/host-header";
import EmployeeDetailModal from "@/components/employee-detail-modal";
import CalendarHeatmap from "@/components/calendar-heatmap";
import AbsentEmployeeNotifications from "@/components/absent-employee-notifications";

// Calculate working time percentage
const calculateProductivePercentage = (logs: BehaviorLog[]): number => {
  if (logs.length === 0) return 0;
  
  const workingLogs = logs.filter(log => log.status === "working");
  return Math.round((workingLogs.length / logs.length) * 100);
};

// Format time display
const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

export default function HostDashboard() {
  const [location, setLocation] = useLocation();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Fetch all employees
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });
  
  // Fetch latest behavior logs for all employees
  const { data: latestLogs = {} } = useQuery<Record<number, BehaviorLog>>({
    queryKey: ["/api/behavior-logs"],
    refetchInterval: 5000, // Poll every 5 seconds
  });
  
  // Track active employees count
  const activeEmployees = Object.values(latestLogs).filter(
    log => log.status !== "inactive"
  ).length;
  
  // Calculate average working time in hours
  const avgWorkingTime = employees.length > 0 ? 4.2 : 0; // Mock value, would be calculated from real data
  
  // Handle employee detail view
  const handleViewEmployeeDetails = (id: number) => {
    setSelectedEmployeeId(id);
    setIsDetailModalOpen(true);
  };
  
  // Handle logout
  const handleLogout = () => {
    setLocation("/");
  };
  
  // Get status class name for styling
  const getStatusClassName = (status: BehaviorStatusType): string => {
    switch (status) {
      case "working": return "bg-working bg-opacity-10 text-working";
      case "idle": return "bg-idle bg-opacity-10 text-idle";
      case "sleeping": return "bg-sleeping bg-opacity-10 text-sleeping";
      case "moving": return "bg-moving bg-opacity-10 text-moving";
      default: return "bg-gray-100 text-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <HostSidebar />
      
      <div className="flex-1 flex flex-col">
        <HostHeader onLogout={handleLogout} />
        
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Dashboard Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Total Employees</p>
                    <p className="text-3xl font-bold text-gray-800">{employees.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  <span className="text-green-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                    </svg>
                    {employees.length > 0 ? 1 : 0}
                  </span> since yesterday
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Active Now</p>
                    <p className="text-3xl font-bold text-gray-800">{activeEmployees}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  <span className="text-red-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
                    </svg>
                    0
                  </span> since an hour ago
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Avg. Working Time</p>
                    <p className="text-3xl font-bold text-gray-800">{avgWorkingTime}h</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  <span className="text-green-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                    </svg>
                    0.3h
                  </span> since yesterday
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Work Submissions</p>
                    <p className="text-3xl font-bold text-gray-800">0</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  <span className="text-green-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                    </svg>
                    0
                  </span> since yesterday
                </div>
              </div>
            </div>
            
            {/* Current Activity */}
            <div className="bg-white rounded-xl shadow mb-8">
              <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">Current Employee Activity</h2>
                <button className="text-sm text-blue-500 hover:text-blue-700">
                  View All
                </button>
              </div>
              
              <div className="p-6">
                {employees.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <p className="text-lg font-medium">No employees registered yet</p>
                    <p className="mt-1">Employees will appear here once they join the system</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Employee
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Time Today
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Working
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {employees.map(employee => {
                          // Get latest status for this employee
                          const latestLog = latestLogs[employee.id];
                          const status = latestLog?.status || "inactive";
                          
                          // Mock time calculation - would be from actual logs in production
                          const timeToday = Math.floor(Math.random() * 5) + 1; // 1-5 hours
                          const productivePercentage = Math.floor(Math.random() * 100);
                          
                          return (
                            <tr key={employee.id}>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mr-3">
                                    {employee.name.split(' ').map(n => n[0]).join('')}
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-800">{employee.name}</div>
                                    <div className="text-gray-500 text-sm">Employee</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs font-medium ${getStatusClassName(status)} rounded-full`}>
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                                {timeToday}h {Math.floor(Math.random() * 60)}m
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                  <div className="bg-working h-2.5 rounded-full" style={{ width: `${productivePercentage}%` }}></div>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">{productivePercentage}% productive</div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm">
                                <button 
                                  onClick={() => handleViewEmployeeDetails(employee.id)}
                                  className="text-blue-500 hover:text-blue-700 mr-3">
                                  View
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
            
            {/* Notifications for Absent Employees */}
            <div className="mb-8">
              <AbsentEmployeeNotifications employees={employees} />
            </div>
            
            {/* Calendar Heatmap */}
            <div className="mb-8">
              <CalendarHeatmap employees={employees} />
            </div>
            
            {/* Employee Detail Modal */}
            {selectedEmployeeId && (
              <EmployeeDetailModal 
                isOpen={isDetailModalOpen}
                employeeId={selectedEmployeeId}
                onClose={() => setIsDetailModalOpen(false)}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
