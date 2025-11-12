import { 
  BarChart3, 
  Calendar, 
  Download,
  TrendingUp,
  TrendingDown,
  Zap,
  Sun,
  Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EnergyChart } from "@/components/charts/EnergyChart";
import { EnergyInsightsSummary } from "@/components/charts/EnergyInsightsSummary";
import { MetricCard } from "@/components/ui/metric-card";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/hooks/useCurrency";
import { useUnifiedEnergyData } from "@/hooks/useUnifiedEnergyData";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type Period = 'daily' | 'weekly' | 'monthly';

export default function Analytics() {
  const { currency, formatCurrency, convertFromUSD } = useCurrency();
  const { energyData, metrics, isLoading } = useUnifiedEnergyData();
  const { user } = useAuth();
  const [totalConsumption, setTotalConsumption] = useState(0);
  const [totalSolar, setTotalSolar] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('daily');
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [essr, setEssr] = useState(0);
  const [solarTotal, setSolarTotal] = useState(0);
  const [gridTotal, setGridTotal] = useState(0);

  // Fetch totals and chart data based on selected period
  useEffect(() => {
    if (!user) {
      setDataLoading(false);
      setChartData([]);
      return;
    }

    const fetchData = async () => {
      setDataLoading(true);
      setChartLoading(true);
      try {
        let fromDate: Date;
        let groupBy: 'hour' | 'day' | 'month';
        if (period === 'daily') {
          fromDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
          groupBy = 'hour';
        } else if (period === 'weekly') {
          fromDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          groupBy = 'day';
        } else {
          fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          groupBy = 'day';
        }

        // Fetch energy logs and solar data
        const [energyRes, solarRes] = await Promise.all([
          supabase
            .from('energy_logs')
            .select('*')
            .eq('user_id', user.id)
            .gte('logged_at', fromDate.toISOString()),
          supabase
            .from('solar_data')
            .select('*')
            .eq('user_id', user.id)
            .gte('logged_at', fromDate.toISOString())
        ]);

        // Aggregate by groupBy
        const energyLogs = energyRes.data || [];
        const solarData = solarRes.data || [];

        // Helper: group by hour or day
        function getGroupKey(dateStr: string) {
          const d = new Date(dateStr);
          if (groupBy === 'hour') {
            return d.getHours().toString().padStart(2, '0') + ':00';
          } else if (groupBy === 'day') {
            return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
          } else {
            return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          }
        }

        // Aggregate energy logs
        const grouped: Record<string, { consumption: number; solar: number; grid: number; count: number; } > = {};
        energyLogs.forEach((log: any) => {
          const key = getGroupKey(log.logged_at);
          if (!grouped[key]) grouped[key] = { consumption: 0, solar: 0, grid: 0, count: 0 };
          grouped[key].consumption += Number(log.consumption_kwh || 0);
          grouped[key].count += 1;
        });
        solarData.forEach((log: any) => {
          const key = getGroupKey(log.logged_at);
          if (!grouped[key]) grouped[key] = { consumption: 0, solar: 0, grid: 0, count: 0 };
          grouped[key].solar += Number(log.generation_kwh || 0);
        });
        // Calculate grid and format for chart
        const chartArr = Object.entries(grouped).map(([time, val]) => {
          const grid = Math.max(0, val.consumption - val.solar);
          return {
            time,
            consumption: Number(val.consumption.toFixed(3)),
            solar: Number(val.solar.toFixed(3)),
            grid: Number(grid.toFixed(3)),
          };
        }).sort((a, b) => a.time.localeCompare(b.time));

  setChartData(chartArr);

  // Totals for metrics
  const totalConsumption = chartArr.reduce((sum, d) => sum + d.consumption, 0);
  const totalSolar = chartArr.reduce((sum, d) => sum + d.solar, 0);
  const totalGrid = chartArr.reduce((sum, d) => sum + d.grid, 0);
  setTotalConsumption(Number(totalConsumption.toFixed(3)));
  setTotalSolar(Number(totalSolar.toFixed(3)));
  setSolarTotal(Number(totalSolar.toFixed(3)));
  setGridTotal(Number(totalGrid.toFixed(3)));
  // Calculate ESSR
  setEssr(totalConsumption > 0 ? Math.round((totalSolar / totalConsumption) * 100) : 0);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        setChartData([]);
      } finally {
        setDataLoading(false);
        setChartLoading(false);
      }
    };

    fetchData();
  }, [user, period]);
  
  // Memoize analyticsData to prevent infinite re-renders
  const analyticsData = useMemo(() => ({
    timeRange: "7d",
    totalConsumption: Number(totalConsumption.toFixed(3)),
    totalProduction: Number(totalSolar.toFixed(3)),
    netExport: Number(Math.max(0, totalSolar - totalConsumption).toFixed(3)),
    efficiency: totalSolar > 0 
      ? Number(((totalSolar / (totalConsumption || 1)) * 100).toFixed(3))
      : 0,
    trends: {
      consumption: Number((-8.2).toFixed(3)),
      production: Number((12.5).toFixed(3)),
      efficiency: Number((3.1).toFixed(3))
    },
    peakHours: {
      consumption: "18:00 - 20:00",
      production: "12:00 - 14:00"
    },
    insights: [
      {
        type: "positive" as const,
        title: "Excellent Solar Performance",
        description: "Your solar panels generated energy efficiently"
      },
      {
        type: "warning" as const, 
        title: "Evening Usage Spike",
        description: "Energy consumption peaks at 6 PM - consider shifting some usage to midday"
      },
      {
        type: "info" as const,
        title: "Grid Export Opportunity", 
        description: `You exported ${Number(Math.max(0, totalSolar - totalConsumption).toFixed(3))} kWh to the grid`
      }
    ]
  }), [totalConsumption, totalSolar]);

  const weeklyExportEarnings = useMemo(() => Number(convertFromUSD(12.90).toFixed(3)), [convertFromUSD]);
  
  if (isLoading || dataLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <LoadingSpinner />
      </div>
    );
  }
  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Energy Analytics</h1>
          <p className="text-muted-foreground">
            Detailed insights into your energy patterns and performance
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={val => setPeriod(val as Period)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Consumption"
          value={analyticsData.totalConsumption}
          unit="kWh"
          icon={<Zap />}
          variant="consumption"
          trend={{
            value: analyticsData.trends.consumption,
            label: "vs last period"
          }}
        />
        <MetricCard
          title="Solar Production"
          value={analyticsData.totalProduction}
          unit="kWh"
          icon={<Sun />}
          variant="solar"
          trend={{
            value: analyticsData.trends.production,
            label: "vs last period"
          }}
        />
        <MetricCard
          title="Net Grid Export"
          value={analyticsData.netExport}
          unit="kWh"
          icon={<Activity />}
          variant="grid"
        />
        <MetricCard
          title="System Efficiency"
          value={analyticsData.efficiency}
          unit="%"
          icon={<TrendingUp />}
          trend={{
            value: analyticsData.trends.efficiency,
            label: "improvement"
          }}
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Energy Flow Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <div className="flex items-center justify-center h-[300px]">Loading data…</div>
            ) : (
              <EnergyChart type="line" height={300} simulationData={chartData} />
            )}
          </CardContent>
        </Card>

        {/* Energy Insights Summary (Donut Chart) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Energy Insights Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <div className="flex items-center justify-center h-[300px]">Loading data…</div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] relative">
                <EnergyInsightsSummary
                  solar={solarTotal}
                  grid={gridTotal}
                  essr={essr}
                  periodLabel={period === 'daily' ? 'Today' : period === 'weekly' ? 'This Week' : 'This Month'}
                />
                <div className="mt-4 text-center text-muted-foreground text-xs">
                  <span className="font-semibold text-green-600">{essr}%</span> of your energy needs were met by solar ({solarTotal} kWh solar, {gridTotal} kWh grid)
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Insights and Peak Hours */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Insights */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Energy Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {analyticsData.insights.map((insight, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-4 rounded-lg border"
                >
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    insight.type === 'positive' ? 'bg-success' :
                    insight.type === 'warning' ? 'bg-warning' : 'bg-primary'
                  }`} />
                  <div className="flex-1">
                    <h4 className="font-medium">{insight.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {insight.description}
                      {insight.title === "Grid Export Opportunity" && 
                        `, earning ${formatCurrency(weeklyExportEarnings)}`
                      }
                    </p>
                  </div>
                  <Badge variant="outline" className={
                    insight.type === 'positive' ? 'border-success/20 text-success' :
                    insight.type === 'warning' ? 'border-warning/20 text-warning' : 
                    'border-primary/20 text-primary'
                  }>
                    {insight.type}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Peak Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Peak Hours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-energy-consumption" />
                <span className="text-sm font-medium">Peak Consumption</span>
              </div>
              <div className="text-2xl font-bold">{analyticsData.peakHours.consumption}</div>
              <p className="text-xs text-muted-foreground">Highest energy usage window</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sun className="h-4 w-4 text-energy-solar" />
                <span className="text-sm font-medium">Peak Production</span>
              </div>
              <div className="text-2xl font-bold">{analyticsData.peakHours.production}</div>
              <p className="text-xs text-muted-foreground">Highest solar generation window</p>
            </div>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">Optimization Tip</h4>
              <p className="text-xs text-muted-foreground">
                Shift energy-intensive activities to {analyticsData.peakHours.production} to maximize solar usage and reduce grid dependence.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}