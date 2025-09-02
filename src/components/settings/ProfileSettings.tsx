import { useState, useEffect } from 'react';
import { useProfile, UserProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { User, Settings, Zap, Bell } from 'lucide-react';

export function ProfileSettings() {
  const { profile, isLoading, updateProfile } = useProfile();
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Update form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  if (isLoading) {
    return <div className="animate-pulse">Loading profile...</div>;
  }

  if (!profile) {
    return <div>No profile found</div>;
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile(formData);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Update your personal information and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                value={formData.display_name || ''}
                onChange={(e) => handleInputChange('display_name', e.target.value)}
                placeholder="Your display name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatar_url">Avatar URL</Label>
              <Input
                id="avatar_url"
                value={formData.avatar_url || ''}
                onChange={(e) => handleInputChange('avatar_url', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio || ''}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Tell us about yourself..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Energy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Energy Settings
          </CardTitle>
          <CardDescription>
            Configure your home energy setup for accurate simulations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select 
                value={formData.currency || 'USD'} 
                onValueChange={(value) => handleInputChange('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="CAD">CAD (C$)</SelectItem>
                  <SelectItem value="AUD">AUD (A$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="electricity_rate">Electricity Rate (per kWh)</Label>
              <Input
                id="electricity_rate"
                type="number"
                step="0.01"
                value={formData.electricity_rate || 0.12}
                onChange={(e) => handleInputChange('electricity_rate', parseFloat(e.target.value))}
                placeholder="0.12"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="solar_panel_capacity">Solar Panel Capacity (kW)</Label>
              <Input
                id="solar_panel_capacity"
                type="number"
                step="0.1"
                value={formData.solar_panel_capacity || 0}
                onChange={(e) => handleInputChange('solar_panel_capacity', parseFloat(e.target.value))}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="battery_capacity">Battery Capacity (kWh)</Label>
              <Input
                id="battery_capacity"
                type="number"
                step="0.1"
                value={formData.battery_capacity || 0}
                onChange={(e) => handleInputChange('battery_capacity', parseFloat(e.target.value))}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="home_size_sqft">Home Size (sq ft)</Label>
              <Input
                id="home_size_sqft"
                type="number"
                value={formData.home_size_sqft || ''}
                onChange={(e) => handleInputChange('home_size_sqft', parseInt(e.target.value))}
                placeholder="2000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="occupants">Number of Occupants</Label>
              <Input
                id="occupants"
                type="number"
                value={formData.occupants || 1}
                onChange={(e) => handleInputChange('occupants', parseInt(e.target.value))}
                placeholder="1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Choose how you want to be notified about energy events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notifications_enabled">Enable Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive notifications about energy events</p>
            </div>
            <Switch
              id="notifications_enabled"
              checked={formData.notifications_enabled || false}
              onCheckedChange={(checked) => handleInputChange('notifications_enabled', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email_notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive email alerts</p>
            </div>
            <Switch
              id="email_notifications"
              checked={formData.email_notifications || false}
              onCheckedChange={(checked) => handleInputChange('email_notifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="push_notifications">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
            </div>
            <Switch
              id="push_notifications"
              checked={formData.push_notifications || false}
              onCheckedChange={(checked) => handleInputChange('push_notifications', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* App Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            App Settings
          </CardTitle>
          <CardDescription>
            Customize your app experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Select 
              value={formData.theme || 'system'} 
              onValueChange={(value) => handleInputChange('theme', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dashboard_layout">Dashboard Layout</Label>
            <Select 
              value={formData.dashboard_layout || 'default'} 
              onValueChange={(value) => handleInputChange('dashboard_layout', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="compact">Compact</SelectItem>
                <SelectItem value="detailed">Detailed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}