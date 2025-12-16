import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOwners } from '@/hooks/useOwners';
import { useTenants, useDeleteTenant } from '@/hooks/useTenants';
import { useFlats, Flat } from '@/hooks/useFlats';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TenantForm } from '@/components/forms/TenantForm';
import { Skeleton } from '@/components/ui/skeleton';
import { formatBDT } from '@/lib/currency';
import { Mail, Phone, Calendar, Edit, Trash2, UserPlus, Home } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MyTenant = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { data: owners, isLoading: loadingOwners } = useOwners();
  const { data: tenants, isLoading: loadingTenants } = useTenants();
  const { data: flats } = useFlats();
  const deleteTenant = useDeleteTenant();

  const [tenantFormOpen, setTenantFormOpen] = useState(false);
  const [editTenant, setEditTenant] = useState<any>(null);
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [selectedFlatId, setSelectedFlatId] = useState<string | null>(null);

  // Find the owner record for the current user
  const myOwnerRecord = useMemo(() => {
    return owners?.find(o => o.user_id === user?.id);
  }, [owners, user?.id]);

  // Fetch all flats owned by this owner via owner_flats junction table
  const { data: ownerFlats, isLoading: loadingOwnerFlats } = useQuery({
    queryKey: ['owner_flats', myOwnerRecord?.id],
    queryFn: async () => {
      if (!myOwnerRecord?.id) return [];
      const { data, error } = await supabase
        .from('owner_flats')
        .select('flat_id')
        .eq('owner_id', myOwnerRecord.id);
      if (error) throw error;
      return data?.map(of => of.flat_id) || [];
    },
    enabled: !!myOwnerRecord?.id,
  });

  // Get flat details for owned flats
  const myFlats = useMemo(() => {
    if (!ownerFlats || !flats) return [];
    return flats.filter(f => ownerFlats.includes(f.id));
  }, [flats, ownerFlats]);

  // Set default selected flat
  useMemo(() => {
    if (myFlats.length > 0 && !selectedFlatId) {
      setSelectedFlatId(myFlats[0].id);
    }
  }, [myFlats, selectedFlatId]);

  const selectedFlat = useMemo(() => {
    return myFlats.find(f => f.id === selectedFlatId);
  }, [myFlats, selectedFlatId]);

  // Find tenant for selected flat
  const myTenant = useMemo(() => {
    if (!selectedFlatId) return null;
    return tenants?.find(t => t.flat_id === selectedFlatId);
  }, [tenants, selectedFlatId]);

  const locale = language === 'bn' ? 'bn-BD' : 'en-US';

  const handleDeleteTenant = async () => {
    if (deleteModal) {
      await deleteTenant.mutateAsync(deleteModal);
      setDeleteModal(null);
    }
  };

  const t = {
    title: language === 'bn' ? 'আমার ভাড়াটিয়া' : 'My Tenant',
    subtitle: language === 'bn' ? 'আপনার ফ্ল্যাটের ভাড়াটিয়া পরিচালনা করুন' : 'Manage your flat tenant',
    noTenant: language === 'bn' ? 'কোন ভাড়াটিয়া নেই' : 'No tenant assigned',
    addTenant: language === 'bn' ? 'ভাড়াটিয়া যোগ করুন' : 'Add Tenant',
    editTenant: language === 'bn' ? 'ভাড়াটিয়া সম্পাদনা করুন' : 'Edit Tenant',
    removeTenant: language === 'bn' ? 'ভাড়াটিয়া সরান' : 'Remove Tenant',
    tenant: language === 'bn' ? 'ভাড়াটিয়া' : 'Tenant',
    rentAmount: language === 'bn' ? 'ভাড়ার পরিমাণ' : 'Rent Amount',
    startDate: language === 'bn' ? 'শুরুর তারিখ' : 'Start Date',
    endDate: language === 'bn' ? 'শেষ তারিখ' : 'End Date',
    notSet: language === 'bn' ? 'নির্ধারিত নয়' : 'Not set',
    flat: language === 'bn' ? 'ফ্ল্যাট' : 'Flat',
    noFlat: language === 'bn' ? 'কোন ফ্ল্যাট নির্ধারিত নেই' : 'No flat assigned to your account',
    confirmDelete: language === 'bn' ? 'মুছে ফেলা নিশ্চিত করুন' : 'Confirm Delete',
    deleteWarning: language === 'bn' ? 'এই ভাড়াটিয়া মুছে ফেলতে চান?' : 'Are you sure you want to remove this tenant?',
    cancel: language === 'bn' ? 'বাতিল' : 'Cancel',
    delete: language === 'bn' ? 'মুছুন' : 'Delete',
    perMonth: language === 'bn' ? '/মাস' : '/month',
    selectFlat: language === 'bn' ? 'ফ্ল্যাট নির্বাচন করুন' : 'Select Flat',
  };

  const isLoading = loadingOwners || loadingTenants || loadingOwnerFlats;

  if (isLoading) {
    return (
      <MainLayout>
        <Header title={t.title} subtitle={t.subtitle} />
        <div className="p-6">
          <Skeleton className="h-64 w-full max-w-lg" />
        </div>
      </MainLayout>
    );
  }

  if (!myOwnerRecord || myFlats.length === 0) {
    return (
      <MainLayout>
        <Header title={t.title} subtitle={t.subtitle} />
        <div className="p-6">
          <Card className="max-w-lg">
            <CardContent className="pt-6 text-center text-muted-foreground">
              <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t.noFlat}</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Header title={t.title} subtitle={t.subtitle} />
      
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Flat Selector */}
        <Card className="max-w-lg">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              {myFlats.length > 1 ? (
                <Select value={selectedFlatId || ''} onValueChange={setSelectedFlatId}>
                  <SelectTrigger className="w-[180px] h-8">
                    <SelectValue placeholder={t.selectFlat} />
                  </SelectTrigger>
                  <SelectContent>
                    {myFlats.map((flat) => (
                      <SelectItem key={flat.id} value={flat.id}>
                        {t.flat} {flat.flat_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span>{t.flat}: {selectedFlat?.flat_number}</span>
              )}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Tenant Info */}
        {myTenant ? (
          <Card className="max-w-lg">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{myTenant.name}</CardTitle>
                  <CardDescription>
                    <Badge variant="outline" className="mt-1 bg-success/10 text-success border-success/20">
                      {t.tenant}
                    </Badge>
                  </CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => { setEditTenant(myTenant); setTenantFormOpen(true); }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive"
                    onClick={() => setDeleteModal(myTenant.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {myTenant.email && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" /> {myTenant.email}
                </p>
              )}
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" /> {myTenant.phone}
              </p>
              
              <div className="pt-3 border-t space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t.rentAmount}:</span>
                  <span className="font-medium">{formatBDT(myTenant.rent_amount)}{t.perMonth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t.startDate}:</span>
                  <span className="text-sm flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(myTenant.start_date).toLocaleDateString(locale)}
                  </span>
                </div>
                {myTenant.end_date && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t.endDate}:</span>
                    <span className="text-sm">
                      {new Date(myTenant.end_date).toLocaleDateString(locale)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="max-w-lg">
            <CardContent className="pt-6 text-center">
              <UserPlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground mb-4">{t.noTenant}</p>
              <Button onClick={() => { setEditTenant(null); setTenantFormOpen(true); }}>
                <UserPlus className="h-4 w-4 mr-2" />
                {t.addTenant}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <TenantForm 
        open={tenantFormOpen} 
        onOpenChange={setTenantFormOpen} 
        editData={editTenant}
        preselectedFlatId={selectedFlatId || ''}
      />

      <AlertDialog open={!!deleteModal} onOpenChange={() => setDeleteModal(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.confirmDelete}</AlertDialogTitle>
            <AlertDialogDescription>{t.deleteWarning}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTenant} className="bg-destructive">
              {t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default MyTenant;
