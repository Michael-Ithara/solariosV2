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
import { GridPricingWidget } from "@/components/widgets/GridPricingWidget";
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
import { useAIInsights } from "@/hooks/useAIInsights";
import { useProfile } from "@/hooks/useProfile";
import { useSmartMeterData } from "@/hooks/useSmartMeterData";
import { useAutoSimulation } from "@/hooks/useAutoSimulation";


export default function Dashboard() {
  const { currency, formatCurrency, convertFromUSD, isLoading: currencyLoading } = useCurrency();
  const { role } = useAuth();
  const location = useLocation();
  const { profile } = useProfile();
  const { graph, isLoading: meterLoading } = useSmartMeterData();
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
  
  // AI insights and recommendations
  const { recommendations, forecast, isLoading: aiLoading, generateInsights } = useAIInsights();
  
  // Auto-start simulation for authenticated users
  useAutoSimulation();
  
  // Determine if this is demo mode
  const isDemoMode = location.pathname === '/demo' || useDemo;
  // Calculate dashboard metrics from real data or real-time metrics
  const calculateMetrics = () => {
    const rate = profile?.electricity_rate ?? 0.12;
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
        monthlySavings: Math.max(0, Math.min(dailySolar, dailyConsumption) * rate * 30),
        trends: {
          power: 12,
          solar: 8,
          grid: -15,
          battery: 5
        }
      };
    }

    // Fallback to static calculation (prefer smart meter facade when available)
    const hasSmartMeter = !!graph.meter && graph.devices.length > 0;
    const currentPower = hasSmartMeter
      ? graph.devices.filter(d => d.status === 'on').reduce((sum, d) => sum + (d.power_rating_w || 0), 0) / 1000
      : appliances.filter(a => a.status === 'on').reduce((sum, a) => sum + (a.power_rating_w || 0), 0) / 1000;
    
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
      monthlySavings: Math.max(0, Math.min(dailySolar, dailyConsumption) * (profile?.electricity_rate ?? 0.12) * 30),
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

  const showNoDevicesPrompt = !isDemoMode && appliances.length === 0;

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

      {/* Notices */}
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
      {showNoDevicesPrompt && (
        <AlertComponent className="border-warning/20 bg-warning/5">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertDescription className="flex items-center justify-between">
            <span>No devices found. Add appliances or re-run onboarding to get started.</span>
            <div className="flex gap-2">
              <a href="/appliances" className="px-3 py-1 text-xs rounded border">Add Appliances</a>
              <a href="/onboarding" className="px-3 py-1 text-xs rounded border">Re-run Onboarding</a>
            </div>
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
              {currencyLoading ? '...' : formatCurrency(dashboardData.currentPower * (profile?.electricity_rate ?? 0.12) * 24)}
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
          <GridPricingWidget />
          
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
                  {currencyLoading ? '...' : formatCurrency(Math.abs(dashboardData.solarProduction - dashboardData.currentPower) * (profile?.electricity_rate ?? 0.12))}
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
                {currencyLoading ? '...' : formatCurrency(dashboardData.dailyConsumption * (profile?.electricity_rate ?? 0.12))}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Monthly Proj.</span>
              <span className="text-lg font-bold">
                {currencyLoading ? '...' : formatCurrency(dashboardData.dailyConsumption * (profile?.electricity_rate ?? 0.12) * 30)}
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
                {aiLoading && (
                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 relative">
              {recommendations.length > 0 ? (
                recommendations.slice(0, 2).map((rec, index) => (
                  <div key={rec.id || index} className={`p-4 rounded-lg border ${
                    rec.priority === 'high' ? 'bg-success/10 border-success/20' :
                    rec.priority === 'medium' ? 'bg-energy-solar/10 border-energy-solar/20' :
                    'bg-primary/10 border-primary/20'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                        rec.priority === 'high' ? 'bg-success/20' :
                        rec.priority === 'medium' ? 'bg-energy-solar/20' :
                        'bg-primary/20'
                      }`}>
                        <DollarSign className={`w-3 h-3 ${
                          rec.priority === 'high' ? 'text-success' :
                          rec.priority === 'medium' ? 'text-energy-solar' :
                          'text-primary'
                        }`} />
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${
                          rec.priority === 'high' ? 'text-success' :
                          rec.priority === 'medium' ? 'text-energy-solar' :
                          'text-primary'
                        }`}>{rec.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {rec.description}
                        </p>
                        {rec.expected_savings_currency > 0 && (
                          <p className="text-xs font-medium mt-1 text-success">
                            Save {currencyLoading ? '...' : formatCurrency(rec.expected_savings_currency)} monthly
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-3">No AI recommendations yet</p>
                  <button
                    onClick={generateInsights}
                    disabled={aiLoading}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {aiLoading ? 'Generating...' : 'Generate AI Insights'}
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Predictive Analytics */}
          <Card className="relative overflow-hidden border-energy-grid/20 bg-gradient-to-br from-energy-grid/10 via-energy-grid/5 to-transparent">
            <div className="absolute inset-0 bg-gradient-to-br from-energy-grid/5 to-transparent" />
            <CardHeader className="relative">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-energy-grid" />
                Monthly Forecast
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 relative">
              {forecast ? (
                <>
                  <div className="p-4 rounded-lg bg-info/10 border border-info/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-info">ONNX Model Prediction</p>
                        <p className="text-xs text-muted-foreground">Next month consumption</p>
                      </div>
                      <span className="text-lg font-bold text-info">
                        {Math.round(forecast.nextMonthConsumption)} kWh
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-background border">
                      <p className="text-xs text-muted-foreground">Predicted Cost</p>
                      <p className="text-lg font-bold">
                        {currencyLoading ? '...' : formatCurrency(forecast.nextMonthCost)}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-background border">
                      <p className="text-xs text-muted-foreground">Solar Generation</p>
                      <p className="text-lg font-bold text-energy-solar">
                        {Math.round(forecast.nextMonthSolar)} kWh
                      </p>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      forecast.confidence === 'high' ? 'bg-success/20 text-success' :
                      forecast.confidence === 'medium' ? 'bg-warning/20 text-warning' :
                      'bg-error/20 text-error'
                    }`}>
                      {forecast.confidence} confidence
                    </span>
                  </div>
                </>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-3">No forecast available</p>
                  <button
                    onClick={generateInsights}
                    disabled={aiLoading}
                    className="px-4 py-2 bg-energy-grid text-white rounded-lg text-sm hover:bg-energy-grid/90 transition-colors disabled:opacity-50"
                  >
                    {aiLoading ? 'Generating...' : 'Generate Forecast'}
                  </button>
                </div>
              )}
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