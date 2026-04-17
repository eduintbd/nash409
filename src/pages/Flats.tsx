import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { useFlats, useUpdateFlat, Flat } from '@/hooks/useFlats';
import { useOwners, useUpdateOwner, Owner } from '@/hooks/useOwners';
import { useTenants, useUpdateTenant, Tenant } from '@/hooks/useTenants';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
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
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search, Building2, User, Phone, Mail, Car, BarChart3, Shield, FolderOpen, Receipt,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { formatBDT } from '@/lib/currency';
import FlatForm from '@/components/forms/FlatForm';
import { PropertyAnalytics } from '@/components/dashboard/PropertyAnalytics';
import { PropertyManagement } from '@/components/property/PropertyManagement';

const Flats = () => {
  const { t, language } = useLanguage();
  const { isAdmin } = useAuth();
  const { data: flats, isLoading } = useFlats();
  const { data: owners } = useOwners();
  const { data: tenants } = useTenants();
  const updateFlat = useUpdateFlat();
  const updateOwner = useUpdateOwner();
  const updateTenant = useUpdateTenant();
  
  const [activeTab, setActiveTab] = useState('property-management');
  const [search, setSearch] = useState('');
  const [selectedFlat, setSelectedFlat] = useState<Flat | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editFlat, setEditFlat] = useState<Flat | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Flat | null>(null);

  const statusColors = {
    'owner-occupied': 'bg-primary/10 text-primary border-primary/20',
    'tenant': 'bg-success/10 text-success border-success/20',
    'vacant': 'bg-muted text-muted-foreground border-border',
  };

  const statusLabels = {
    'owner-occupied': t.flats.statusOwner,
    'tenant': t.flats.statusTenant,
    'vacant': t.flats.statusVacant,
  };

  // Filter out flats without building_name (blank info) and apply search
  const filteredFlats = useMemo(() => {
    return flats?.filter(flat => 
      flat.building_name && // Only include flats with a building name
      (flat.flat_number.toLowerCase().includes(search.toLowerCase()) ||
      flat.building_name.toLowerCase().includes(search.toLowerCase()))
    ) || [];
  }, [flats, search]);

  // Analytics data
  const analytics = useMemo(() => {
    if (!flats) return null;
    const validFlats = flats.filter(f => f.building_name);
    return {
      totalUnits: validFlats.length,
      ownerOccupied: validFlats.filter(f => f.status === 'owner-occupied').length,
      tenantOccupied: validFlats.filter(f => f.status === 'tenant').length,
      vacant: validFlats.filter(f => f.status === 'vacant').length,
    };
  }, [flats]);

  const getOwner = (flatId: string) => owners?.find(o => o.flat_id === flatId) as Owner | undefined;
  const getTenant = (flatId: string) => tenants?.find(t => t.flat_id === flatId) as Tenant | undefined;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US');
  };

  const handleFormSubmit = async (data: {
    flat: Partial<Flat>;
    owner?: Partial<Owner> & { id?: string };
    tenant?: Partial<Tenant> & { id?: string };
  }) => {
    try {
      if (editFlat) {
        await updateFlat.mutateAsync({ id: editFlat.id, ...data.flat });
        
        if (data.owner?.id) {
          await updateOwner.mutateAsync({ 
            id: data.owner.id, 
            name: data.owner.name,
            phone: data.owner.phone,
            email: data.owner.email,
            nid: data.owner.nid,
            emergency_contact: data.owner.emergency_contact,
          });
        }
        
        if (data.tenant?.id) {
          await updateTenant.mutateAsync({ 
            id: data.tenant.id, 
            name: data.tenant.name,
            phone: data.tenant.phone,
            email: data.tenant.email,
            nid: data.tenant.nid,
            rent_amount: data.tenant.rent_amount,
          });
        }
      }
      
      setShowForm(false);
      setEditFlat(null);
    } catch (error) {
      // Error handling is done in the hooks
    }
  };

  const handleEdit = (flat: Flat) => {
    setEditFlat(flat);
    setShowForm(true);
  };

  const editOwner = editFlat ? getOwner(editFlat.id) : undefined;
  const editTenant = editFlat ? getTenant(editFlat.id) : undefined;

  return (
    <MainLayout>
      <Header 
        title={t.flats.title}
        subtitle={t.flats.subtitle}
      />
      
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Admin Status Badge */}
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              <Shield className="h-3 w-3 mr-1" />
              {language === 'bn' ? 'অ্যাডমিন' : 'Admin'}
            </Badge>
          </div>
        )}

        {/* Total Units Counter */}
        {analytics && (
          <Card className="bg-muted/30">
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <span className="font-semibold">{language === 'bn' ? 'মোট ইউনিট:' : 'Total Units:'}</span>
                  <span className="text-2xl font-bold text-primary">{analytics.totalUnits}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    {language === 'bn' ? 'মালিক:' : 'Owner:'} {analytics.ownerOccupied}
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-success" />
                    {language === 'bn' ? 'ভাড়াটিয়া:' : 'Tenant:'} {analytics.tenantOccupied}
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                    {language === 'bn' ? 'খালি:' : 'Vacant:'} {analytics.vacant}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isAdmin ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="property-management">
                <FolderOpen className="h-4 w-4 mr-2" />
                {language === 'bn' ? 'প্রপার্টি ম্যানেজমেন্ট' : 'Property Management'}
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart3 className="h-4 w-4 mr-2" />
                {language === 'bn' ? 'বিশ্লেষণ' : 'Analytics'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="property-management" className="space-y-4">
              <PropertyManagement onEditFlat={handleEdit} />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
                  </div>
                  <Skeleton className="h-64" />
                </div>
              ) : flats && flats.length > 0 ? (
                <PropertyAnalytics flats={flats} />
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    {language === 'bn' ? 'কোনো ফ্ল্যাট পাওয়া যায়নি' : 'No flats found'}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <>
            {/* Non-admin view - original layout */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t.flats.searchPlaceholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="stat-card overflow-hidden">
              {isLoading ? (
                <div className="p-4 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="table-header">
                        <TableHead className="min-w-[120px]">{language === 'bn' ? 'বিল্ডিং' : 'Building'}</TableHead>
                        <TableHead className="w-24">{t.flats.flatNo}</TableHead>
                        <TableHead className="min-w-[100px]">{t.flats.owner}</TableHead>
                        <TableHead className="min-w-[100px]">{language === 'bn' ? 'ভাড়াটিয়া' : 'Tenant'}</TableHead>
                        <TableHead className="w-16 text-center">{t.flats.floor}</TableHead>
                        <TableHead className="w-20 text-right">{t.flats.size}</TableHead>
                        <TableHead className="w-28">{t.common.status}</TableHead>
                        <TableHead className="min-w-[120px]">{t.flats.contact}</TableHead>
                        <TableHead className="w-20">{t.flats.parking}</TableHead>
                        <TableHead className="text-right w-24">{t.common.actions}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFlats.map((flat) => {
                        const owner = getOwner(flat.id);
                        const tenant = getTenant(flat.id);
                        const contactPerson = flat.status === 'tenant' && tenant ? tenant : owner;

                        return (
                          <TableRow key={flat.id} className="table-row-hover">
                            <TableCell className="text-muted-foreground">
                              {flat.building_name || '-'}
                            </TableCell>
                            <TableCell className="font-semibold">{flat.flat_number}</TableCell>
                            <TableCell>{owner?.name || '-'}</TableCell>
                            <TableCell>{tenant?.name || '-'}</TableCell>
                            <TableCell className="text-center">{flat.floor}</TableCell>
                            <TableCell className="text-right">{flat.size.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={statusColors[flat.status]}>
                                {statusLabels[flat.status]}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {contactPerson?.phone || '-'}
                            </TableCell>
                            <TableCell>
                              {flat.parking_spot ? (
                                <span className="flex items-center gap-1 text-sm">
                                  <Car className="h-3 w-3" /> {flat.parking_spot}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">N/A</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-1 justify-end">
                                <Button asChild variant="ghost" size="sm" title={language === 'bn' ? 'লেজার' : 'Ledger'}>
                                  <Link to={`/flats/${flat.id}/ledger`}>
                                    <Receipt className="h-4 w-4" aria-hidden="true" />
                                  </Link>
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedFlat(flat)}>
                                  {t.common.details}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Details Dialog */}
      <Dialog open={!!selectedFlat} onOpenChange={() => setSelectedFlat(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {t.flats.flatNo} {selectedFlat?.flat_number}
            </DialogTitle>
            <DialogDescription>
              {t.flats.floor} {selectedFlat?.floor} • {selectedFlat?.size?.toLocaleString()} sq.ft
            </DialogDescription>
          </DialogHeader>
          {selectedFlat && (
            <div className="space-y-4 mt-4">
              <div className="p-4 rounded-lg bg-muted/30">
                <Badge variant="outline" className={statusColors[selectedFlat.status]}>
                  {statusLabels[selectedFlat.status]}
                </Badge>
                {selectedFlat.parking_spot && (
                  <p className="mt-2 text-sm flex items-center gap-2">
                    <Car className="h-4 w-4" /> {t.flats.parking}: {selectedFlat.parking_spot}
                  </p>
                )}
              </div>
              
              {getOwner(selectedFlat.id) && (
                <div className="p-4 rounded-lg border">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" /> {t.flats.ownerDetails}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">{getOwner(selectedFlat.id)?.name}</p>
                    {getOwner(selectedFlat.id)?.email && (
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3 w-3" /> {getOwner(selectedFlat.id)?.email}
                      </p>
                    )}
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3 w-3" /> {getOwner(selectedFlat.id)?.phone}
                    </p>
                    <p className="text-muted-foreground">
                      {t.flats.ownerSince}: {formatDate(getOwner(selectedFlat.id)?.ownership_start || '')}
                    </p>
                  </div>
                </div>
              )}

              {getTenant(selectedFlat.id) && (
                <div className="p-4 rounded-lg border border-success/20 bg-success/5">
                  <h4 className="font-medium mb-3 flex items-center gap-2 text-success">
                    <User className="h-4 w-4" /> {t.flats.tenantDetails}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">{getTenant(selectedFlat.id)?.name}</p>
                    {getTenant(selectedFlat.id)?.email && (
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3 w-3" /> {getTenant(selectedFlat.id)?.email}
                      </p>
                    )}
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3 w-3" /> {getTenant(selectedFlat.id)?.phone}
                    </p>
                    <p className="text-muted-foreground">
                      {t.flats.rent}: {formatBDT(getTenant(selectedFlat.id)?.rent_amount || 0)}{t.common.perMonth}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Flat Form */}
      <FlatForm
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditFlat(null); }}
        onSubmit={handleFormSubmit}
        editData={editFlat}
        ownerData={editOwner || null}
        tenantData={editTenant || null}
        isLoading={updateFlat.isPending || updateOwner.isPending || updateTenant.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'bn' ? 'ফ্ল্যাট মুছে ফেলতে চান?' : 'Delete Flat?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm?.status !== 'vacant' ? (
                language === 'bn' 
                  ? 'শুধুমাত্র খালি ফ্ল্যাট মুছে ফেলা যাবে।'
                  : 'Only vacant flats can be deleted.'
              ) : (
                language === 'bn' 
                  ? `ফ্ল্যাট ${deleteConfirm?.flat_number} মুছে ফেলা হবে। এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।`
                  : `Flat ${deleteConfirm?.flat_number} will be deleted. This action cannot be undone.`
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === 'bn' ? 'বাতিল' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteConfirm?.status !== 'vacant'}
            >
              {language === 'bn' ? 'মুছুন' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default Flats;
