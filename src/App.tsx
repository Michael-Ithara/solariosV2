import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import Appliances from "./pages/Appliances";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Landing from "./pages/Landing";

const queryClient = new QueryClient();

function AppContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleMenuClick = () => {
    setIsSidebarOpen(true);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen w-full bg-background">
      <AppSidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />
      <div className="w-full">
        <AppNavbar onMenuClick={handleMenuClick} />
        <main className="w-full">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<div className={!isMobile ? "ml-20" : ""}><Dashboard /></div>} />
            <Route path="/appliances" element={<div className={!isMobile ? "ml-20" : ""}><Appliances /></div>} />
            <Route path="/analytics" element={<div className={!isMobile ? "ml-20" : ""}><Analytics /></div>} />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute requiredRole="user">
                  <div className={!isMobile ? "ml-20" : ""}><Settings /></div>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <div className={!isMobile ? "ml-20" : ""}><Admin /></div>
                </ProtectedRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<div className={!isMobile ? "ml-20" : ""}><NotFound /></div>} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SidebarProvider>
            <AppContent />
          </SidebarProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;