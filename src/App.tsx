import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { useAuth } from "@/contexts/AuthContext";
import { useLiveAchievements } from "@/hooks/useLiveAchievements";
import Dashboard from "./pages/Dashboard";
import Appliances from "./pages/Appliances";
import Analytics from "./pages/Analytics";
import Insights from "./pages/Insights";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Landing from "./pages/Landing";
import AuthCallback from "./pages/AuthCallback";
import Auth from "./pages/Auth";
import EnhancedDemo from "./pages/EnhancedDemo";
import Onboarding from "./pages/Onboarding";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, loading, role } = useAuth();
  useLiveAchievements(); // Enable live achievement checking

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if user needs onboarding (supports both new and legacy flags)
  const onboardingComplete = Boolean(
    user && (
      (user.user_metadata as any)?.onboardingComplete === true ||
      (user.user_metadata as any)?.onboarding_completed === true
    )
  );
  const needsOnboarding = Boolean(user) && !onboardingComplete;
  
  if (needsOnboarding) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  // Admin users - show only admin panel
  if (user && role === 'admin') {
    return (
      <Routes>
        <Route path="/admin" element={<div className="ml-20"><Admin /></div>} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Landing />} />
      <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/dashboard" replace />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      
      {/* Demo route - accessible to everyone */}
      <Route path="/demo" element={<div className="ml-20"><EnhancedDemo /></div>} />
      
      {/* Protected routes - redirect to auth if not authenticated */}
      <Route 
        path="/dashboard" 
        element={user ? <div className="ml-20"><Dashboard /></div> : <Navigate to="/auth" replace />} 
      />
      <Route 
        path="/appliances" 
        element={user ? <div className="ml-20"><Appliances /></div> : <Navigate to="/auth" replace />} 
      />
      <Route 
        path="/analytics" 
        element={user ? <div className="ml-20"><Analytics /></div> : <Navigate to="/auth" replace />} 
      />
      <Route 
        path="/insights" 
        element={user ? <div className="ml-20"><Insights /></div> : <Navigate to="/auth" replace />} 
      />
      <Route 
        path="/settings" 
        element={user ? <div className="ml-20"><Settings /></div> : <Navigate to="/auth" replace />} 
      />
      
      {/* Catch-all route - redirect to auth for unauthenticated, 404 for authenticated */}
      <Route 
        path="*" 
        element={user ? <div className="ml-20"><NotFound /></div> : <Navigate to="/auth" replace />} 
      />
    </Routes>
  );
}
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <SidebarProvider>
            <div className="min-h-screen w-full bg-background">
              <AppSidebar />
              <div className="w-full">
                <AppNavbar />
                <main className="w-full">
                  <AppRoutes />
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