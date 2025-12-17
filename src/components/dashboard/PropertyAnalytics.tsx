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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Building2, Home, Users, TrendingUp, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
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
  flatNumbers: string[];
}

export const PropertyAnalytics = ({ flats }: PropertyAnalyticsProps) => {
  const { language } = useLanguage();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  
  const [editProperty, setEditProperty] = useState<BuildingStats | null>(null);
  const [deleteProperty, setDeleteProperty] = useState<BuildingStats | null>(null);
  const [newPropertyName, setNewPropertyName] = useState('');
  const [newTotalUnits, setNewTotalUnits] = useState<number>(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedProperty, setExpandedProperty] = useState<string | null>(null);

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
    editPropertyDesc: language === 'bn' ? 'প্রপার্টির তথ্য পরিবর্তন করুন' : 'Update property details',
    save: language === 'bn' ? 'সংরক্ষণ করুন' : 'Save',
    cancel: language === 'bn' ? 'বাতিল' : 'Cancel',
    updateSuccess: language === 'bn' ? 'প্রপার্টি আপডেট হয়েছে' : 'Property updated',
    updateError: language === 'bn' ? 'আপডেট করতে সমস্যা হয়েছে' : 'Failed to update',
    flatNumbers: language === 'bn' ? 'ফ্ল্যাট নম্বর' : 'Flat Numbers',
    clickToExpand: language === 'bn' ? 'বিস্তারিত দেখতে ক্লিক করুন' : 'Click to expand',
    deleteProperty: language === 'bn' ? 'প্রপার্টি মুছুন' : 'Delete Property',
    deletePropertyDesc: language === 'bn' ? 'আপনি কি নিশ্চিত? এটি সমস্ত সংশ্লিষ্ট ফ্ল্যাট মুছে ফেলবে।' : 'Are you sure? This will delete all associated flats.',
    deleteSuccess: language === 'bn' ? 'প্রপার্টি মুছে ফেলা হয়েছে' : 'Property deleted',
    deleteError: language === 'bn' ? 'মুছে ফেলতে সমস্যা হয়েছে' : 'Failed to delete',
    cannotDeleteOccupied: language === 'bn' ? 'দখলকৃত ফ্ল্যাট মুছে ফেলা যাবে না' : 'Cannot delete occupied flats',
    delete: language === 'bn' ? 'মুছুন' : 'Delete',
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
        flatNumbers: buildingFlats.map(f => f.flat_number).sort(),
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
    setNewTotalUnits(building.totalFlats);
  };

  const handleUpdateProperty = async () => {
    if (!editProperty || !newPropertyName.trim()) return;
    
    setIsUpdating(true);
    try {
      // Update existing flats with new building name
      const { error: updateError } = await supabase
        .from('flats')
        .update({ building_name: newPropertyName.trim() })
        .in('id', editProperty.flatIds);

      if (updateError) throw updateError;

      // If total units increased, add new flats
      if (newTotalUnits > editProperty.totalFlats) {
        const flatsToAdd = newTotalUnits - editProperty.totalFlats;
        const existingNumbers = editProperty.flatNumbers.map(n => parseInt(n.replace(/\D/g, '')) || 0);
        const maxNumber = Math.max(...existingNumbers, 0);
        
        const newFlats = [];
        for (let i = 1; i <= flatsToAdd; i++) {
          const newNumber = maxNumber + i;
          newFlats.push({
            flat_number: `${newNumber}`,
            building_name: newPropertyName.trim(),
            floor: Math.ceil(newNumber / 4),
            size: 1200,
            status: 'vacant' as const,
          });
        }
        
        const { error: insertError } = await supabase.from('flats').insert(newFlats);
        if (insertError) throw insertError;
      }
      
      // If total units decreased, remove vacant flats only
      if (newTotalUnits < editProperty.totalFlats) {
        const flatsToRemove = editProperty.totalFlats - newTotalUnits;
        // Get only vacant flat IDs from this building
        const { data: vacantFlats } = await supabase
          .from('flats')
          .select('id')
          .eq('building_name', editProperty.name)
          .eq('status', 'vacant')
          .limit(flatsToRemove);
        
        if (vacantFlats && vacantFlats.length > 0) {
          const idsToDelete = vacantFlats.map(f => f.id);
          await supabase.from('flats').delete().in('id', idsToDelete);
        }
      }

      toast({ title: t.updateSuccess });
      queryClient.invalidateQueries({ queryKey: ['flats'] });
      setEditProperty(null);
      setNewPropertyName('');
      setNewTotalUnits(0);
    } catch (error: any) {
      toast({ title: t.updateError, description: error.message, variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleExpanded = (propertyName: string) => {
    setExpandedProperty(expandedProperty === propertyName ? null : propertyName);
  };

  const handleDeleteProperty = async () => {
    if (!deleteProperty) return;
    
    // Check if there are occupied flats
    const occupiedCount = deleteProperty.ownerOccupied + deleteProperty.tenantOccupied;
    if (occupiedCount > 0) {
      toast({ title: t.cannotDeleteOccupied, variant: 'destructive' });
      setDeleteProperty(null);
      return;
    }
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('flats')
        .delete()
        .in('id', deleteProperty.flatIds);

      if (error) throw error;

      toast({ title: t.deleteSuccess });
      queryClient.invalidateQueries({ queryKey: ['flats'] });
      setDeleteProperty(null);
    } catch (error: any) {
      toast({ title: t.deleteError, description: error.message, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
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
                <Collapsible key={building.name} open={expandedProperty === building.name}>
                  <TableRow className="group">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{building.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="font-semibold gap-1 hover:bg-primary/10"
                          onClick={() => toggleExpanded(building.name)}
                        >
                          {building.totalFlats}
                          {expandedProperty === building.name ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </TableCell>
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
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditProperty(building)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteProperty(building)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                  <CollapsibleContent asChild>
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={isAdmin ? 7 : 6} className="py-3">
                        <div className="pl-6">
                          <p className="text-sm font-medium text-muted-foreground mb-2">{t.flatNumbers}:</p>
                          <div className="flex flex-wrap gap-2">
                            {building.flatNumbers.map((flatNum) => (
                              <Badge key={flatNum} variant="secondary" className="text-xs">
                                {flatNum}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  </CollapsibleContent>
                </Collapsible>
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
            <div>
              <Label htmlFor="totalUnits">{t.totalUnits}</Label>
              <Input
                id="totalUnits"
                type="number"
                min={1}
                max={100}
                value={newTotalUnits}
                onChange={(e) => setNewTotalUnits(parseInt(e.target.value) || 0)}
              />
              {editProperty && newTotalUnits < editProperty.totalFlats && (
                <p className="text-xs text-warning mt-1">
                  {language === 'bn' 
                    ? 'শুধুমাত্র খালি ফ্ল্যাট মুছে ফেলা হবে'
                    : 'Only vacant flats will be removed'}
                </p>
              )}
              {editProperty && newTotalUnits > editProperty.totalFlats && (
                <p className="text-xs text-muted-foreground mt-1">
                  {language === 'bn' 
                    ? `${newTotalUnits - editProperty.totalFlats}টি নতুন ফ্ল্যাট যোগ হবে`
                    : `${newTotalUnits - editProperty.totalFlats} new flats will be added`}
                </p>
              )}
            </div>
            {editProperty && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-2">{t.flatNumbers}:</p>
                <div className="flex flex-wrap gap-1">
                  {editProperty.flatNumbers.map((num) => (
                    <Badge key={num} variant="secondary" className="text-xs">
                      {num}
                    </Badge>
                  ))}
                </div>
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

      {/* Delete Property Confirmation */}
      <AlertDialog open={!!deleteProperty} onOpenChange={() => setDeleteProperty(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteProperty}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.deletePropertyDesc}
              {deleteProperty && (deleteProperty.ownerOccupied + deleteProperty.tenantOccupied) > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  {t.cannotDeleteOccupied}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProperty}
              disabled={isDeleting || (deleteProperty ? (deleteProperty.ownerOccupied + deleteProperty.tenantOccupied) > 0 : false)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};