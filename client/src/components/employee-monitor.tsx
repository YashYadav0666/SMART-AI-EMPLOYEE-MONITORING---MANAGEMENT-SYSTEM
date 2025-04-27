import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BehaviorStatusType } from "@shared/schema";
import { initializeWebcam, stopWebcam, captureWebcamFrame, analyzeBehavior } from "@/lib/webcam";
import { captureScreenshot, uploadScreenshot } from "@/lib/screenshot";
import { AlertCircle } from "lucide-react";

interface EmployeeMonitorProps {
  employeeId: number;
  onBehaviorChange: (status: BehaviorStatusType) => void;
  onProjectStart: () => void;
  onProjectStop: () => void;
}

export default function EmployeeMonitor({
  employeeId,
  onBehaviorChange,
  onProjectStart,
  onProjectStop
}: EmployeeMonitorProps) {
  const [projectActive, setProjectActive] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<BehaviorStatusType>("inactive");
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const behaviorIntervalRef = useRef<number | null>(null);
  const screenshotIntervalRef = useRef<number | null>(null);

  // Mutations for uploading screenshots
  const screenshotMutation = useMutation({
    mutationFn: async (imageData: string) => {
      await uploadScreenshot(imageData, employeeId);
    }
  });
  
  // Handle starting/stopping monitoring
  const toggleProject = async () => {
    if (projectActive) {
      // Stop the project
      if (behaviorIntervalRef.current) {
        window.clearInterval(behaviorIntervalRef.current);
        behaviorIntervalRef.current = null;
      }
      
      if (screenshotIntervalRef.current) {
        window.clearInterval(screenshotIntervalRef.current);
        screenshotIntervalRef.current = null;
      }
      
      if (streamRef.current) {
        stopWebcam(streamRef.current);
        streamRef.current = null;
      }
      
      setCurrentStatus("inactive");
      onBehaviorChange("inactive");
      setProjectActive(false);
      onProjectStop();
    } else {
      // Start the project
      try {
        if (videoRef.current) {
          streamRef.current = await initializeWebcam(videoRef.current);
          
          // Start behavior analysis interval
          behaviorIntervalRef.current = window.setInterval(async () => {
            try {
              if (videoRef.current && streamRef.current && streamRef.current.active) {
                const imageData = captureWebcamFrame(videoRef.current);
                
                // Send frame for behavior analysis
                const status = await analyzeBehavior(imageData, employeeId);
                
                if (status !== currentStatus) {
                  setCurrentStatus(status);
                  onBehaviorChange(status);
                  
                  // Show warning for idle or sleeping
                  if (status === "idle" || status === "sleeping") {
                    setWarningMessage(`You appear to be ${status}!`);
                    setShowWarning(true);
                    
                    // Auto-hide warning after 3 seconds
                    setTimeout(() => {
                      setShowWarning(false);
                    }, 3000);
                  }
                }
              }
            } catch (error) {
              console.error("Error during behavior analysis:", error);
            }
          }, 5000); // Check behavior every 5 seconds
          
          // Start screenshot capture interval
          screenshotIntervalRef.current = window.setInterval(async () => {
            try {
              const screenshotData = await captureScreenshot();
              screenshotMutation.mutate(screenshotData);
            } catch (error) {
              console.error("Error during screenshot capture:", error);
            }
          }, 10000); // Capture screenshot every 10 seconds
          
          setCurrentStatus("working"); // Initial status
          onBehaviorChange("working");
          setProjectActive(true);
          onProjectStart();
        }
      } catch (error) {
        console.error("Error starting webcam:", error);
      }
    }
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (behaviorIntervalRef.current) {
        window.clearInterval(behaviorIntervalRef.current);
      }
      
      if (screenshotIntervalRef.current) {
        window.clearInterval(screenshotIntervalRef.current);
      }
      
      if (streamRef.current) {
        stopWebcam(streamRef.current);
      }
    };
  }, []);
  
  // --- RANDOM SCREENSHOT CAPTURE ---
  useEffect(() => {
    if (!employeeId) return;
    let cancelled = false;

    function getRandomInterval() {
      // Random interval between 2 and 5 minutes
      return 120000 + Math.random() * 180000;
    }

    async function takeAndUploadScreenshot() {
      if (cancelled) return;
      try {
        const imageData = await captureScreenshot();
        await uploadScreenshot(imageData, employeeId);
      } catch (err) {
        console.warn("Screenshot capture/upload failed", err);
      }
      if (!cancelled) {
        setTimeout(takeAndUploadScreenshot, getRandomInterval());
      }
    }

    // Start the first screenshot after a random interval
    const initialTimeout = setTimeout(takeAndUploadScreenshot, getRandomInterval());

    return () => {
      cancelled = true;
      clearTimeout(initialTimeout);
    };
  }, [employeeId]);
  // --- END RANDOM SCREENSHOT CAPTURE ---
  
  // Get status color class
  const getStatusColorClass = (status: BehaviorStatusType): string => {
    switch (status) {
      case "working": return "bg-working text-working";
      case "idle": return "bg-idle text-idle";
      case "sleeping": return "bg-sleeping text-sleeping";
      case "moving": return "bg-moving text-moving";
      default: return "bg-gray-300 text-gray-600";
    }
  };

  return (
    <Card>
      <CardHeader className="border-b border-gray-200 px-6 py-4 flex flex-row justify-between items-center">
        <CardTitle className="text-lg font-semibold text-gray-800">Behavior Monitoring</CardTitle>
        <div className="flex items-center">
          <span className={`inline-block w-3 h-3 rounded-full ${getStatusColorClass(currentStatus).split(" ")[0]} mr-2`}></span>
          <span className={`text-sm ${getStatusColorClass(currentStatus).split(" ")[1]}`}>
            {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="relative bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center h-[300px]">
          {/* Camera placeholder when inactive */}
          <div className={`text-center p-6 ${projectActive ? 'hidden' : 'block'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500">Camera is not active</p>
            <p className="text-gray-400 text-sm mt-1">Click 'Start Project' to activate monitoring</p>
          </div>
          
          {/* Webcam video when active */}
          <video 
            ref={videoRef}
            className={`w-full h-full object-cover ${projectActive ? 'block' : 'hidden'}`}
            autoPlay
            muted
            playsInline
          />
          
          {/* Warning overlay */}
          <div className={`absolute inset-0 bg-red-500 bg-opacity-30 flex items-center justify-center transition-opacity ${showWarning ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="bg-white rounded-lg px-6 py-4 shadow-lg">
              <div className="flex items-center text-red-500 font-semibold">
                <AlertCircle className="mr-2 h-5 w-5" />
                <span>{warningMessage}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-between items-center">
          <div>
            <Button
              onClick={toggleProject}
              className={projectActive 
                ? "px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
                : "px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
              }
            >
              {projectActive ? "Stop Project" : "Start Project"}
            </Button>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-gray-600">Current State:</p>
            <p className="font-semibold text-gray-800">
              {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
