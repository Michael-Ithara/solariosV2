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
import { useCurrency } from "@/hooks/useCurrency";
import { GamificationPanel } from "@/components/gamification/GamificationPanel";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { useRealTimeEnergyData } from "@/hooks/useRealTimeEnergyData";


export default function Dashboard() {
  const { currency, formatCurrency, convertFromUSD, isLoading: currencyLoading } = useCurrency();
  const { role } = useAuth();
  const location = useLocation();
  const { 
    appliances, 
    energyLogs, 
    solarData, 
    alerts, 
    userPoints, 
    loading, 
    error, 
    useDemo 
  } = useSupabaseData();
  
  // Real-time energy data for charts and live metrics
  const { energyData, metrics, isLoading: realtimeLoading } = useRealTimeEnergyData();
  
  // Determine if this is demo mode
  const isDemoMode = location.pathname === '/demo' || useDemo;
  // Calculate dashboard metrics from real data or real-time metrics
  const calculateMetrics = () => {
    // Use real-time metrics if available and not in demo mode
    if (!isDemoMode && !realtimeLoading && metrics.lastUpdate) {
      const dailyConsumption = energyLogs
        .filter(log => {
          const logDate = new Date(log.logged_at);
          const today = new Date();
          return logDate.toDateString() === today.toDateString();
        })
        .reduce((sum, log) => sum + log.consumption_kwh, 0);
      
      const dailySolar = solarData
        .filter(data => {
          const dataDate = new Date(data.logged_at);
          const today = new Date();
          return dataDate.toDateString() === today.toDateString();
        })
        .reduce((sum, data) => sum + data.generation_kwh, 0);

      return {
        currentPower: metrics.currentUsage,
        solarProduction: metrics.solarProduction,
        gridUsage: metrics.gridUsage,
        batteryLevel: metrics.batteryLevel,
        dailyConsumption,
        dailySolar,
        monthlySavings: convertFromUSD(156), // Mock for now
        trends: {
          power: 12,
          solar: 8,
          grid: -15,
          battery: 5
        }
      };
    }

    // Fallback to static calculation
    const currentPower = appliances
      .filter(a => a.status === 'on')
      .reduce((sum, a) => sum + (a.power_rating_w || 0), 0) / 1000; // Convert to kW
    
    const recentSolar = solarData.slice(0, 1)[0];
    const solarProduction = recentSolar ? recentSolar.generation_kwh : 0;
    
    const dailyConsumption = energyLogs
      .filter(log => {
        const logDate = new Date(log.logged_at);
        const today = new Date();
        return logDate.toDateString() === today.toDateString();
      })
      .reduce((sum, log) => sum + log.consumption_kwh, 0);
    
    const dailySolar = solarData
      .filter(data => {
        const dataDate = new Date(data.logged_at);
        const today = new Date();
        return dataDate.toDateString() === today.toDateString();
      })
      .reduce((sum, data) => sum + data.generation_kwh, 0);
    
    return {
      currentPower,
      solarProduction,
      gridUsage: Math.max(0, currentPower - solarProduction),
      batteryLevel: 85, // Mock for now
      dailyConsumption,
      dailySolar,
      monthlySavings: convertFromUSD(156), // Mock for now
      trends: {
        power: 12,
        solar: 8,
        grid: -15,
        battery: 5
      }
    };
  };
  
  const dashboardData = calculateMetrics();

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
      <div>
        <h1 className="text-3xl font-bold">
          Energy Dashboard
          {isDemoMode && (
            <Badge variant="outline" className="ml-3 text-xs">
              Demo Mode
            </Badge>
          )}
        </h1>
        <p className="text-muted-foreground">
          Monitor your energy consumption and production in real-time
        </p>
      </div>

      {/* Demo Mode Notice */}
      {isDemoMode && (
        <AlertComponent className="border-primary/20 bg-primary/5">
          <AlertTriangle className="h-4 w-4 text-primary" />
          <AlertDescription>
            {location.pathname === '/demo' 
              ? "You're viewing demo data. This showcases the app's capabilities with sample energy monitoring data."
              : "You're viewing demo data. Sign in to connect your real energy monitoring devices and track your actual usage."
            }
          </AlertDescription>
        </AlertComponent>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <AlertComponent 
              key={alert.id} 
              className={`${
                alert.severity === 'critical' ? 'border-danger/20 bg-danger/5' :
                alert.severity === 'warning' ? 'border-warning/20 bg-warning/5' :
                'border-primary/20 bg-primary/5'
              }`}
            >
              <AlertTriangle className={`h-4 w-4 ${
                alert.severity === 'critical' ? 'text-danger' :
                alert.severity === 'warning' ? 'text-warning' :
                'text-primary'
              }`} />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <strong>{alert.title}</strong>
                    <div className="text-sm text-muted-foreground">{alert.message}</div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(alert.created_at).toLocaleTimeString()}
                  </span>
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
              <EnergyChart 
                height={350}
                simulationData={!isDemoMode && energyData.length > 0 ? energyData : undefined}
              />
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
            <div className="text-2xl font-bold">
              {currencyLoading ? '...' : formatCurrency(dashboardData.monthlySavings)}
            </div>
            <p className="text-xs text-muted-foreground">
              Compared to grid-only usage
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick AI Insights Preview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">AI Insights Preview</h2>
          <Card className="px-3 py-1 bg-primary/10 border-primary/20">
            <span className="text-xs font-medium text-primary">
              Visit Insights page for full analysis
            </span>
          </Card>
        </div>
        <Card className="p-6 text-center bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
          <Lightbulb className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Personalized Energy Recommendations</h3>
          <p className="text-muted-foreground mb-4">
            Get AI-powered insights about your energy usage patterns and personalized recommendations to optimize efficiency and reduce costs.
          </p>
          <div className="flex gap-2 justify-center">
            <Card className="px-3 py-2 bg-background border">
              <span className="text-xs font-medium">Smart Analysis</span>
            </Card>
            <Card className="px-3 py-2 bg-background border">
              <span className="text-xs font-medium">Cost Savings</span>
            </Card>
            <Card className="px-3 py-2 bg-background border">
              <span className="text-xs font-medium">Usage Patterns</span>
            </Card>
          </div>
        </Card>
      </div>

      {/* Gamification Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Achievements & Progress</h2>
        <GamificationPanel />
      </div>
    </div>
  );
}