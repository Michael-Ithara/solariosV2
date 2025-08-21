import { 
  Snowflake, 
  Tv, 
  Lightbulb, 
  Microwave, 
  Wind,
  WashingMachine,
  Monitor,
  Plus,
  Search
} from "lucide-react";
import { ApplianceCard } from "@/components/ui/appliance-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Mock appliances data
const appliances = [
  {
    id: 1,
    name: "Air Conditioner",
    icon: <Snowflake className="h-5 w-5" />,
    isOnline: true,
    currentUsage: 3.2,
    unit: "kW",
    status: "high" as const,
    dailyUsage: 18.5,
    trend: 15,
    lastUpdate: "2 mins ago"
  },
  {
    id: 2,
    name: "Smart TV",
    icon: <Tv className="h-5 w-5" />,
    isOnline: true,
    currentUsage: 0.15,
    unit: "kW",
    status: "normal" as const,
    dailyUsage: 2.4,
    trend: -5,
    lastUpdate: "1 min ago"
  },
  {
    id: 3,
    name: "LED Lights",
    icon: <Lightbulb className="h-5 w-5" />,
    isOnline: true,
    currentUsage: 0.08,
    unit: "kW",
    status: "normal" as const,
    dailyUsage: 1.2,
    trend: -8,
    lastUpdate: "30 secs ago"
  },
  {
    id: 4,
    name: "Microwave",
    icon: <Microwave className="h-5 w-5" />,
    isOnline: false,
    currentUsage: 0,
    unit: "kW",
    status: "normal" as const,
    dailyUsage: 0.8,
    trend: 0,
    lastUpdate: "2 hours ago"
  },
  {
    id: 5,
    name: "Ceiling Fan",
    icon: <Wind className="h-5 w-5" />,
    isOnline: true,
    currentUsage: 0.05,
    unit: "kW",
    status: "normal" as const,
    dailyUsage: 1.1,
    trend: -12,
    lastUpdate: "45 secs ago"
  },
  {
    id: 6,
    name: "Washing Machine",
    icon: <WashingMachine className="h-5 w-5" />,
    isOnline: true,
    currentUsage: 2.1,
    unit: "kW",
    status: "anomaly" as const,
    dailyUsage: 4.2,
    trend: 25,
    lastUpdate: "5 mins ago"
  }
];

export default function Appliances() {
  const handleToggleAppliance = (id: number) => {
    console.log(`Toggle appliance ${id}`);
  };

  const handleApplianceSettings = (id: number) => {
    console.log(`Settings for appliance ${id}`);
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Appliances</h1>
          <p className="text-muted-foreground">
            Monitor and control your smart home devices
          </p>
        </div>
        <Button className="bg-gradient-energy text-primary-foreground shadow-energy">
          <Plus className="h-4 w-4 mr-2" />
          Add Appliance
        </Button>
      </div>

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
        {appliances.map((appliance) => (
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
            onSettings={() => handleApplianceSettings(appliance.id)}
          />
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-2xl font-bold text-primary">
            {appliances.filter(a => a.isOnline).length}
          </div>
          <p className="text-sm text-muted-foreground">Online Devices</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-2xl font-bold text-energy-consumption">
            {appliances.reduce((sum, a) => sum + a.currentUsage, 0).toFixed(1)} kW
          </div>
          <p className="text-sm text-muted-foreground">Total Current Usage</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-2xl font-bold text-warning">
            {appliances.filter(a => a.status === "anomaly" || a.status === "high").length}
          </div>
          <p className="text-sm text-muted-foreground">Devices Need Attention</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-2xl font-bold text-success">
            {appliances.reduce((sum, a) => sum + a.dailyUsage, 0).toFixed(1)} kWh
          </div>
          <p className="text-sm text-muted-foreground">Daily Total Usage</p>
        </div>
      </div>
    </div>
  );
}