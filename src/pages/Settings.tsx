import { ProfileSettings } from "@/components/settings/ProfileSettings";

export default function Settings() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <ProfileSettings />
    </div>
  );
}