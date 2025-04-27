import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings
} from "lucide-react";

export default function HostSidebar() {
  return (
    <div className="hidden lg:block w-64 bg-gray-800 text-white flex-shrink-0">
      <div className="p-6">
        <h1 className="text-xl font-bold">Admin Panel</h1>
        <p className="text-gray-400 text-sm">Host Dashboard</p>
      </div>
      
      <nav className="mt-6">
        <SidebarItem href="#" icon={<LayoutDashboard className="w-5 h-5 mr-3" />} text="Dashboard" active />
        <SidebarItem href="#" icon={<Users className="w-5 h-5 mr-3" />} text="Employees" />
        <SidebarItem href="#" icon={<BarChart3 className="w-5 h-5 mr-3" />} text="Reports" />
        <SidebarItem href="#" icon={<Settings className="w-5 h-5 mr-3" />} text="Settings" />
      </nav>
    </div>
  );
}

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  text: string;
  active?: boolean;
}

function SidebarItem({ href, icon, text, active = false }: SidebarItemProps) {
  return (
    <a 
      href={href}
      className={cn(
        "flex items-center px-6 py-3",
        active ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"
      )}
    >
      {icon}
      <span>{text}</span>
    </a>
  );
}
