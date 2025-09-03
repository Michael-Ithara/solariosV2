import { useState, useEffect } from "react";
import { 
  Home, 
  Zap, 
  BarChart3, 
  Settings, 
  Sun, 
  Activity,
  Lightbulb,
  Shield,
  Menu,
  X,
  Brain
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";


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
    <div className="relative group flex-shrink-0">
      <NavLink
        to={url}
        onClick={onClick}
        className={cn(
          "relative flex items-center justify-center transition-all duration-300 ease-out transform",
          "w-10 h-10 rounded-xl md:w-12 md:h-12 md:rounded-2xl md:hover:scale-150 md:hover:shadow-2xl md:hover:shadow-black/30",
          "backdrop-blur-md border border-white/20",
          isActive 
            ? "bg-white/90 shadow-lg scale-110" 
            : "bg-white/20 hover:bg-white/30"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={cn(
          "rounded-lg flex items-center justify-center transition-all duration-300",
          "w-5 h-5 md:w-6 md:h-6",
          isActive ? "bg-gradient-to-br" : "bg-transparent",
          isActive && color
        )}>
          <Icon 
            className={cn(
              "transition-all duration-300",
              "w-4 h-4 md:w-5 md:h-5",
              isActive ? "text-white" : "text-gray-700 group-hover:text-gray-900"
            )} 
          />
        </div>
      </NavLink>
      
      {/* Tooltip - Hide on mobile */}
      <div className={cn(
        "absolute px-3 py-1.5 rounded-lg",
        "bg-gray-900/90 text-white text-sm font-medium whitespace-nowrap",
        "backdrop-blur-md border border-white/10 shadow-xl",
        "transform transition-all duration-200 ease-out pointer-events-none",
        "opacity-0 scale-95",
        "group-hover:opacity-100 group-hover:scale-100",
        "hidden md:block", // Hide on mobile
        "left-16 top-1/2 -translate-y-1/2 -translate-x-2 group-hover:translate-x-0"
      )}>
        {title}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900/90 rotate-45 border-l border-b border-white/10" />
      </div>
    </div>
  );
};

export function AppSidebar() {
  // ALWAYS call all hooks first - before any conditional logic
  const { user, role, hasPermission } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isVisible, setIsVisible] = useState(!isMobile);
  
  // Process location after hooks
  const currentPath = location.pathname;
  const isActive = (path: string) => currentPath === path;

  // Auto-hide on mobile when location changes
  useEffect(() => {
    if (isMobile) {
      setIsVisible(false);
    }
  }, [currentPath, isMobile]);

  // Build items list based on auth state
  const getNavigationItems = () => {
    // Demo mode - only dashboard access
    if (currentPath === '/demo' || (!user && currentPath !== '/')) {
      return [
        { title: "Demo Dashboard", url: "/demo", icon: Home, color: "from-blue-500 to-blue-600" },
      ];
    }

    // Authenticated users - full access
    if (user) {
      const baseItems = [
        { title: "Dashboard", url: "/dashboard", icon: Home, color: "from-blue-500 to-blue-600" },
        { title: "Appliances", url: "/appliances", icon: Zap, color: "from-yellow-500 to-orange-500" },
        { title: "Analytics", url: "/analytics", icon: BarChart3, color: "from-green-500 to-emerald-600" },
        { title: "AI Insights", url: "/insights", icon: Brain, color: "from-purple-500 to-violet-600" },
        { title: "Settings", url: "/settings", icon: Settings, color: "from-gray-500 to-gray-600" },
      ];

      const adminItems = hasPermission('admin') ? [{ 
        title: "Admin Panel", 
        url: "/admin", 
        icon: Shield, 
        color: "from-red-500 to-pink-600" 
      }] : [];

      return [...baseItems, ...adminItems];
    }

    // No items for landing page
    return [];
  };

  const allItems = getNavigationItems();

  // CONDITIONAL RENDERING AFTER ALL HOOKS
  // Don't show dock on landing page
  if (currentPath === "/" || allItems.length === 0) {
    return null;
  }

  return (
    <>
      {/* Mobile Trigger Button */}
      {isMobile && (
        <button
          onClick={() => setIsVisible(!isVisible)}
          className={cn(
            "fixed top-4 left-4 z-[60] p-3 rounded-2xl transition-all duration-300",
            "bg-gradient-to-br from-primary/20 via-energy-solar/20 to-primary/20 backdrop-blur-md border border-white/30 shadow-lg",
            "hover:from-primary/30 hover:via-energy-solar/30 hover:to-primary/30 hover:scale-110 hover:shadow-xl",
            "hover:border-primary/50 hover:shadow-primary/20",
            isVisible && "rotate-90 from-primary/40 via-energy-solar/40 to-primary/40"
          )}
        >
          {isVisible ? (
            <X className="w-5 h-5 text-primary drop-shadow-sm" />
          ) : (
            <Menu className="w-5 h-5 text-primary drop-shadow-sm" />
          )}
        </button>
      )}

      {/* Floating Dock */}
      <div className={cn(
        "fixed z-50 transition-all duration-300 ease-out",
        isMobile 
          ? cn(
              "left-1/2 bottom-6 -translate-x-1/2",
              "transform transition-all duration-300",
              isVisible 
                ? "translate-y-0 opacity-100" 
                : "translate-y-full opacity-0 pointer-events-none"
            )
          : "left-6 top-1/2 -translate-y-1/2"
      )}>
        <div className={cn(
          "flex items-center rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl",
          isMobile 
            ? "flex-row gap-1 p-2 max-w-[90vw]" 
            : "flex-col gap-2 p-3"
        )}>
          {/* Logo */}
          <div className={cn("flex-shrink-0", isMobile ? "p-1 mr-1" : "p-2 mb-2")}>
            <div className={cn(
              "bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg",
              isMobile ? "w-8 h-8" : "w-10 h-10"
            )}>
              <Zap className={cn("text-white", isMobile ? "w-4 h-4" : "w-6 h-6")} />
            </div>
          </div>

          {/* Separator */}
          <div className={cn(
            "bg-white/20 flex-shrink-0",
            isMobile ? "w-px h-6 mr-1" : "w-8 h-px mb-2"
          )} />

          {/* Navigation Items - Scrollable on mobile */}
          {isMobile ? (
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-1 pb-1" style={{ width: `${allItems.length * 44}px` }}>
                {allItems.map((item, index) => (
                  <DockItem
                    key={item.url}
                    title={item.title}
                    url={item.url}
                    icon={item.icon}
                    color={item.color}
                    isActive={isActive(item.url)}
                    onClick={() => {
                      if (isMobile) {
                        setIsVisible(false);
                        // Auto-scroll to center the clicked item
                        setTimeout(() => {
                          const container = document.querySelector('.overflow-x-auto');
                          if (container) {
                            const itemWidth = 44; // w-10 + gap
                            const containerWidth = container.clientWidth;
                            const scrollPosition = Math.max(0, (index * itemWidth) - (containerWidth / 2) + (itemWidth / 2));
                            container.scrollTo({ left: scrollPosition, behavior: 'smooth' });
                          }
                        }, 50);
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {allItems.map((item) => (
                <DockItem
                  key={item.url}
                  title={item.title}
                  url={item.url}
                  icon={item.icon}
                  color={item.color}
                  isActive={isActive(item.url)}
                  onClick={() => isMobile && setIsVisible(false)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}