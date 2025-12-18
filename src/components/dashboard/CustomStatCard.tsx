import { 
  Building2, Users, Receipt, Wrench, TrendingUp, TrendingDown, 
  Home, Wallet, DollarSign, PiggyBank, Landmark, BarChart3, LucideIcon 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DashboardCard } from '@/hooks/useDashboardCards';
import { useLanguage } from '@/contexts/LanguageContext';

const ICON_MAP: Record<string, LucideIcon> = {
  Building2,
  Users,
  Receipt,
  Wrench,
  TrendingUp,
  TrendingDown,
  Home,
  Wallet,
  DollarSign,
  PiggyBank,
  Landmark,
  BarChart3,
};

const variantStyles = {
  default: 'bg-card',
  primary: 'bg-primary/10',
  success: 'bg-success/10',
  warning: 'bg-warning/10',
  destructive: 'bg-destructive/10',
};

const iconStyles = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary/20 text-primary',
  success: 'bg-success/20 text-success',
  warning: 'bg-warning/20 text-warning',
  destructive: 'bg-destructive/20 text-destructive',
};

interface CustomStatCardProps {
  card: DashboardCard;
}

export function CustomStatCard({ card }: CustomStatCardProps) {
  const { language } = useLanguage();
  const Icon = ICON_MAP[card.icon || 'Wallet'] || Wallet;
  const variant = card.variant || 'default';

  return (
    <div className={cn('stat-card', variantStyles[variant])}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            {language === 'bn' ? card.titleBn || card.title : card.title}
          </p>
          <p className="text-3xl font-bold text-foreground">
            {language === 'bn' ? card.customValueBn || card.customValue : card.customValue}
          </p>
        </div>
        <div className={cn('p-3 rounded-xl', iconStyles[variant])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
