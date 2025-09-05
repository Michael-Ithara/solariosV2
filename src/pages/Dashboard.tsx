import { 
  Zap, 
  Sun, 
  Battery, 
  Home, 
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Activity,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Target,
  Calendar,
  Clock
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
    <div className="flex-1 space-y-8 p-6 bg-gradient-to-br from-background via-background to-muted/20">
      {/* Professional Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-energy flex items-center justify-center shadow-energy">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Energy Dashboard
                {isDemoMode && (
                  <Badge variant="outline" className="ml-3 text-xs">
                    Demo Mode
                  </Badge>
                )}
              </h1>
              <p className="text-muted-foreground">
                Real-time monitoring & intelligent insights
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Card className="px-4 py-2 bg-primary/10 border-primary/20">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">Live</span>
            </div>
          </Card>
          <Card className="px-4 py-2">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{new Date().toLocaleTimeString()}</span>
            </div>
          </Card>
        </div>
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

      {/* Financial Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Today's Cost */}
        <Card className="relative overflow-hidden border-energy-consumption/20 bg-gradient-to-br from-energy-consumption/10 via-energy-consumption/5 to-transparent">
          <div className="absolute inset-0 bg-gradient-to-br from-energy-consumption/5 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-foreground">Today's Cost</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-energy-consumption/20 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-energy-consumption" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-energy-consumption">
              {currencyLoading ? '...' : formatCurrency(dashboardData.currentPower * 0.12 * 24)}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3 h-3 text-energy-consumption" />
              <span className="text-xs text-energy-consumption font-medium">12% vs yesterday</span>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Savings */}
        <Card className="relative overflow-hidden border-success/20 bg-gradient-to-br from-success/10 via-success/5 to-transparent">
          <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-foreground">Monthly Savings</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center">
              <Target className="h-4 w-4 text-success" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-success">
              {currencyLoading ? '...' : formatCurrency(dashboardData.monthlySavings)}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <ArrowDownRight className="w-3 h-3 text-success" />
              <span className="text-xs text-success font-medium">vs grid-only</span>
            </div>
          </CardContent>
        </Card>

        {/* Energy Efficiency */}
        <Card className="relative overflow-hidden border-energy-solar/20 bg-gradient-to-br from-energy-solar/10 via-energy-solar/5 to-transparent">
          <div className="absolute inset-0 bg-gradient-to-br from-energy-solar/5 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-foreground">Solar Efficiency</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-energy-solar/20 flex items-center justify-center">
              <Sun className="h-4 w-4 text-energy-solar" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-energy-solar">
              {((dashboardData.solarProduction / (dashboardData.currentPower || 1)) * 100).toFixed(0)}%
            </div>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3 h-3 text-energy-solar" />
              <span className="text-xs text-energy-solar font-medium">{dashboardData.solarProduction.toFixed(1)}kW producing</span>
            </div>
          </CardContent>
        </Card>

        {/* Grid Independence */}
        <Card className="relative overflow-hidden border-energy-grid/20 bg-gradient-to-br from-energy-grid/10 via-energy-grid/5 to-transparent">
          <div className="absolute inset-0 bg-gradient-to-br from-energy-grid/5 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-foreground">Grid Independence</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-energy-grid/20 flex items-center justify-center">
              <Activity className="h-4 w-4 text-energy-grid" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-energy-grid">
              {(100 - (dashboardData.gridUsage / (dashboardData.currentPower || 1)) * 100).toFixed(0)}%
            </div>
            <div className="flex items-center gap-1 mt-1">
              {dashboardData.gridUsage > 0 ? (
                <ArrowUpRight className="w-3 h-3 text-energy-grid" />
              ) : (
                <Minus className="w-3 h-3 text-energy-grid" />
              )}
              <span className="text-xs text-energy-grid font-medium">
                {dashboardData.gridUsage > 0 ? `${dashboardData.gridUsage.toFixed(1)}kW from grid` : 'Off-grid mode'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-Time Energy Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Current Usage"
          value={dashboardData.currentPower}
          unit="kW"
          icon={<Zap />}
          variant="consumption"
          className="relative overflow-hidden border-energy-consumption/20 bg-gradient-to-br from-energy-consumption/10 via-energy-consumption/5 to-transparent"
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
          className="relative overflow-hidden border-energy-solar/20 bg-gradient-to-br from-energy-solar/10 via-energy-solar/5 to-transparent"
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
          className="relative overflow-hidden border-energy-grid/20 bg-gradient-to-br from-energy-grid/10 via-energy-grid/5 to-transparent"
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
          variant="default"
          className="relative overflow-hidden border-success/20 bg-gradient-to-br from-success/10 via-success/5 to-transparent"
          trend={{
            value: dashboardData.trends.battery,
            label: "charging"
          }}
        />
      </div>

      {/* Advanced Analytics Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Energy Trends Chart - Takes 2 columns */}
        <div className="lg:col-span-2">
          <Card className="border-primary/10 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-energy flex items-center justify-center shadow-energy">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Energy Flow Analytics</CardTitle>
                    <p className="text-sm text-muted-foreground">Real-time consumption vs. production trends</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Calendar className="w-3 h-3 mr-1" />
                    24H
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-primary/10 border-primary/20 text-primary">
                    Live
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <EnergyChart 
                height={400}
                simulationData={!isDemoMode && energyData.length > 0 ? energyData : undefined}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar with Weather & Quick Stats */}
        <div className="space-y-6">
          <WeatherWidget />
          
          {/* Quick Performance Stats */}
          <Card className="border-muted/40">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Performance Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-energy-solar/10 border border-energy-solar/20">
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-energy-solar" />
                  <span className="text-sm font-medium">Solar Peak</span>
                </div>
                <span className="text-sm font-bold text-energy-solar">{Math.max(dashboardData.solarProduction, 4.2).toFixed(1)}kW</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-energy-consumption/10 border border-energy-consumption/20">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-energy-consumption" />
                  <span className="text-sm font-medium">Peak Usage</span>
                </div>
                <span className="text-sm font-bold text-energy-consumption">{Math.max(dashboardData.currentPower, 3.8).toFixed(1)}kW</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-success/10 border border-success/20">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium">Cost Saved</span>
                </div>
                <span className="text-sm font-bold text-success">
                  {currencyLoading ? '...' : formatCurrency(Math.abs(dashboardData.solarProduction - dashboardData.currentPower) * 0.12)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enhanced Daily Summary with Financial Focus */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Daily Energy Stats */}
        <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative">
            <div>
              <CardTitle className="text-lg font-semibold">Daily Energy</CardTitle>
              <p className="text-sm text-muted-foreground">Consumption & Production</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-energy flex items-center justify-center shadow-energy">
              <Home className="h-6 w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 relative">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Consumed</span>
              <span className="text-lg font-bold text-energy-consumption">{dashboardData.dailyConsumption.toFixed(1)} kWh</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Generated</span>
              <span className="text-lg font-bold text-energy-solar">{dashboardData.dailySolar.toFixed(1)} kWh</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-primary/20">
              <span className="text-sm font-medium">Net Balance</span>
              <span className={`text-lg font-bold ${
                dashboardData.dailySolar >= dashboardData.dailyConsumption ? 'text-success' : 'text-energy-consumption'
              }`}>
                {dashboardData.dailySolar >= dashboardData.dailyConsumption ? '+' : ''}
                {(dashboardData.dailySolar - dashboardData.dailyConsumption).toFixed(1)} kWh
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Cost Analysis */}
        <Card className="relative overflow-hidden border-energy-consumption/20 bg-gradient-to-br from-energy-consumption/10 via-energy-consumption/5 to-transparent">
          <div className="absolute inset-0 bg-gradient-to-br from-energy-consumption/5 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative">
            <div>
              <CardTitle className="text-lg font-semibold">Cost Analysis</CardTitle>
              <p className="text-sm text-muted-foreground">Daily & Monthly Projections</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-energy-consumption/20 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-energy-consumption" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 relative">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Today's Cost</span>
              <span className="text-lg font-bold text-energy-consumption">
                {currencyLoading ? '...' : formatCurrency(dashboardData.dailyConsumption * 0.12)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Monthly Proj.</span>
              <span className="text-lg font-bold">
                {currencyLoading ? '...' : formatCurrency(dashboardData.dailyConsumption * 0.12 * 30)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-energy-consumption/20">
              <span className="text-sm font-medium">Monthly Savings</span>
              <span className="text-lg font-bold text-success">
                {currencyLoading ? '...' : formatCurrency(dashboardData.monthlySavings)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Efficiency Metrics */}
        <Card className="relative overflow-hidden border-success/20 bg-gradient-to-br from-success/10 via-success/5 to-transparent">
          <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative">
            <div>
              <CardTitle className="text-lg font-semibold">Efficiency Score</CardTitle>
              <p className="text-sm text-muted-foreground">System Performance</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
              <Target className="h-6 w-6 text-success" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 relative">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Self-Sufficiency</span>
              <span className="text-lg font-bold text-success">
                {Math.min(100, (dashboardData.solarProduction / (dashboardData.currentPower || 1)) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Solar Utilization</span>
              <span className="text-lg font-bold text-energy-solar">92%</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-success/20">
              <span className="text-sm font-medium">Overall Rating</span>
              <div className="flex items-center gap-1">
                <span className="text-lg font-bold text-success">A+</span>
                <Badge variant="outline" className="text-xs bg-success/10 border-success/20 text-success">Excellent</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI-Powered Insights Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-glow">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">AI Energy Intelligence</h2>
              <p className="text-sm text-muted-foreground">Machine learning insights & predictions</p>
            </div>
          </div>
          <Card className="px-4 py-2 bg-primary/10 border-primary/20 hover:bg-primary/15 transition-colors cursor-pointer">
            <span className="text-sm font-medium text-primary">
              View Full Analysis →
            </span>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Smart Recommendations */}
          <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
            <CardHeader className="relative">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Smart Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 relative">
              <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center mt-0.5">
                    <DollarSign className="w-3 h-3 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-success">Optimal Battery Charging</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Save {currencyLoading ? '...' : formatCurrency(24)} monthly by charging during off-peak hours
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-energy-solar/10 border border-energy-solar/20">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-energy-solar/20 flex items-center justify-center mt-0.5">
                    <Sun className="w-3 h-3 text-energy-solar" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-energy-solar">Peak Solar Utilization</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Run high-energy appliances between 11 AM - 2 PM for maximum solar efficiency
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Predictive Analytics */}
          <Card className="relative overflow-hidden border-energy-grid/20 bg-gradient-to-br from-energy-grid/10 via-energy-grid/5 to-transparent">
            <div className="absolute inset-0 bg-gradient-to-br from-energy-grid/5 to-transparent" />
            <CardHeader className="relative">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-energy-grid" />
                7-Day Forecast
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 relative">
              <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-warning">High Demand Alert</p>
                    <p className="text-xs text-muted-foreground">Tomorrow 6-8 PM</p>
                  </div>
                  <span className="text-lg font-bold text-warning">+23%</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-background border">
                  <p className="text-xs text-muted-foreground">Weekly Cost</p>
                  <p className="text-lg font-bold">
                    {currencyLoading ? '...' : formatCurrency(dashboardData.dailyConsumption * 0.12 * 7)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-background border">
                  <p className="text-xs text-muted-foreground">Potential Savings</p>
                  <p className="text-lg font-bold text-success">
                    {currencyLoading ? '...' : formatCurrency(12.50)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Gamification Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Achievements & Progress</h2>
        <GamificationPanel />
      </div>
    </div>
  );
}