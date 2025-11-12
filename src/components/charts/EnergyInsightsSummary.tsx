import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface EnergyInsightsSummaryProps {
  solar: number;
  grid: number;
  essr: number;
  periodLabel: string;
}

const COLORS = ['#22c55e', '#d1d5db']; // Green for solar, Gray for grid

export const EnergyInsightsSummary: React.FC<EnergyInsightsSummaryProps> = ({ solar, grid, essr, periodLabel }) => {
  const data = [
    { name: 'Solar', value: solar },
    { name: 'Grid', value: grid },
  ];
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <ResponsiveContainer width={220} height={220}>
        <PieChart>
          <Pie
            data={data}
            innerRadius={70}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
          >
            {data.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: any, name: string) => [`${value} kWh`, name]}
            contentStyle={{ fontSize: 14 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute flex flex-col items-center justify-center" style={{ top: 90, left: 0, right: 0, pointerEvents: 'none' }}>
        <div className="text-3xl font-bold text-green-600">{essr}%</div>
        <div className="text-xs text-muted-foreground">Solar</div>
        <div className="text-xs text-muted-foreground mt-1">{periodLabel}</div>
      </div>
    </div>
  );
};
