import { 
  Snowflake, 
  Tv, 
  Lightbulb, 
  Microwave, 
  Wind,
  WashingMachine,
  Monitor,
  Plus,
  Search,
  Zap
} from "lucide-react";
import { ApplianceCard } from "@/components/ui/appliance-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useLocation } from "react-router-dom";

// Icon mapping for appliances
const getApplianceIcon = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('air') || lowerName.includes('hvac')) return <Snowflake className="h-5 w-5" />;
  if (lowerName.includes('tv') || lowerName.includes('television')) return <Tv className="h-5 w-5" />;
  if (lowerName.includes('light') || lowerName.includes('lamp')) return <Lightbulb className="h-5 w-5" />;
  if (lowerName.includes('microwave') || lowerName.includes('oven')) return <Microwave className="h-5 w-5" />;
  if (lowerName.includes('fan') || lowerName.includes('ventilation')) return <Wind className="h-5 w-5" />;
  if (lowerName.includes('wash') || lowerName.includes('laundry')) return <WashingMachine className="h-5 w-5" />;
  if (lowerName.includes('computer') || lowerName.includes('pc')) return <Monitor className="h-5 w-5" />;
  return <Zap className="h-5 w-5" />;
};

export default function Appliances() {
  const { role } = useAuth();
  const location = useLocation();
  const { 
    appliances, 
    loading, 
    error, 
    useDemo, 
    toggleAppliance, 
    addAppliance 
  } = useSupabaseData();
  
  // Determine if this is demo mode
  const isDemoMode = location.pathname === '/demo' || useDemo;
  
  const [newApplianceName, setNewApplianceName] = useState('');
  const [newAppliancePower, setNewAppliancePower] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const handleToggleAppliance = (id: string) => {
    toggleAppliance(id);
  };

  const handleApplianceSettings = (id: string) => {
    console.log(`Settings for appliance ${id}`);
  };

  const handleAddAppliance = async () => {
    if (!newApplianceName.trim()) return;
    
    await addAppliance(newApplianceName, parseInt(newAppliancePower) || 0);
    setNewApplianceName('');
    setNewAppliancePower('');
    setIsAddDialogOpen(false);
  };

  // Transform appliance data for display
  const transformedAppliances = appliances.map(appliance => ({
    id: appliance.id,
    name: appliance.name,
    icon: getApplianceIcon(appliance.name),
    isOnline: appliance.status === 'on',
    currentUsage: appliance.status === 'on' ? (appliance.power_rating_w || 0) / 1000 : 0,
    unit: "kW",
    status: appliance.status === 'on' && (appliance.power_rating_w || 0) > 2000 ? "high" as const : "normal" as const,
    dailyUsage: appliance.total_kwh || 0,
    trend: Math.floor(Math.random() * 20) - 10, // Mock trend for now
    lastUpdate: new Date(appliance.created_at).toLocaleString()
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Appliances
            {isDemoMode && (
              <Badge variant="outline" className="ml-3 text-xs">
                Demo Mode
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground">
            Monitor and control your smart home devices
          </p>
        </div>
        {!isDemoMode && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-energy text-primary-foreground shadow-energy">
              <Plus className="h-4 w-4 mr-2" />
              Add Appliance
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Appliance</DialogTitle>
              <DialogDescription>
                Add a new appliance to monitor its energy consumption.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="appliance-name">Appliance Name</Label>
                <Input
                  id="appliance-name"
                  placeholder="e.g., Living Room TV"
                  value={newApplianceName}
                  onChange={(e) => setNewApplianceName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="power-rating">Power Rating (Watts)</Label>
                <Input
                  id="power-rating"
                  type="number"
                  placeholder="e.g., 150"
                  value={newAppliancePower}
                  onChange={(e) => setNewAppliancePower(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddAppliance}>
                Add Appliance
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* Demo Mode Notice */}
      {isDemoMode && (
        <Alert className="border-primary/20 bg-primary/5">
          <AlertTriangle className="h-4 w-4 text-primary" />
          <AlertDescription>
            {location.pathname === '/demo' 
              ? "You're viewing demo appliances. This showcases smart home device monitoring capabilities."
              : "You're viewing demo appliances. Sign in to add and control your real smart home devices."
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search appliances..."
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High Usage</SelectItem>
              <SelectItem value="anomaly">Anomaly</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="online">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
              <SelectItem value="all">All Devices</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Appliances Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {transformedAppliances.map((appliance) => (
          <ApplianceCard
            key={appliance.id}
            name={appliance.name}
            icon={appliance.icon}
            isOnline={appliance.isOnline}
            currentUsage={appliance.currentUsage}
            unit={appliance.unit}
            status={appliance.status}
            dailyUsage={appliance.dailyUsage}
            trend={appliance.trend}
            lastUpdate={appliance.lastUpdate}
            onToggle={() => handleToggleAppliance(appliance.id)}
            onSettings={!isDemoMode ? () => handleApplianceSettings(appliance.id) : undefined}
          />
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-2xl font-bold text-primary">
            {transformedAppliances.filter(a => a.isOnline).length}
          </div>
          <p className="text-sm text-muted-foreground">Online Devices</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-2xl font-bold text-energy-consumption">
            {transformedAppliances.reduce((sum, a) => sum + a.currentUsage, 0).toFixed(1)} kW
          </div>
          <p className="text-sm text-muted-foreground">Total Current Usage</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-2xl font-bold text-warning">
            {transformedAppliances.filter(a => a.status === "high" || a.status === "normal").length}
          </div>
          <p className="text-sm text-muted-foreground">Devices Need Attention</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-2xl font-bold text-success">
            {transformedAppliances.reduce((sum, a) => sum + a.dailyUsage, 0).toFixed(1)} kWh
          </div>
          <p className="text-sm text-muted-foreground">Daily Total Usage</p>
        </div>
      </div>
    </div>
  );
}