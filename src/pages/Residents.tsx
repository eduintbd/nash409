import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { useOwners, useDeleteOwner } from '@/hooks/useOwners';
import { useTenants, useDeleteTenant } from '@/hooks/useTenants';
import { useFlats } from '@/hooks/useFlats';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OwnerForm } from '@/components/forms/OwnerForm';
import { TenantForm } from '@/components/forms/TenantForm';
import { Search, Plus, Mail, Phone, Building2, Calendar, Edit, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatBDT } from '@/lib/currency';
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

const Residents = () => {
  const { t, language } = useLanguage();
  const { data: owners, isLoading: loadingOwners } = useOwners();
  const { data: tenants, isLoading: loadingTenants } = useTenants();
  const { data: flats } = useFlats();
  const deleteOwner = useDeleteOwner();
  const deleteTenant = useDeleteTenant();
  
  const [search, setSearch] = useState('');
  const [ownerFormOpen, setOwnerFormOpen] = useState(false);
  const [tenantFormOpen, setTenantFormOpen] = useState(false);
  const [editOwner, setEditOwner] = useState<any>(null);
  const [editTenant, setEditTenant] = useState<any>(null);
  const [deleteOwnerModal, setDeleteOwnerModal] = useState<string | null>(null);
  const [deleteTenantModal, setDeleteTenantModal] = useState<string | null>(null);

  const filteredOwners = owners?.filter(owner =>
    owner.name.toLowerCase().includes(search.toLowerCase()) ||
    owner.email?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const filteredTenants = tenants?.filter(tenant =>
    tenant.name.toLowerCase().includes(search.toLowerCase()) ||
    tenant.email?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const getFlat = (flatId: string | null) => flats?.find(f => f.id === flatId);

  const handleDeleteOwner = async () => {
    if (deleteOwnerModal) {
      await deleteOwner.mutateAsync(deleteOwnerModal);
      setDeleteOwnerModal(null);
    }
  };

  const handleDeleteTenant = async () => {
    if (deleteTenantModal) {
      await deleteTenant.mutateAsync(deleteTenantModal);
      setDeleteTenantModal(null);
    }
  };

  const locale = language === 'bn' ? 'bn-BD' : 'en-US';

  return (
    <MainLayout>
      <Header 
        title={t.residents.title} 
        subtitle={t.residents.subtitle}
      />
      
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.residents.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Tabs defaultValue="owners" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="owners">{t.residents.owners} ({owners?.length || 0})</TabsTrigger>
              <TabsTrigger value="tenants">{t.residents.tenants} ({tenants?.length || 0})</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="owners" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => { setEditOwner(null); setOwnerFormOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                {t.residents.addOwner}
              </Button>
            </div>
            
            {loadingOwners ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40" />)}
              </div>
            ) : filteredOwners.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>{t.common.noData}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredOwners.map((owner: any) => {
                  const flat = getFlat(owner.flat_id);
                  return (
                    <Card key={owner.id} className="stat-card border-0">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{owner.name}</CardTitle>
                            <CardDescription className="flex items-center gap-1 mt-1">
                              <Building2 className="h-3 w-3" />
                              {flat?.flat_number || t.residents.flatNotAssigned}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                              {t.flats.statusOwner}
                            </Badge>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditOwner(owner); setOwnerFormOpen(true); }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteOwnerModal(owner.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        {owner.email && (
                          <p className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-3.5 w-3.5" /> {owner.email}
                          </p>
                        )}
                        <p className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" /> {owner.phone}
                        </p>
                        <p className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" /> {t.residents.ownershipSince}: {new Date(owner.ownership_start).toLocaleDateString(locale)}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tenants" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => { setEditTenant(null); setTenantFormOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                {t.residents.addTenant}
              </Button>
            </div>
            
            {loadingTenants ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40" />)}
              </div>
            ) : filteredTenants.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>{t.common.noData}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredTenants.map((tenant: any) => {
                  const flat = getFlat(tenant.flat_id);
                  return (
                    <Card key={tenant.id} className="stat-card border-0">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{tenant.name}</CardTitle>
                            <CardDescription className="flex items-center gap-1 mt-1">
                              <Building2 className="h-3 w-3" />
                              {flat?.flat_number || t.residents.flatNotAssigned}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                              {t.flats.statusTenant}
                            </Badge>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditTenant(tenant); setTenantFormOpen(true); }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTenantModal(tenant.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        {tenant.email && (
                          <p className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-3.5 w-3.5" /> {tenant.email}
                          </p>
                        )}
                        <p className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" /> {tenant.phone}
                        </p>
                        <div className="pt-2 border-t">
                          <p className="font-medium text-foreground">
                            {formatBDT(tenant.rent_amount)}{t.common.perMonth}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t.residents.rentStarted}: {new Date(tenant.start_date).toLocaleDateString(locale)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <OwnerForm open={ownerFormOpen} onOpenChange={setOwnerFormOpen} editData={editOwner} />
      <TenantForm open={tenantFormOpen} onOpenChange={setTenantFormOpen} editData={editTenant} />

      <AlertDialog open={!!deleteOwnerModal} onOpenChange={() => setDeleteOwnerModal(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.common.confirmDelete}</AlertDialogTitle>
            <AlertDialogDescription>{t.common.deleteWarning}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOwner} className="bg-destructive">{t.common.delete}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTenantModal} onOpenChange={() => setDeleteTenantModal(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.common.confirmDelete}</AlertDialogTitle>
            <AlertDialogDescription>{t.common.deleteWarning}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTenant} className="bg-destructive">{t.common.delete}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default Residents;