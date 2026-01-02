import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';
import { Droplets, AlertTriangle } from 'lucide-react';
import { generateDailyReadings, generateMonthlyReadings, COST_PER_UNIT } from '@/lib/simulatedData';
import { formatCurrency } from '@/lib/currency';
import { useMemo } from 'react';

export const WaterMonitor = () => {
  const dailyData = useMemo(() => generateDailyReadings(30), []);
  const monthlyData = useMemo(() => generateMonthlyReadings(12), []);

  const todayUsage = dailyData[dailyData.length - 1]?.water || 0;
  const avgUsage = dailyData.reduce((sum, d) => sum + d.water, 0) / dailyData.length;
  const isHighUsage = todayUsage > avgUsage * 1.3;

  const monthTotal = dailyData.slice(-30).reduce((sum, d) => sum + d.water, 0);
  const monthCost = monthTotal * COST_PER_UNIT.water;

  // Simulated leak detection - flag if usage is unusually high
  const potentialLeak = dailyData.some(d => d.water > avgUsage * 1.5);

  const chartConfig = {
    water: { label: 'Water (m³)', color: 'hsl(var(--chart-3))' },
    cost: { label: 'Cost (BDT)', color: 'hsl(var(--chart-4))' },
  };

  return (
    <div className="space-y-6">
      {/* Leak Detection Alert */}
      {potentialLeak && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <div>
                <p className="font-semibold text-destructive">Potential Water Leak Detected</p>
                <p className="text-sm text-muted-foreground">
                  Unusual water consumption pattern detected. Consider inspection of common area pipelines.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{todayUsage.toFixed(1)} m³</div>
              {isHighUsage && (
                <Badge variant="destructive">High</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthTotal.toFixed(0)} m³</div>
            <p className="text-sm text-muted-foreground">Building total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthCost)}</div>
            <p className="text-sm text-muted-foreground">@ {COST_PER_UNIT.water} BDT/m³</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Daily Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Droplets className="h-5 w-5 text-blue-500" />
              {avgUsage.toFixed(1)} m³
            </div>
            <p className="text-sm text-muted-foreground">per day</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="daily" className="w-full">
        <TabsList>
          <TabsTrigger value="daily">Daily Usage</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Trend</TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          <Card>
            <CardHeader>
              <CardTitle>Daily Water Consumption (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <AreaChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} fontSize={12} />
                  <YAxis fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="water" stroke="hsl(var(--chart-3))" fill="hsl(var(--chart-3))" fillOpacity={0.3} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Water Consumption (Last 12 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="water" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
