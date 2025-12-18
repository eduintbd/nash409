import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, Building2, Maximize } from 'lucide-react';

interface TenantPropertyCardProps {
  flatNumber: string;
  floor: number;
  size: number;
  language: string;
}

export const TenantPropertyCard = ({
  flatNumber,
  floor,
  size,
  language,
}: TenantPropertyCardProps) => {
  return (
    <Card className="stat-card border-0 bg-gradient-to-br from-primary/5 to-primary/10 h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardDescription className="flex items-center gap-2">
            <Home className="h-4 w-4 text-primary" />
            {language === 'bn' ? 'আমার ফ্ল্যাট' : 'My Flat'}
          </CardDescription>
          <span className="text-2xl font-bold text-primary">{flatNumber || '-'}</span>
        </div>
        <CardTitle className="text-sm text-muted-foreground">
          {language === 'bn' ? 'ফ্ল্যাট নম্বর' : 'Flat Number'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Flat Details */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="text-center p-3 rounded-lg bg-primary/10">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Building2 className="h-3 w-3 text-primary" />
            </div>
            <p className="text-lg font-bold text-primary">{floor || '-'}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">
              {language === 'bn' ? 'তলা' : 'Floor'}
            </p>
          </div>
          
          <div className="text-center p-3 rounded-lg bg-success/10">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Maximize className="h-3 w-3 text-success" />
            </div>
            <p className="text-lg font-bold text-success">{size || 0}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">
              {language === 'bn' ? 'বর্গফুট' : 'sqft'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
