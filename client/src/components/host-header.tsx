import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HostHeaderProps {
  onLogout: () => void;
}

export default function HostHeader({ onLogout }: HostHeaderProps) {
  return (
    <header className="bg-white shadow z-10">
      <div className="flex justify-between items-center px-6 py-4">
        <div className="flex items-center">
          <button className="lg:hidden mr-4 text-gray-600">
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Host Dashboard</h1>
        </div>
        <div>
          <Button
            onClick={onLogout}
            variant="outline"
            className="px-3 py-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Exit
          </Button>
        </div>
      </div>
    </header>
  );
}
