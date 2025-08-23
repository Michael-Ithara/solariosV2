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
import Dashboard from "./pages/Dashboard";
import Appliances from "./pages/Appliances";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Landing from "./pages/Landing";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SidebarProvider>
            <div className="min-h-screen w-full bg-background">
              <AppSidebar />
              <div className="w-full">
                <AppNavbar />
                <main className="w-full">
                  <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/appliances" element={<Appliances />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route 
                      path="/settings" 
                      element={
                        <ProtectedRoute requiredRole="user">
                          <Settings />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin" 
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <Admin />
                        </ProtectedRoute>
                      } 
                    />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </div>
            </div>
          </SidebarProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;