import { memo, useMemo } from 'react';
import { mockFlats } from '@/data/mockData';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = {
  'owner-occupied': 'hsl(185, 70%, 30%)',
  'tenant': 'hsl(170, 60%, 40%)',
  'vacant': 'hsl(210, 15%, 70%)',
};

export const OccupancyChart = memo(function OccupancyChart() {
  const data = useMemo(() => {
    const counts = mockFlats.reduce((acc, flat) => {
      acc[flat.status] = (acc[flat.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: 'Owner Occupied', value: counts['owner-occupied'] || 0, color: COLORS['owner-occupied'] },
      { name: 'Tenant', value: counts['tenant'] || 0, color: COLORS['tenant'] },
      { name: 'Vacant', value: counts['vacant'] || 0, color: COLORS['vacant'] },
    ];
  }, []);

  return (
    <div className="stat-card">
      <h3 className="text-lg font-semibold mb-4">Occupancy Status</h3>
      <div className="flex items-center gap-6">
        <div className="h-40 w-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={65}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-3">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
              <div>
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.value} flats</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
