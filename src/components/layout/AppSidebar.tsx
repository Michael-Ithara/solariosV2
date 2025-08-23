import { useState, useEffect } from "react";
import { 
  Home, 
  Zap, 
  BarChart3, 
  Settings, 
  Sun, 
  Activity,
  Lightbulb,
  Shield
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const navigationItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home, color: "from-blue-500 to-blue-600" },
  { title: "Appliances", url: "/appliances", icon: Zap, color: "from-yellow-500 to-orange-500" },
  { title: "Analytics", url: "/analytics", icon: BarChart3, color: "from-green-500 to-emerald-600" },
  { title: "Settings", url: "/settings", icon: Settings, color: "from-gray-500 to-gray-600" },
];

const energyItems = [
  { title: "Solar Production", url: "/solar", icon: Sun, color: "from-amber-500 to-yellow-500" },
  { title: "Grid Usage", url: "/grid", icon: Activity, color: "from-purple-500 to-indigo-600" },
  { title: "Energy Insights", url: "/insights", icon: Lightbulb, color: "from-cyan-500 to-blue-500" },
];

interface DockItemProps {
  title: string;
  url: string;
  icon: any;
  color: string;
  isActive: boolean;
  onClick?: () => void;
}

const DockItem = ({ title, url, icon: Icon, color, isActive, onClick }: DockItemProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative group">
      <NavLink
        to={url}
        onClick={onClick}
        className={cn(
          "relative flex items-center justify-center transition-all duration-300 ease-out transform",
          "w-12 h-12 rounded-2xl backdrop-blur-md border border-white/20",
          "hover:scale-150 hover:shadow-2xl hover:shadow-black/30",
          isActive 
            ? "bg-white/90 shadow-lg scale-110" 
            : "bg-white/20 hover:bg-white/30"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={cn(
          "w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-300",
          isActive ? "bg-gradient-to-br" : "bg-transparent",
          isActive && color
        )}>
          <Icon 
            className={cn(
              "w-5 h-5 transition-all duration-300",
              isActive ? "text-white" : "text-gray-700 group-hover:text-gray-900"
            )} 
          />
        </div>
      </NavLink>
      
      {/* Tooltip */}
      <div className={cn(
        "absolute left-16 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg",
        "bg-gray-900/90 text-white text-sm font-medium whitespace-nowrap",
        "backdrop-blur-md border border-white/10 shadow-xl",
        "transform transition-all duration-200 ease-out pointer-events-none",
        "opacity-0 -translate-x-2 scale-95",
        "group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100"
      )}>
        {title}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900/90 rotate-45 border-l border-b border-white/10" />
      </div>
    </div>
  );
};

export function AppSidebar() {
  const { hasPermission } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  // Don't show dock on landing page
  if (currentPath === "/") {
    return null;
  }

  const allItems = [
    ...navigationItems,
    ...(hasPermission('admin') ? [{ 
      title: "Admin Panel", 
      url: "/admin", 
      icon: Shield, 
      color: "from-red-500 to-pink-600" 
    }] : []),
    ...energyItems,
  ];

  return (
    <div className="fixed left-6 top-1/2 -translate-y-1/2 z-50">
      <div className="flex flex-col items-center gap-2 p-3 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
        {/* Logo */}
        <div className="mb-2 p-2">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg">
            <Zap className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Separator */}
        <div className="w-8 h-px bg-white/20 mb-2" />

        {/* Navigation Items */}
        {allItems.map((item) => (
          <DockItem
            key={item.url}
            title={item.title}
            url={item.url}
            icon={item.icon}
            color={item.color}
            isActive={isActive(item.url)}
          />
        ))}
      </div>
    </div>
  );
}