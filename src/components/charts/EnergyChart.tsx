import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface EnergyChartProps {
  type?: 'line' | 'area';
  height?: number;
  simulationData?: any[];
}

export function EnergyChart({ type = 'line', height = 300, simulationData }: EnergyChartProps) {
  const [realTimeData, setRealTimeData] = useState<any[]>([]);
  const location = useLocation();
  const { user } = useAuth();
  
  // Determine if we're in demo/simulation mode
  const isSimulationMode = location.pathname === '/demo' || location.pathname.includes('enhanced-demo');
  
  // Mock data for fallback
  const mockData = [
    { time: '00:00', solar: 0, grid: 2.1, consumption: 2.1 },
    { time: '06:00', solar: 0.5, grid: 3.2, consumption: 3.7 },
    { time: '09:00', solar: 4.2, grid: 1.8, consumption: 6.0 },
    { time: '12:00', solar: 7.8, grid: 0, consumption: 5.2 },
    { time: '15:00', solar: 6.1, grid: 0, consumption: 4.8 },
    { time: '18:00', solar: 2.3, grid: 2.1, consumption: 4.4 },
    { time: '21:00', solar: 0, grid: 3.8, consumption: 3.8 },
    { time: '23:59', solar: 0, grid: 2.5, consumption: 2.5 },
  ];

  // Fetch real-time energy data from Supabase
  useEffect(() => {
    if (isSimulationMode || !user) return;

    const fetchEnergyData = async () => {
      try {
        // Get recent energy logs for chart
        const { data: energyLogs } = await supabase
          .from('energy_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('logged_at', { ascending: false })
          .limit(24);

        // Get recent solar data
        const { data: solarData } = await supabase
          .from('solar_data')
          .select('*')
          .eq('user_id', user.id)
          .order('logged_at', { ascending: false })
          .limit(24);

        // Transform data for chart with proper validation
        const chartData = energyLogs?.map((log, index) => {
          const time = new Date(log.logged_at).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          const solar = Number((solarData?.[index]?.generation_kwh || 0).toFixed(3));
          const consumption = Number((log.consumption_kwh || 0).toFixed(3));
          const grid = Number(Math.max(0, consumption - solar).toFixed(3));

          return {
            time,
            solar,
            grid,
            consumption
          };
        }).reverse().filter(d => 
          d && 
          typeof d.solar === 'number' && 
          typeof d.grid === 'number' && 
          typeof d.consumption === 'number' &&
          !isNaN(d.solar) && 
          !isNaN(d.grid) && 
          !isNaN(d.consumption)
        ) || [];

        setRealTimeData(chartData);
      } catch (error) {
        console.error('Error fetching energy data:', error);
      }
    };

    fetchEnergyData();

    // Set up real-time subscription for energy logs
    const channel = supabase
      .channel('energy-chart-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'energy_logs',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchEnergyData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'solar_data',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchEnergyData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isSimulationMode]);

  // Choose data source based on mode and ensure we have at least 2 valid points
  let chartData = simulationData || (isSimulationMode ? mockData : realTimeData.length >= 2 ? realTimeData : mockData);
  
  // Final validation: ensure we have valid data with at least 2 points for Area charts
  // Also ensure all data points have all required fields
  if (!chartData || !Array.isArray(chartData) || chartData.length < 2) {
    chartData = mockData;
  } else {
    // Validate each data point has all required fields with valid numbers
    chartData = chartData.filter(point => 
      point &&
      point.time !== undefined &&
      typeof point.solar === 'number' && !isNaN(point.solar) &&
      typeof point.grid === 'number' && !isNaN(point.grid) &&
      typeof point.consumption === 'number' && !isNaN(point.consumption)
    );
    
    // If filtering removed too many points, fall back to mock data
    if (chartData.length < 2) {
      chartData = mockData;
    }
  }
  
  const ChartComponent = type === 'area' ? AreaChart : LineChart;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ChartComponent data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis 
          dataKey="time" 
          className="text-xs"
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
        />
        <YAxis 
          className="text-xs"
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          label={{ value: 'kW', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '12px'
          }}
          labelStyle={{ color: 'hsl(var(--foreground))' }}
        />
        
        {type === 'area' ? (
          <>
            <Area
              type="monotone"
              dataKey="solar"
              stackId="1"
              stroke="hsl(var(--energy-solar))"
              fill="hsl(var(--energy-solar))"
              fillOpacity={0.6}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="grid"
              stackId="1"
              stroke="hsl(var(--energy-grid))"
              fill="hsl(var(--energy-grid))"
              fillOpacity={0.6}
              strokeWidth={2}
            />
          </>
        ) : (
          <>
            <Line
              type="monotone"
              dataKey="consumption"
              stroke="hsl(var(--energy-consumption))"
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--energy-consumption))', strokeWidth: 2, r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="solar"
              stroke="hsl(var(--energy-solar))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--energy-solar))', strokeWidth: 2, r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="grid"
              stroke="hsl(var(--energy-grid))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--energy-grid))', strokeWidth: 2, r: 3 }}
            />
          </>
        )}
      </ChartComponent>
    </ResponsiveContainer>
  );
}