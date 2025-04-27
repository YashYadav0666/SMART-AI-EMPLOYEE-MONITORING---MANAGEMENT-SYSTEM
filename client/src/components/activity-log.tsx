import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Activity } from "@/pages/employee-dashboard";

interface ActivityLogProps {
  activities: Activity[];
}

export default function ActivityLog({ activities }: ActivityLogProps) {
  // Get the appropriate icon and color for an activity
  const getActivityIcon = (activity: Activity): { icon: JSX.Element; bgColor: string } => {
    switch (activity.type) {
      case "project_start":
        return {
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          bgColor: "bg-blue-100",
        };
      case "project_stop":
        return {
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
          ),
          bgColor: "bg-blue-100",
        };
      case "work_submission":
        return {
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          ),
          bgColor: "bg-blue-100",
        };
      case "behavior":
        if (activity.status === "working") {
          return {
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-working" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            ),
            bgColor: "bg-working bg-opacity-10",
          };
        } else if (activity.status === "idle") {
          return {
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-idle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            bgColor: "bg-idle bg-opacity-10",
          };
        } else if (activity.status === "sleeping") {
          return {
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-sleeping" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ),
            bgColor: "bg-sleeping bg-opacity-10",
          };
        } else if (activity.status === "moving") {
          return {
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-moving" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            ),
            bgColor: "bg-moving bg-opacity-10",
          };
        }
        // Default for behavior
        return {
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          bgColor: "bg-gray-100",
        };
      default:
        return {
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          bgColor: "bg-gray-100",
        };
    }
  };

  return (
    <Card className="sticky top-6">
      <CardHeader className="border-b border-gray-200 px-6 py-4">
        <CardTitle className="text-lg font-semibold text-gray-800">Activity Log</CardTitle>
      </CardHeader>
      
      <CardContent className="p-4">
        <ScrollArea className="h-[600px]">
          {activities.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p>No activities recorded yet</p>
              <p className="text-sm mt-1">Start a project to begin tracking</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => {
                const { icon, bgColor } = getActivityIcon(activity);
                
                return (
                  <div key={activity.id} className="mb-3 border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                    <div className="flex items-start">
                      <div className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center mr-3 flex-shrink-0`}>
                        {icon}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{activity.message}</p>
                        <p className="text-gray-600 text-sm">{activity.details}</p>
                        <p className="text-gray-400 text-xs mt-1">
                          {format(activity.timestamp, "h:mm a")}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
