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
  ChevronLeft
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const navigationItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Appliances", url: "/appliances", icon: Zap },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
];

const energyItems = [
  { title: "Solar Production", url: "/solar", icon: Sun },
  { title: "Grid Usage", url: "/grid", icon: Activity },
  { title: "Energy Insights", url: "/insights", icon: Lightbulb },
];

export function AppSidebar() {
  const { role, hasPermission } = useAuth();
  const { state, setOpen } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  // Auto-collapse on mobile when navigating
  useEffect(() => {
    if (isMobile && currentPath !== "/") {
      setOpen(false);
    }
  }, [currentPath, isMobile, setOpen]);

  const isActive = (path: string) => currentPath === path;
  
  const handleNavClick = (path: string) => {
    // Auto-collapse sidebar after navigation on desktop too
    if (currentPath !== path) {
      setTimeout(() => setOpen(false), 150);
    }
  };

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive 
        ? "bg-primary text-primary-foreground shadow-md" 
        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    }`;

  return (
    <Sidebar
      className={`${collapsed ? "w-16" : "w-72"} border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out shadow-lg`}
      collapsible="icon"
    >
      <SidebarContent className="flex flex-col h-full p-4 space-y-4">
        {/* Header with Logo and Collapse Button */}
        <div className="flex items-center justify-between mb-6">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
                <Zap className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-sidebar-foreground">Solarios</h1>
                <p className="text-xs text-sidebar-foreground/60">Energy Management</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center mx-auto shadow-lg">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
          )}
        </div>

        {/* Main Navigation */}
        <div className="space-y-2">
          {!collapsed && (
            <h2 className="px-3 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
              Main Navigation
            </h2>
          )}
          <nav className="space-y-1">
            {navigationItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                end
                className={getNavCls}
                onClick={() => handleNavClick(item.url)}
                title={collapsed ? item.title : undefined}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Admin Section */}
        {hasPermission('admin') && (
          <div className="space-y-2">
            {!collapsed && (
              <h2 className="px-3 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
                Administration
              </h2>
            )}
            <nav className="space-y-1">
              <NavLink
                to="/admin"
                className={getNavCls}
                onClick={() => handleNavClick("/admin")}
                title={collapsed ? "Admin Panel" : undefined}
              >
                <Shield className="w-5 h-5 shrink-0" />
                {!collapsed && <span>Admin Panel</span>}
              </NavLink>
            </nav>
          </div>
        )}

        {/* Energy Section */}
        <div className="space-y-2">
          {!collapsed && (
            <h2 className="px-3 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
              Energy Management
            </h2>
          )}
          <nav className="space-y-1">
            {energyItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                className={getNavCls}
                onClick={() => handleNavClick(item.url)}
                title={collapsed ? item.title : undefined}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </NavLink>
            ))}
          </nav>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}