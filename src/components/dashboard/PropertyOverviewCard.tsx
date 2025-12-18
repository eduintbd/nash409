import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Home, UserX } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface PropertyOverviewCardProps {
  totalFlats: number;
  ownerOccupied: number;
  tenantOccupied: number;
  vacant: number;
  language: string;
}

export const PropertyOverviewCard = ({
  totalFlats,
  ownerOccupied,
  tenantOccupied,
  vacant,
  language,
}: PropertyOverviewCardProps) => {
  const occupancyRate = totalFlats > 0 ? Math.round(((ownerOccupied + tenantOccupied) / totalFlats) * 100) : 0;

  return (
    <Card className="stat-card border-0 bg-gradient-to-br from-primary/5 to-primary/10 h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardDescription className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            {language === 'bn' ? 'প্রপার্টি সারসংক্ষেপ' : 'Property Overview'}
          </CardDescription>
          <span className="text-2xl font-bold text-primary">{totalFlats}</span>
        </div>
        <CardTitle className="text-sm text-muted-foreground">
          {language === 'bn' ? 'মোট ইউনিট' : 'Total Units'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Occupancy Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {language === 'bn' ? 'দখল হার' : 'Occupancy Rate'}
            </span>
            <span className="font-semibold text-primary">{occupancyRate}%</span>
          </div>
          <Progress value={occupancyRate} className="h-2" />
        </div>

        {/* Status Breakdown */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="text-center p-2 rounded-lg bg-success/10">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Home className="h-3 w-3 text-success" />
            </div>
            <p className="text-lg font-bold text-success">{ownerOccupied}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">
              {language === 'bn' ? 'মালিক' : 'Owner'}
            </p>
          </div>
          
          <div className="text-center p-2 rounded-lg bg-primary/10">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="h-3 w-3 text-primary" />
            </div>
            <p className="text-lg font-bold text-primary">{tenantOccupied}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">
              {language === 'bn' ? 'ভাড়াটিয়া' : 'Tenant'}
            </p>
          </div>
          
          <div className="text-center p-2 rounded-lg bg-muted">
            <div className="flex items-center justify-center gap-1 mb-1">
              <UserX className="h-3 w-3 text-muted-foreground" />
            </div>
            <p className="text-lg font-bold text-muted-foreground">{vacant}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">
              {language === 'bn' ? 'খালি' : 'Vacant'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
