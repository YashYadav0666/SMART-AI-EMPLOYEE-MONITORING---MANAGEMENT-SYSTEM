import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Employee, BehaviorLog, Screenshot, WorkSubmission } from "@shared/schema";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download, Eye, Lock, Info, Maximize, Film, ChevronLeft, ChevronRight } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface EmployeeDetailModalProps {
  isOpen: boolean;
  employeeId: number;
  onClose: () => void;
}

// Color mapping for behavior statuses
const STATUS_COLORS = {
  working: "#10B981", // emerald-500
  idle: "#F59E0B",    // amber-500
  sleeping: "#EF4444", // red-500
  moving: "#8B5CF6",   // purple-500
  inactive: "#9CA3AF"  // gray-400
};

export default function EmployeeDetailModal({
  isOpen,
  employeeId,
  onClose,
}: EmployeeDetailModalProps) {
  const [currentScreenshotIndex, setCurrentScreenshotIndex] = useState(0);
  
  // Fetch employee details
  const { data: employee } = useQuery<Employee>({
    queryKey: [`/api/employees/${employeeId}`],
    enabled: isOpen && !!employeeId,
  });
  
  // Fetch behavior logs
  const { data: behaviorLogs = [] } = useQuery<BehaviorLog[]>({
    queryKey: [`/api/behavior-logs/${employeeId}`],
    enabled: isOpen && !!employeeId,
    refetchInterval: 5000, // Refresh every 5 seconds when modal is open
  });
  
  // Fetch screenshots
  const { data: screenshots = [] } = useQuery<Screenshot[]>({
    queryKey: [`/api/screenshots/${employeeId}`],
    enabled: isOpen && !!employeeId,
    refetchInterval: 10000, // Refresh every 10 seconds
  });
  
  // Fetch work submissions
  const { data: workSubmissions = [] } = useQuery<WorkSubmission[]>({
    queryKey: [`/api/work-submissions/${employeeId}`],
    enabled: isOpen && !!employeeId,
  });
  
  // Reset current screenshot index when modal opens or screenshots update
  useEffect(() => {
    if (isOpen && screenshots.length > 0) {
      setCurrentScreenshotIndex(0);
    }
  }, [isOpen, screenshots]);
  
  // Calculate behavior times
  const calculateBehaviorTimes = () => {
    const times = {
      working: 0,
      idle: 0,
      sleeping: 0,
      moving: 0,
    };
    
    behaviorLogs.forEach(log => {
      if (log.status in times) {
        times[log.status as keyof typeof times] += 1;
      }
    });
    
    // Convert to hours and minutes (each log is 5 seconds)
    const result = {} as Record<string, string>;
    Object.entries(times).forEach(([status, count]) => {
      const minutes = Math.round((count * 5) / 60);
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      result[status] = `${hours}h ${mins}m`;
    });
    
    return result;
  };
  
  // Calculate salary based on working time
  const calculateSalary = () => {
    const hourlyRate = 25.0; // Hourly rate in dollars
    const workingLogs = behaviorLogs.filter(log => log.status === "working").length;
    const workingHours = (workingLogs * 5) / 3600; // Convert 5-second intervals to hours
    const salary = hourlyRate * workingHours;
    
    return {
      hourlyRate,
      workingHours: workingHours.toFixed(2),
      total: salary.toFixed(2),
    };
  };
  
  // Prepare chart data
  const prepareChartData = () => {
    const statusCounts = {
      working: 0,
      idle: 0,
      sleeping: 0,
      moving: 0,
    };
    
    behaviorLogs.forEach(log => {
      if (log.status in statusCounts) {
        statusCounts[log.status as keyof typeof statusCounts] += 1;
      }
    });
    
    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      color: STATUS_COLORS[status as keyof typeof STATUS_COLORS],
    }));
  };
  
  // Get employee initials for avatar
  const getEmployeeInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };
  
  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };
  
  // Handle screenshot navigation
  const navigateScreenshot = (index: number) => {
    setCurrentScreenshotIndex(index);
  };
  
  // Fullscreen screenshot viewing
  const [showFullscreenScreenshot, setShowFullscreenScreenshot] = useState(false);
  
  // Handle downloading screenshot
  const handleDownloadScreenshot = (screenshot: Screenshot) => {
    if (!screenshot || !screenshot.imageData) {
      toast({
        title: "Download Error",
        description: "Screenshot data is not available for download.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Create a data URL for the image
      const dataUrl = `data:image/jpeg;base64,${screenshot.imageData}`;
      
      // Create download link
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `screenshot-${new Date(screenshot.timestamp).toISOString().replace(/[:.]/g, '-')}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: "Downloading screenshot",
        variant: "default",
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download Error",
        description: "There was a problem downloading the screenshot.",
        variant: "destructive",
      });
    }
  };

  // View work submission
  const [viewingSubmission, setViewingSubmission] = useState<WorkSubmission | null>(null);
  const [showWorkViewDialog, setShowWorkViewDialog] = useState(false);

  const handleViewSubmission = (submission: WorkSubmission) => {
    if (!submission || !submission.fileData) {
      toast({
        title: "Download Error",
        description: "File data is not available for download.",
        variant: "destructive",
      });
      return;
    }
    
    // Create a download link
    try {
      // Create a data URL for the file
      const mimeType = getMimeType(submission.fileName);
      const dataUrl = `data:${mimeType};base64,${submission.fileData}`;
      
      // Create download link
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = submission.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: `Downloading ${submission.fileName}`,
        variant: "default",
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download Error",
        description: "There was a problem downloading the file.",
        variant: "destructive",
      });
    }
  };
  
  // Helper to determine MIME type from filename
  const getMimeType = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    const mimeTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'txt': 'text/plain',
    };
    
    return mimeTypes[extension] || 'application/octet-stream';
  };
  
  const behaviorTimes = calculateBehaviorTimes();
  const salary = calculateSalary();
  const chartData = prepareChartData();

  if (!employee) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${isOpen ? 'block' : 'hidden'}`}>
        <div className="bg-white rounded-lg max-w-5xl w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mr-4">
                {getEmployeeInitials(employee.name)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{employee.name}</h2>
                <p className="text-gray-600">Employee</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div>
              {/* Behavior Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Behavior Summary</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Working Time</p>
                    <p className="text-xl font-bold text-gray-800">{behaviorTimes.working || '0h 0m'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Idle Time</p>
                    <p className="text-xl font-bold text-gray-800">{behaviorTimes.idle || '0h 0m'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Sleeping Time</p>
                    <p className="text-xl font-bold text-gray-800">{behaviorTimes.sleeping || '0h 0m'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Moving Time</p>
                    <p className="text-xl font-bold text-gray-800">{behaviorTimes.moving || '0h 0m'}</p>
                  </div>
                </div>
                
                <div className="h-[200px]">
                  {chartData.some(d => d.value > 0) ? (
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
                        <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                      <p>No behavior data available</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Salary Calculation */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Salary Calculation</h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hourly Rate</span>
                    <span className="font-medium text-gray-800">${salary.hourlyRate.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Working Hours</span>
                    <span className="font-medium text-gray-800">{salary.workingHours}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-700">Total Today</span>
                      <span className="font-bold text-gray-800">${salary.total}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Attendance Log */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Attendance Log</h3>
                
                {behaviorLogs.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">First Activity</span>
                      <span className="font-medium text-gray-800">
                        {format(new Date(behaviorLogs[behaviorLogs.length - 1].timestamp), "h:mm a")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Activity</span>
                      <span className="font-medium text-gray-800">
                        {format(new Date(behaviorLogs[0].timestamp), "h:mm a")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status Changes</span>
                      <span className="font-medium text-gray-800">{behaviorLogs.length}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p>No attendance data available</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Right Column */}
            <div>
              {/* Screen Captures */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Screen Captures</h3>
                  <div className="text-sm text-gray-500">Updates every 10 seconds</div>
                </div>
                
                {screenshots.length > 0 ? (
                  <>
                    <div className="relative rounded-lg overflow-hidden bg-gray-200 h-[300px]">
                      <img 
                        src={`data:image/jpeg;base64,${screenshots[currentScreenshotIndex].imageData}`} 
                        alt="Screen capture" 
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gray-800 bg-opacity-75 text-white px-4 py-2 text-sm">
                        <div className="flex justify-between">
                          <span>
                            Captured at {format(new Date(screenshots[currentScreenshotIndex].timestamp), "h:mm a")}
                          </span>
                          <span>
                            {Math.round((Date.now() - new Date(screenshots[currentScreenshotIndex].timestamp).getTime()) / 1000)} seconds ago
                          </span>
                        </div>
                      </div>
                      <div className="absolute top-2 right-2 flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          className="bg-white bg-opacity-75 hover:bg-opacity-100"
                          onClick={() => setShowFullscreenScreenshot(true)}
                        >
                          <Maximize className="h-4 w-4 mr-1" />
                          <span className="text-xs">Fullscreen</span>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          className="bg-white bg-opacity-75 hover:bg-opacity-100"
                          onClick={() => handleDownloadScreenshot(screenshots[currentScreenshotIndex])}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          <span className="text-xs">Download</span>
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex space-x-2">
                      {screenshots.slice(0, 5).map((screenshot, index) => (
                        <div 
                          key={screenshot.id}
                          className={`w-1/5 h-16 bg-gray-200 rounded cursor-pointer overflow-hidden ${
                            index === currentScreenshotIndex ? 'ring-2 ring-blue-500' : ''
                          }`}
                          onClick={() => navigateScreenshot(index)}
                        >
                          <img 
                            src={`data:image/jpeg;base64,${screenshot.imageData}`} 
                            alt={`Screen thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="w-full h-[300px] bg-gray-200 rounded-lg flex items-center justify-center">
                      <div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <p>No screen captures available</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Work Submissions */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Work Submissions</h3>
                
                {workSubmissions.length > 0 ? (
                  <div className="space-y-4">

                    
                    {workSubmissions.map((submission) => (
                      <div key={submission.id} className="bg-white p-3 rounded-lg shadow-sm">
                        <div className="flex justify-between mb-2">
                          <h4 className="font-medium text-gray-800">{submission.fileName}</h4>
                          <span className="text-xs text-gray-500">
                            {format(new Date(submission.timestamp), "h:mm a")}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{submission.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">{formatFileSize(submission.fileSize)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-500 text-sm hover:text-blue-700 flex items-center"
                            onClick={() => handleViewSubmission(submission)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>No work submissions yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Work Submission Viewer */}
      <AlertDialog open={showWorkViewDialog} onOpenChange={setShowWorkViewDialog}>
        <AlertDialogContent className="max-w-4xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              {viewingSubmission?.fileName}
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({formatFileSize(viewingSubmission?.fileSize || 0)})
              </span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              {viewingSubmission?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="my-4 border rounded-lg overflow-hidden">
            {viewingSubmission && (
              <div className="max-h-[500px] overflow-auto bg-gray-50 p-4">
                {/* Show content based on file type - for demo just showing the base64 as text */}
                <pre className="text-xs whitespace-pre-wrap overflow-x-auto">
                  {viewingSubmission.fileData.substring(0, 200)}...
                </pre>
              </div>
            )}
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Fullscreen Screenshot Viewer */}
      <AlertDialog open={showFullscreenScreenshot} onOpenChange={setShowFullscreenScreenshot}>
        <AlertDialogContent className="max-w-7xl w-[95vw] h-[90vh] p-1">
          <div className="relative h-full">
            <div className="absolute top-2 right-2 flex space-x-2 z-10">
              <Button 
                size="sm" 
                variant="secondary" 
                className="bg-white bg-opacity-75 hover:bg-opacity-100"
                onClick={() => handleDownloadScreenshot(screenshots[currentScreenshotIndex])}
              >
                <Download className="h-4 w-4 mr-1" />
                <span className="text-xs">Download</span>
              </Button>
              <Button 
                size="sm" 
                variant="secondary" 
                className="bg-white bg-opacity-75 hover:bg-opacity-100"
                onClick={() => setShowFullscreenScreenshot(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="bg-black h-full flex items-center justify-center">
              {screenshots.length > 0 && (
                <img 
                  src={`data:image/jpeg;base64,${screenshots[currentScreenshotIndex].imageData}`} 
                  alt="Screen capture fullscreen"
                  className="max-h-full max-w-full object-contain" 
                />
              )}
            </div>
            
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full">
              <div className="flex items-center space-x-1">
                <Button 
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white hover:bg-opacity-10"
                  disabled={currentScreenshotIndex === screenshots.length - 1}
                  onClick={() => navigateScreenshot(currentScreenshotIndex + 1)}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <span>
                  {currentScreenshotIndex + 1} / {screenshots.length}
                </span>
                <Button 
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white hover:bg-opacity-10"
                  disabled={currentScreenshotIndex === 0}
                  onClick={() => navigateScreenshot(currentScreenshotIndex - 1)}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
