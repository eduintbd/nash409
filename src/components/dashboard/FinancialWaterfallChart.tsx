import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet } from 'lucide-react';
import { formatBDT } from '@/lib/currency';
import { Link } from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Cell,
  Tooltip,
  ReferenceLine
} from 'recharts';

interface WaterfallDataItem {
  name: string;
  nameBn: string;
  value: number;
  fill: string;
  link: string;
}

interface FinancialWaterfallChartProps {
  data: WaterfallDataItem[];
  language: string;
  title?: string;
  titleBn?: string;
}

const CustomTooltip = ({ active, payload, language }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-popover border rounded-lg shadow-lg p-3">
        <p className="font-medium text-sm">{language === 'bn' ? data.nameBn : data.name}</p>
        <p className="text-lg font-bold" style={{ color: data.fill }}>
          {formatBDT(Math.abs(data.value))}
        </p>
      </div>
    );
  }
  return null;
};

export const FinancialWaterfallChart = memo(function FinancialWaterfallChart({
  data,
  language,
  title = 'Financial Summary',
  titleBn = 'আর্থিক সারসংক্ষেপ'
}: FinancialWaterfallChartProps) {
  // Calculate cumulative values for waterfall effect
  let cumulative = 0;
  const waterfallData = data.map((item, index) => {
    const start = cumulative;
    cumulative += item.value;
    return {
      ...item,
      start,
      end: cumulative,
      displayValue: item.value,
    };
  });

  return (
    <Card className="stat-card border-0 col-span-1 md:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          {language === 'bn' ? titleBn : title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={waterfallData}
              margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
            >
              <XAxis 
                dataKey={language === 'bn' ? 'nameBn' : 'name'} 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                hide 
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip language={language} />} />
              <ReferenceLine y={0} stroke="hsl(var(--border))" />
              <Bar 
                dataKey="displayValue" 
                radius={[6, 6, 6, 6]}
                maxBarSize={80}
              >
                {waterfallData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.fill}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Clickable Labels Below Chart */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
          {data.map((item, index) => (
            <Link 
              key={index} 
              to={item.link} 
              className="block hover:scale-[1.02] transition-transform"
            >
              <div 
                className="text-center p-3 rounded-lg cursor-pointer"
                style={{ backgroundColor: `${item.fill}20` }}
              >
                <p className="text-xs text-muted-foreground mb-1">
                  {language === 'bn' ? item.nameBn : item.name}
                </p>
                <p className="text-lg font-bold" style={{ color: item.fill }}>
                  {formatBDT(Math.abs(item.value))}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});
