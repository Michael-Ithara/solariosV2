import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

// Mock data for energy consumption
const energyData = [
  { time: '00:00', solar: 0, grid: 2.1, consumption: 2.1 },
  { time: '06:00', solar: 0.5, grid: 3.2, consumption: 3.7 },
  { time: '09:00', solar: 4.2, grid: 1.8, consumption: 6.0 },
  { time: '12:00', solar: 7.8, grid: 0, consumption: 5.2 },
  { time: '15:00', solar: 6.1, grid: 0, consumption: 4.8 },
  { time: '18:00', solar: 2.3, grid: 2.1, consumption: 4.4 },
  { time: '21:00', solar: 0, grid: 3.8, consumption: 3.8 },
  { time: '23:59', solar: 0, grid: 2.5, consumption: 2.5 },
];

interface EnergyChartProps {
  type?: 'line' | 'area';
  height?: number;
}

export function EnergyChart({ type = 'line', height = 300 }: EnergyChartProps) {
  const ChartComponent = type === 'area' ? AreaChart : LineChart;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ChartComponent data={energyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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