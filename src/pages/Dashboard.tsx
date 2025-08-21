import { 
  Zap, 
  Sun, 
  Battery, 
  Home, 
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Activity
} from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import { WeatherWidget } from "@/components/widgets/WeatherWidget";
import { EnergyChart } from "@/components/charts/EnergyChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert as AlertComponent, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

// Mock data
const dashboardData = {
  currentPower: 4.2,
  solarProduction: 6.8,
  gridUsage: 0,
  batteryLevel: 85,
  dailyConsumption: 24.6,
  dailySolar: 42.3,
  monthlySavings: 156,
  trends: {
    power: 12,
    solar: 8,
    grid: -15,
    battery: 5
  }
};

const alerts = [
  {
    id: 1,
    type: "warning",
    title: "High Energy Usage Detected",
    description: "Air conditioner is consuming 40% more than usual",
    time: "2 mins ago"
  },
  {
    id: 2,
    type: "info", 
    title: "Solar Production Peak",
    description: "Your solar panels are producing at 95% capacity",
    time: "15 mins ago"
  }
];

export default function Dashboard() {
  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Energy Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor your energy consumption and production in real-time
        </p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <AlertComponent key={alert.id} className="border-warning/20 bg-warning/5">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <strong>{alert.title}</strong>
                    <div className="text-sm text-muted-foreground">{alert.description}</div>
                  </div>
                  <span className="text-xs text-muted-foreground">{alert.time}</span>
                </div>
              </AlertDescription>
            </AlertComponent>
          ))}
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Current Usage"
          value={dashboardData.currentPower}
          unit="kW"
          icon={<Zap />}
          variant="consumption"
          trend={{
            value: dashboardData.trends.power,
            label: "vs last hour"
          }}
        />
        <MetricCard
          title="Solar Production"
          value={dashboardData.solarProduction}
          unit="kW"
          icon={<Sun />}
          variant="solar"
          trend={{
            value: dashboardData.trends.solar,
            label: "vs yesterday"
          }}
        />
        <MetricCard
          title="Grid Usage"
          value={dashboardData.gridUsage}
          unit="kW"
          icon={<Activity />}
          variant="grid"
          trend={{
            value: dashboardData.trends.grid,
            label: "vs last week"
          }}
        />
        <MetricCard
          title="Battery Level"
          value={dashboardData.batteryLevel}
          unit="%"
          icon={<Battery />}
          trend={{
            value: dashboardData.trends.battery,
            label: "charging"
          }}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Energy Chart - Takes 2 columns */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Today's Energy Flow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EnergyChart height={350} />
            </CardContent>
          </Card>
        </div>

        {/* Weather Widget */}
        <div>
          <WeatherWidget />
        </div>
      </div>

      {/* Daily Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-energy-consumption/20 bg-gradient-to-br from-energy-consumption/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Consumption</CardTitle>
            <Home className="h-4 w-4 text-energy-consumption" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.dailyConsumption} kWh</div>
            <p className="text-xs text-muted-foreground">
              Today's total energy usage
            </p>
          </CardContent>
        </Card>

        <Card className="border-energy-solar/20 bg-gradient-to-br from-energy-solar/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solar Generated</CardTitle>
            <Sun className="h-4 w-4 text-energy-solar" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.dailySolar} kWh</div>
            <p className="text-xs text-muted-foreground">
              Today's solar production
            </p>
          </CardContent>
        </Card>

        <Card className="border-success/20 bg-gradient-to-br from-success/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Savings</CardTitle>
            <Lightbulb className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${dashboardData.monthlySavings}</div>
            <p className="text-xs text-muted-foreground">
              Compared to grid-only usage
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}