import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Building2, Home, Users, TrendingUp, Pencil, Trash2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

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
  flatIds: string[];
}

export const PropertyAnalytics = ({ flats }: PropertyAnalyticsProps) => {
  const { language } = useLanguage();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  
  const [editProperty, setEditProperty] = useState<BuildingStats | null>(null);
  const [newPropertyName, setNewPropertyName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

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
    listedProperties: language === 'bn' ? 'তালিকাভুক্ত প্রপার্টি' : 'Listed Properties',
    propertyName: language === 'bn' ? 'প্রপার্টির নাম' : 'Property Name',
    totalUnits: language === 'bn' ? 'মোট ইউনিট' : 'Total Units',
    status: language === 'bn' ? 'স্থিতি' : 'Status',
    actions: language === 'bn' ? 'অ্যাকশন' : 'Actions',
    editProperty: language === 'bn' ? 'প্রপার্টি সম্পাদনা' : 'Edit Property',
    editPropertyDesc: language === 'bn' ? 'প্রপার্টির নাম পরিবর্তন করুন' : 'Change the property name',
    save: language === 'bn' ? 'সংরক্ষণ করুন' : 'Save',
    cancel: language === 'bn' ? 'বাতিল' : 'Cancel',
    updateSuccess: language === 'bn' ? 'প্রপার্টি আপডেট হয়েছে' : 'Property updated',
    updateError: language === 'bn' ? 'আপডেট করতে সমস্যা হয়েছে' : 'Failed to update',
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
        flatIds: buildingFlats.map(f => f.id),
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

  const getOccupancyBadge = (rate: number) => {
    if (rate >= 80) return 'bg-success/10 text-success border-success/20';
    if (rate >= 50) return 'bg-warning/10 text-warning border-warning/20';
    return 'bg-destructive/10 text-destructive border-destructive/20';
  };

  const handleEditProperty = (building: BuildingStats) => {
    setEditProperty(building);
    setNewPropertyName(building.name === t.unassigned ? '' : building.name);
  };

  const handleUpdateProperty = async () => {
    if (!editProperty || !newPropertyName.trim()) return;
    
    setIsUpdating(true);
    try {
      // Update all flats with this building name
      const { error } = await supabase
        .from('flats')
        .update({ building_name: newPropertyName.trim() })
        .in('id', editProperty.flatIds);

      if (error) throw error;

      toast({ title: t.updateSuccess });
      queryClient.invalidateQueries({ queryKey: ['flats'] });
      setEditProperty(null);
      setNewPropertyName('');
    } catch (error: any) {
      toast({ title: t.updateError, description: error.message, variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
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

      {/* Listed Properties Table */}
      <Card className="stat-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {t.listedProperties}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.propertyName}</TableHead>
                <TableHead className="text-center">{t.totalUnits}</TableHead>
                <TableHead className="text-center">{t.ownerOccupied}</TableHead>
                <TableHead className="text-center">{t.tenantOccupied}</TableHead>
                <TableHead className="text-center">{t.vacant}</TableHead>
                <TableHead className="text-center">{t.occupancy}</TableHead>
                {isAdmin && <TableHead className="text-right">{t.actions}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.buildingStats.map((building) => (
                <TableRow key={building.name}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{building.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-semibold">{building.totalFlats}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      {building.ownerOccupied}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      {building.tenantOccupied}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="bg-muted text-muted-foreground">
                      {building.vacant}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={getOccupancyBadge(building.occupancyRate)}>
                      {building.occupancyRate.toFixed(0)}%
                    </Badge>
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditProperty(building)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Building-wise Breakdown with Progress */}
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

      {/* Edit Property Dialog */}
      <Dialog open={!!editProperty} onOpenChange={() => setEditProperty(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.editProperty}</DialogTitle>
            <DialogDescription>{t.editPropertyDesc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="propertyName">{t.propertyName}</Label>
              <Input
                id="propertyName"
                value={newPropertyName}
                onChange={(e) => setNewPropertyName(e.target.value)}
                placeholder={language === 'bn' ? 'প্রপার্টির নাম লিখুন' : 'Enter property name'}
              />
            </div>
            {editProperty && (
              <div className="text-sm text-muted-foreground">
                {language === 'bn' 
                  ? `এই প্রপার্টিতে ${editProperty.totalFlats}টি ফ্ল্যাট রয়েছে`
                  : `This property has ${editProperty.totalFlats} flats`}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProperty(null)}>
              {t.cancel}
            </Button>
            <Button onClick={handleUpdateProperty} disabled={isUpdating || !newPropertyName.trim()}>
              {t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
