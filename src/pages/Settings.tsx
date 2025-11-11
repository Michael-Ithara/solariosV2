import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { HistoricalDataBackfill } from "@/components/admin/HistoricalDataBackfill";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ErrorBanner } from "@/components/ui/error-banner";

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResetOnboarding = async () => {
    if (!user || resetting) return;
    setError(null);
    setResetting(true);
    try {
      const { error: metaErr } = await supabase.auth.updateUser({
        data: { onboardingComplete: false, onboarding_version: null, onboarding_state: null }
      });
      if (metaErr) throw metaErr;

      await refreshUser();
      window.location.href = '/onboarding';
    } catch (e: any) {
      console.error('Failed to reset onboarding:', e);
      setError(e?.message || 'Failed to reset onboarding');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {error && <ErrorBanner message={error} />}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="data">Data Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-6 mt-6">
          <ProfileSettings />

          <div className="flex items-center justify-between p-4 rounded-md border bg-muted/30">
            <div>
              <div className="font-medium">Reset Onboarding</div>
              <div className="text-sm text-muted-foreground">Clear your onboarding progress and start over</div>
            </div>
            <Button onClick={handleResetOnboarding} disabled={resetting} variant="outline">
              {resetting ? 'Resetting...' : 'Reset Onboarding'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="data" className="mt-6">
          <HistoricalDataBackfill />
        </TabsContent>
      </Tabs>
    </div>
  );
}