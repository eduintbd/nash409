import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Building2, Home, Users, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Flat {
  id: string;
  flat_number: string;
  building_name: string | null;
  status: 'owner-occupied' | 'tenant' | 'vacant';
  floor: number;
  size: number;
}

interface PropertyAnalyticsProps {
  flats: Flat[];
}

interface BuildingStats {
  name: string;
  totalFlats: number;
  ownerOccupied: number;
  tenantOccupied: number;
  vacant: number;
  occupancyRate: number;
}

export const PropertyAnalytics = ({ flats }: PropertyAnalyticsProps) => {
  const { language } = useLanguage();

  const t = {
    title: language === 'bn' ? 'সম্পত্তি বিশ্লেষণ' : 'Property Analytics',
    totalProperties: language === 'bn' ? 'মোট প্রপার্টি' : 'Total Properties',
    totalFlats: language === 'bn' ? 'মোট ফ্ল্যাট' : 'Total Flats',
    avgOccupancy: language === 'bn' ? 'গড় দখল হার' : 'Avg. Occupancy',
    byBuilding: language === 'bn' ? 'বিল্ডিং অনুযায়ী' : 'By Building',
    ownerOccupied: language === 'bn' ? 'মালিক' : 'Owner',
    tenantOccupied: language === 'bn' ? 'ভাড়াটে' : 'Tenant',
    vacant: language === 'bn' ? 'খালি' : 'Vacant',
    occupancy: language === 'bn' ? 'দখল হার' : 'Occupancy',
    flats: language === 'bn' ? 'ফ্ল্যাট' : 'flats',
    unassigned: language === 'bn' ? 'অনির্ধারিত' : 'Unassigned',
  };

  const analytics = useMemo(() => {
    // Group flats by building
    const buildingMap = new Map<string, Flat[]>();
    
    flats.forEach(flat => {
      const buildingName = flat.building_name || t.unassigned;
      if (!buildingMap.has(buildingName)) {
        buildingMap.set(buildingName, []);
      }
      buildingMap.get(buildingName)!.push(flat);
    });

    // Calculate stats per building
    const buildingStats: BuildingStats[] = Array.from(buildingMap.entries()).map(([name, buildingFlats]) => {
      const ownerOccupied = buildingFlats.filter(f => f.status === 'owner-occupied').length;
      const tenantOccupied = buildingFlats.filter(f => f.status === 'tenant').length;
      const vacant = buildingFlats.filter(f => f.status === 'vacant').length;
      const totalFlats = buildingFlats.length;
      const occupancyRate = totalFlats > 0 ? ((ownerOccupied + tenantOccupied) / totalFlats) * 100 : 0;

      return {
        name,
        totalFlats,
        ownerOccupied,
        tenantOccupied,
        vacant,
        occupancyRate,
      };
    }).sort((a, b) => b.totalFlats - a.totalFlats);

    // Overall stats
    const totalProperties = buildingMap.size;
    const totalFlats = flats.length;
    const totalOccupied = flats.filter(f => f.status !== 'vacant').length;
    const avgOccupancy = totalFlats > 0 ? (totalOccupied / totalFlats) * 100 : 0;

    return {
      totalProperties,
      totalFlats,
      avgOccupancy,
      buildingStats,
    };
  }, [flats, t.unassigned]);

  const getOccupancyColor = (rate: number) => {
    if (rate >= 80) return 'text-success';
    if (rate >= 50) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="stat-card">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.totalProperties}</p>
                <p className="text-2xl font-bold">{analytics.totalProperties}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <Home className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.totalFlats}</p>
                <p className="text-2xl font-bold">{analytics.totalFlats}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <TrendingUp className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.avgOccupancy}</p>
                <p className={`text-2xl font-bold ${getOccupancyColor(analytics.avgOccupancy)}`}>
                  {analytics.avgOccupancy.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Building-wise Breakdown */}
      <Card className="stat-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t.byBuilding}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.buildingStats.map((building) => (
              <div key={building.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{building.name}</span>
                    <span className="text-sm text-muted-foreground">
                      ({building.totalFlats} {t.flats})
                    </span>
                  </div>
                  <span className={`font-semibold ${getOccupancyColor(building.occupancyRate)}`}>
                    {building.occupancyRate.toFixed(0)}% {t.occupancy}
                  </span>
                </div>
                <Progress value={building.occupancyRate} className="h-2" />
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    {t.ownerOccupied}: {building.ownerOccupied}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-success"></span>
                    {t.tenantOccupied}: {building.tenantOccupied}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground"></span>
                    {t.vacant}: {building.vacant}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
