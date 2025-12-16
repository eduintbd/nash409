import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatBDT } from '@/lib/currency';

interface Invoice {
  id: string;
  flat_id: string;
  month: string;
  year: number;
  amount: number;
  status: string;
  paid_date: string | null;
  invoice_type: string;
}

interface OwnerPaymentChartProps {
  invoices: Invoice[];
  language: 'en' | 'bn';
}

const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const OwnerPaymentChart = ({ invoices, language }: OwnerPaymentChartProps) => {
  const chartData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const last6Months: { month: string; monthIndex: number }[] = [];
    const currentMonth = new Date().getMonth();
    
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      last6Months.push({
        month: monthOrder[monthIndex],
        monthIndex
      });
    }

    return last6Months.map(({ month, monthIndex }) => {
      const year = monthIndex > currentMonth ? currentYear - 1 : currentYear;
      
      const monthInvoices = invoices.filter(inv => 
        inv.month === month && inv.year === year
      );
      
      const paid = monthInvoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + Number(inv.amount), 0);
      
      const pending = monthInvoices
        .filter(inv => inv.status !== 'paid')
        .reduce((sum, inv) => sum + Number(inv.amount), 0);

      return {
        month: month.substring(0, 3),
        paid,
        pending,
        fullMonth: month
      };
    });
  }, [invoices]);

  const chartConfig = {
    paid: {
      label: language === 'bn' ? 'পরিশোধিত' : 'Paid',
      color: 'hsl(var(--success))',
    },
    pending: {
      label: language === 'bn' ? 'বকেয়া' : 'Pending',
      color: 'hsl(var(--warning))',
    },
  };

  return (
    <Card className="stat-card border-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">
          {language === 'bn' ? 'পেমেন্ট ইতিহাস' : 'Payment History'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
            <XAxis 
              dataKey="month" 
              tickLine={false} 
              axisLine={false}
              className="text-xs fill-muted-foreground"
            />
            <YAxis 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(value) => `৳${(value / 1000).toFixed(0)}k`}
              className="text-xs fill-muted-foreground"
              width={50}
            />
            <ChartTooltip 
              content={<ChartTooltipContent />}
              formatter={(value: number) => formatBDT(value)}
            />
            <Bar 
              dataKey="paid" 
              fill="var(--color-paid)" 
              radius={[4, 4, 0, 0]}
              name={chartConfig.paid.label}
            />
            <Bar 
              dataKey="pending" 
              fill="var(--color-pending)" 
              radius={[4, 4, 0, 0]}
              name={chartConfig.pending.label}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
