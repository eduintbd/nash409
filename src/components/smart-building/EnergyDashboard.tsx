import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { Zap, Droplets, Flame, TrendingUp } from 'lucide-react';
import { generateDailyReadings, generateMonthlyReadings, COST_PER_UNIT } from '@/lib/simulatedData';
import { formatCurrency } from '@/lib/currency';
import { useMemo } from 'react';

export const EnergyDashboard = () => {
  const dailyData = useMemo(() => generateDailyReadings(30), []);
  const monthlyData = useMemo(() => generateMonthlyReadings(12), []);

  const monthTotals = {
    electricity: dailyData.reduce((sum, d) => sum + d.electricity, 0),
    water: dailyData.reduce((sum, d) => sum + d.water, 0),
    gas: dailyData.reduce((sum, d) => sum + d.gas, 0),
  };

  const monthCosts = {
    electricity: monthTotals.electricity * COST_PER_UNIT.electricity,
    water: monthTotals.water * COST_PER_UNIT.water,
    gas: monthTotals.gas * COST_PER_UNIT.gas,
  };

  const totalCost = monthCosts.electricity + monthCosts.water + monthCosts.gas;

  const costDistribution = [
    { name: 'Electricity', value: monthCosts.electricity, color: 'hsl(var(--chart-1))' },
    { name: 'Water', value: monthCosts.water, color: 'hsl(var(--chart-3))' },
    { name: 'Gas', value: monthCosts.gas, color: 'hsl(var(--chart-5))' },
  ];

  const chartConfig = {
    electricity: { label: 'Electricity', color: 'hsl(var(--chart-1))' },
    water: { label: 'Water', color: 'hsl(var(--chart-3))' },
    gas: { label: 'Gas', color: 'hsl(var(--chart-5))' },
  };

  // Normalize data for comparison chart
  const normalizedMonthly = monthlyData.map(d => ({
    date: d.date,
    electricity: d.electricity / 100, // Scale down for visibility
    water: d.water / 10,
    gas: d.gas / 5,
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Electricity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthTotals.electricity.toLocaleString()} kWh</div>
            <p className="text-sm text-muted-foreground">{formatCurrency(monthCosts.electricity)}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Droplets className="h-4 w-4 text-blue-500" />
              Water
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthTotals.water.toFixed(0)} m³</div>
            <p className="text-sm text-muted-foreground">{formatCurrency(monthCosts.water)}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              Gas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthTotals.gas.toFixed(0)} m³</div>
            <p className="text-sm text-muted-foreground">{formatCurrency(monthCosts.gas)}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Total Monthly Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
            <p className="text-sm text-muted-foreground">All utilities combined</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <PieChart>
                <Pie
                  data={costDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {costDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Consumption Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <AreaChart data={normalizedMonthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Area type="monotone" dataKey="electricity" stackId="1" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.6} />
                <Area type="monotone" dataKey="water" stackId="1" stroke="hsl(var(--chart-3))" fill="hsl(var(--chart-3))" fillOpacity={0.6} />
                <Area type="monotone" dataKey="gas" stackId="1" stroke="hsl(var(--chart-5))" fill="hsl(var(--chart-5))" fillOpacity={0.6} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Daily Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Energy Consumption (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <AreaChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} fontSize={12} />
              <YAxis yAxisId="left" fontSize={12} />
              <YAxis yAxisId="right" orientation="right" fontSize={12} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Area yAxisId="left" type="monotone" dataKey="electricity" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.3} />
              <Area yAxisId="right" type="monotone" dataKey="water" stroke="hsl(var(--chart-3))" fill="hsl(var(--chart-3))" fillOpacity={0.3} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};
