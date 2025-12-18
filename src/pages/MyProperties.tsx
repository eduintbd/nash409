import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useFlats, useCreateFlat, useUpdateFlat } from '@/hooks/useFlats';
import { useMyOwnerFlats, useAddOwnerFlat, useRemoveOwnerFlat } from '@/hooks/useOwnerFlats';
import { useTenants, useDeleteTenant } from '@/hooks/useTenants';
import { useOwners } from '@/hooks/useOwners';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Plus, Pencil, Trash2, Home, BarChart3, Users, UserPlus, Mail, Phone, Calendar, FileText, Send } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { PropertyAnalytics } from '@/components/dashboard/PropertyAnalytics';
import { TenantForm } from '@/components/forms/TenantForm';
import { formatBDT } from '@/lib/currency';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function MyProperties() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { data: allFlats = [] } = useFlats();
  const { data: ownerFlats = [], isLoading } = useMyOwnerFlats(user?.id);
  const { data: tenants = [] } = useTenants();
  const { data: owners = [] } = useOwners();
  const createFlat = useCreateFlat();
  const updateFlat = useUpdateFlat();
  const addOwnerFlat = useAddOwnerFlat();
  const removeOwnerFlat = useRemoveOwnerFlat();
  const deleteTenant = useDeleteTenant();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddExistingDialog, setShowAddExistingDialog] = useState(false);
  const [deleteFlat, setDeleteFlat] = useState<any>(null);
  const [editingFlat, setEditingFlat] = useState<any>(null);
  const [tenantFormOpen, setTenantFormOpen] = useState(false);
  const [editTenant, setEditTenant] = useState<any>(null);
  const [deleteTenantId, setDeleteTenantId] = useState<string | null>(null);
  const [selectedFlatForTenant, setSelectedFlatForTenant] = useState<string>('');
  const [sendingAgreement, setSendingAgreement] = useState<string | null>(null);
  const [newFlatData, setNewFlatData] = useState({
    flat_number: '',
    building_name: '',
    floor: 1,
    size: 1200,
    parking_spot: '',
    status: 'owner-occupied' as const,
  });

  const t = {
    title: language === 'bn' ? 'আমার সম্পত্তি' : 'My Properties',
    subtitle: language === 'bn' ? 'আপনার সকল সম্পত্তি পরিচালনা করুন' : 'Manage all your properties',
    addNew: language === 'bn' ? 'নতুন সম্পত্তি যোগ করুন' : 'Add New Property',
    addExisting: language === 'bn' ? 'বিদ্যমান ফ্ল্যাট যোগ করুন' : 'Add Existing Flat',
    flatNumber: language === 'bn' ? 'ফ্ল্যাট নম্বর' : 'Flat Number',
    floor: language === 'bn' ? 'তলা' : 'Floor',
    size: language === 'bn' ? 'আকার (বর্গফুট)' : 'Size (sq ft)',
    parking: language === 'bn' ? 'পার্কিং' : 'Parking',
    buildingName: language === 'bn' ? 'বিল্ডিং/লোকেশন' : 'Building/Location',
    status: language === 'bn' ? 'অবস্থা' : 'Status',
    actions: language === 'bn' ? 'কার্যক্রম' : 'Actions',
    save: language === 'bn' ? 'সংরক্ষণ করুন' : 'Save',
    cancel: language === 'bn' ? 'বাতিল' : 'Cancel',
    edit: language === 'bn' ? 'সম্পাদনা' : 'Edit',
    remove: language === 'bn' ? 'সরান' : 'Remove',
    totalProperties: language === 'bn' ? 'মোট সম্পত্তি' : 'Total Properties',
    totalSize: language === 'bn' ? 'মোট আকার' : 'Total Size',
    occupiedByOwner: language === 'bn' ? 'মালিক থাকেন' : 'Owner Occupied',
    rentedOut: language === 'bn' ? 'ভাড়া দেওয়া' : 'Rented Out',
    vacant: language === 'bn' ? 'খালি' : 'Vacant',
    noProperties: language === 'bn' ? 'কোনো সম্পত্তি নেই' : 'No properties found',
    selectFlat: language === 'bn' ? 'ফ্ল্যাট নির্বাচন করুন' : 'Select Flat',
    confirmRemove: language === 'bn' ? 'সরানো নিশ্চিত করুন' : 'Confirm Remove',
    removeMessage: language === 'bn' ? 'আপনি কি এই সম্পত্তি সরাতে চান?' : 'Are you sure you want to remove this property from your portfolio?',
    sqft: language === 'bn' ? 'বর্গফুট' : 'sq ft',
    myProperties: language === 'bn' ? 'আমার সম্পত্তি' : 'My Properties',
    analytics: language === 'bn' ? 'বিশ্লেষণ' : 'Analytics',
    tenants: language === 'bn' ? 'ভাড়াটিয়া' : 'Tenants',
    tenant: language === 'bn' ? 'ভাড়াটিয়া' : 'Tenant',
    addTenant: language === 'bn' ? 'ভাড়াটিয়া যোগ করুন' : 'Add Tenant',
    noTenant: language === 'bn' ? 'কোন ভাড়াটিয়া নেই' : 'No tenant',
    rentAmount: language === 'bn' ? 'ভাড়া' : 'Rent',
    startDate: language === 'bn' ? 'শুরু' : 'Start Date',
    perMonth: language === 'bn' ? '/মাস' : '/month',
    confirmDelete: language === 'bn' ? 'মুছে ফেলা নিশ্চিত করুন' : 'Confirm Delete',
    deleteWarning: language === 'bn' ? 'এই ভাড়াটিয়া মুছে ফেলতে চান?' : 'Are you sure you want to remove this tenant?',
    sendAgreement: language === 'bn' ? 'চুক্তি পাঠান' : 'Send Agreement',
    agreementStatus: language === 'bn' ? 'চুক্তির অবস্থা' : 'Agreement Status',
    pending: language === 'bn' ? 'অপেক্ষমাণ' : 'Pending',
    agreed: language === 'bn' ? 'সম্মত' : 'Agreed',
    sent: language === 'bn' ? 'পাঠানো হয়েছে' : 'Sent',
  };

  // Get owner ID from ownerFlats data
  const myOwnerRecord = useMemo(() => {
    return owners?.find(o => o.user_id === user?.id);
  }, [owners, user?.id]);
  
  const ownerId = ownerFlats.length > 0 ? ownerFlats[0].owner_id : myOwnerRecord?.id;

  // Filter out flats already owned by this owner
  const ownedFlatIds = ownerFlats.map((of: any) => of.flat_id);
  const availableFlats = allFlats.filter(flat => 
    !ownedFlatIds.includes(flat.id) && flat.status === 'vacant'
  );

  // Get tenants for owned flats
  const myTenants = useMemo(() => {
    return tenants.filter(t => ownedFlatIds.includes(t.flat_id));
  }, [tenants, ownedFlatIds]);

  // Calculate summary
  const totalProperties = ownerFlats.length;
  const totalSize = ownerFlats.reduce((sum: number, of: any) => sum + (of.flats?.size || 0), 0);
  const ownerOccupied = ownerFlats.filter((of: any) => of.flats?.status === 'owner-occupied').length;
  const rented = ownerFlats.filter((of: any) => of.flats?.status === 'tenant').length;
  const vacantCount = ownerFlats.filter((of: any) => of.flats?.status === 'vacant').length;

  const handleCreateFlat = async () => {
    if (!newFlatData.flat_number || !ownerId) return;
    
    try {
      const flat = await createFlat.mutateAsync({
        flat_number: newFlatData.flat_number,
        building_name: newFlatData.building_name || null,
        floor: newFlatData.floor,
        size: newFlatData.size,
        parking_spot: newFlatData.parking_spot || null,
        status: newFlatData.status,
      });
      
      if (flat) {
        await addOwnerFlat.mutateAsync({ ownerId, flatId: flat.id });
      }
      
      setShowAddDialog(false);
      setNewFlatData({ flat_number: '', building_name: '', floor: 1, size: 1200, parking_spot: '', status: 'owner-occupied' });
    } catch (error) {
      console.error('Error creating flat:', error);
    }
  };

  const handleAddExistingFlat = async (flatId: string) => {
    if (!ownerId) return;
    await addOwnerFlat.mutateAsync({ ownerId, flatId });
    setShowAddExistingDialog(false);
  };

  const handleUpdateFlat = async () => {
    if (!editingFlat) return;
    await updateFlat.mutateAsync({
      id: editingFlat.id,
      flat_number: editingFlat.flat_number,
      building_name: editingFlat.building_name,
      floor: editingFlat.floor,
      size: editingFlat.size,
      parking_spot: editingFlat.parking_spot,
      status: editingFlat.status,
    });
    setShowEditDialog(false);
    setEditingFlat(null);
  };

  const handleRemoveFlat = async () => {
    if (!deleteFlat || !ownerId) return;
    await removeOwnerFlat.mutateAsync({ ownerId, flatId: deleteFlat.flat_id });
    setDeleteFlat(null);
  };

  const handleDeleteTenant = async () => {
    if (deleteTenantId) {
      await deleteTenant.mutateAsync(deleteTenantId);
      setDeleteTenantId(null);
    }
  };

  const handleSendAgreement = async (tenant: any) => {
    if (!tenant.email) {
      toast.error(language === 'bn' ? 'ভাড়াটিয়ার ইমেইল নেই' : 'Tenant has no email address');
      return;
    }

    setSendingAgreement(tenant.id);
    try {
      const { error } = await supabase.functions.invoke('send-tenant-agreement', {
        body: { tenantId: tenant.id }
      });

      if (error) throw error;
      toast.success(language === 'bn' ? 'চুক্তি পাঠানো হয়েছে' : 'Agreement sent successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send agreement');
    } finally {
      setSendingAgreement(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'owner-occupied':
        return <Badge className="bg-primary/10 text-primary">{t.occupiedByOwner}</Badge>;
      case 'tenant':
        return <Badge className="bg-green-500/10 text-green-600">{t.rentedOut}</Badge>;
      default:
        return <Badge variant="secondary">{t.vacant}</Badge>;
    }
  };

  const getAgreementBadge = (tenant: any) => {
    if (tenant.agreement_status === 'agreed') {
      return <Badge className="bg-success/10 text-success">{t.agreed}</Badge>;
    }
    if (tenant.invitation_sent_at) {
      return <Badge className="bg-warning/10 text-warning">{t.sent}</Badge>;
    }
    return <Badge variant="secondary">{t.pending}</Badge>;
  };

  const getTenantForFlat = (flatId: string) => {
    return tenants.find(t => t.flat_id === flatId);
  };

  // Extract flats for analytics
  const ownerFlatsData = ownerFlats.map((of: any) => of.flats).filter(Boolean);

  const locale = language === 'bn' ? 'bn-BD' : 'en-US';

  return (
    <MainLayout>
      <Header 
        title={t.title}
        subtitle={t.subtitle}
      />

      <div className="p-6 space-y-6 animate-fade-in">
        <Tabs defaultValue="my-properties" className="space-y-6">
          <TabsList>
            <TabsTrigger value="my-properties">
              <Building2 className="h-4 w-4 mr-2" />
              {t.myProperties}
            </TabsTrigger>
            <TabsTrigger value="tenants">
              <Users className="h-4 w-4 mr-2" />
              {t.tenants}
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              {t.analytics}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-properties" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{totalProperties}</p>
                      <p className="text-sm text-muted-foreground">{t.totalProperties}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Home className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{totalSize.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">{t.totalSize} ({t.sqft})</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-xl font-bold text-primary">{ownerOccupied}</p>
                    <p className="text-sm text-muted-foreground">{t.occupiedByOwner}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-xl font-bold text-green-600">{rented}</p>
                    <p className="text-sm text-muted-foreground">{t.rentedOut}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    {t.addNew}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t.addNew}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label>{t.buildingName}</Label>
                      <Input
                        value={newFlatData.building_name}
                        onChange={(e) => setNewFlatData({ ...newFlatData, building_name: e.target.value })}
                        placeholder="e.g., Green Valley Tower, Dhaka"
                      />
                    </div>
                    <div>
                      <Label>{t.flatNumber}</Label>
                      <Input
                        value={newFlatData.flat_number}
                        onChange={(e) => setNewFlatData({ ...newFlatData, flat_number: e.target.value })}
                        placeholder="e.g., 3A"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{t.floor}</Label>
                        <Input
                          type="number"
                          value={newFlatData.floor}
                          onChange={(e) => setNewFlatData({ ...newFlatData, floor: parseInt(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label>{t.size}</Label>
                        <Input
                          type="number"
                          value={newFlatData.size}
                          onChange={(e) => setNewFlatData({ ...newFlatData, size: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>{t.parking}</Label>
                      <Input
                        value={newFlatData.parking_spot}
                        onChange={(e) => setNewFlatData({ ...newFlatData, parking_spot: e.target.value })}
                        placeholder="e.g., P-3"
                      />
                    </div>
                    <div>
                      <Label>{t.status}</Label>
                      <Select
                        value={newFlatData.status}
                        onValueChange={(value: any) => setNewFlatData({ ...newFlatData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="owner-occupied">{t.occupiedByOwner}</SelectItem>
                          <SelectItem value="vacant">{t.vacant}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowAddDialog(false)}>{t.cancel}</Button>
                      <Button onClick={handleCreateFlat} disabled={!newFlatData.flat_number}>
                        {t.save}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {availableFlats.length > 0 && (
                <Dialog open={showAddExistingDialog} onOpenChange={setShowAddExistingDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Building2 className="h-4 w-4 mr-2" />
                      {t.addExisting}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t.addExisting}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <Label>{t.selectFlat}</Label>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {availableFlats.map((flat) => (
                          <Button
                            key={flat.id}
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => handleAddExistingFlat(flat.id)}
                          >
                            <Building2 className="h-4 w-4 mr-2" />
                            {flat.flat_number} - Floor {flat.floor} ({flat.size} {t.sqft})
                          </Button>
                        ))}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Properties Table */}
            <Card>
              <CardHeader>
                <CardTitle>{t.title}</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-center py-8 text-muted-foreground">Loading...</p>
                ) : ownerFlats.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">{t.noProperties}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t.buildingName}</TableHead>
                          <TableHead>{t.flatNumber}</TableHead>
                          <TableHead>{t.floor}</TableHead>
                          <TableHead>{t.size}</TableHead>
                          <TableHead>{t.tenant}</TableHead>
                          <TableHead>{t.status}</TableHead>
                          <TableHead className="text-right">{t.actions}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ownerFlats.map((ownerFlat: any) => {
                          const tenant = getTenantForFlat(ownerFlat.flat_id);
                          return (
                            <TableRow key={ownerFlat.id}>
                              <TableCell className="font-medium">{ownerFlat.flats?.building_name || '-'}</TableCell>
                              <TableCell>{ownerFlat.flats?.flat_number}</TableCell>
                              <TableCell>{ownerFlat.flats?.floor}</TableCell>
                              <TableCell>{ownerFlat.flats?.size?.toLocaleString()} {t.sqft}</TableCell>
                              <TableCell>
                                {tenant ? (
                                  <div className="text-sm">
                                    <p className="font-medium">{tenant.name}</p>
                                    <p className="text-muted-foreground text-xs">{formatBDT(tenant.rent_amount)}{t.perMonth}</p>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">{t.noTenant}</span>
                                )}
                              </TableCell>
                              <TableCell>{getStatusBadge(ownerFlat.flats?.status)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setEditingFlat(ownerFlat.flats);
                                      setShowEditDialog(true);
                                    }}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setDeleteFlat(ownerFlat)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tenants Tab */}
          <TabsContent value="tenants" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">{t.tenants}</h2>
              <Button onClick={() => { setEditTenant(null); setSelectedFlatForTenant(''); setTenantFormOpen(true); }}>
                <UserPlus className="h-4 w-4 mr-2" />
                {t.addTenant}
              </Button>
            </div>

            {myTenants.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <UserPlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground mb-4">{t.noTenant}</p>
                  <Button onClick={() => { setEditTenant(null); setTenantFormOpen(true); }}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    {t.addTenant}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {myTenants.map((tenant: any) => {
                  const flat = allFlats.find(f => f.id === tenant.flat_id);
                  return (
                    <Card key={tenant.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{tenant.name}</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1">
                              <Home className="h-3 w-3" />
                              {flat?.flat_number || '-'}
                              {flat?.building_name && ` • ${flat.building_name}`}
                            </CardDescription>
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => { setEditTenant(tenant); setTenantFormOpen(true); }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive"
                              onClick={() => setDeleteTenantId(tenant.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {tenant.email && (
                          <p className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-4 w-4" /> {tenant.email}
                          </p>
                        )}
                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" /> {tenant.phone}
                        </p>
                        
                        <div className="pt-3 border-t space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">{t.rentAmount}:</span>
                            <span className="font-medium">{formatBDT(tenant.rent_amount)}{t.perMonth}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">{t.startDate}:</span>
                            <span className="text-sm flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(tenant.start_date).toLocaleDateString(locale)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">{t.agreementStatus}:</span>
                            {getAgreementBadge(tenant)}
                          </div>
                        </div>

                        {/* Agreement Actions */}
                        <div className="pt-3 border-t">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={() => handleSendAgreement(tenant)}
                            disabled={sendingAgreement === tenant.id || !tenant.email}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            {sendingAgreement === tenant.id 
                              ? (language === 'bn' ? 'পাঠানো হচ্ছে...' : 'Sending...') 
                              : t.sendAgreement
                            }
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            <PropertyAnalytics flats={ownerFlatsData} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Flat Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.edit}</DialogTitle>
          </DialogHeader>
          {editingFlat && (
            <div className="space-y-4 py-4">
              <div>
                <Label>{t.buildingName}</Label>
                <Input
                  value={editingFlat.building_name || ''}
                  onChange={(e) => setEditingFlat({ ...editingFlat, building_name: e.target.value })}
                  placeholder="e.g., Green Valley Tower, Dhaka"
                />
              </div>
              <div>
                <Label>{t.flatNumber}</Label>
                <Input
                  value={editingFlat.flat_number}
                  onChange={(e) => setEditingFlat({ ...editingFlat, flat_number: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t.floor}</Label>
                  <Input
                    type="number"
                    value={editingFlat.floor}
                    onChange={(e) => setEditingFlat({ ...editingFlat, floor: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>{t.size}</Label>
                  <Input
                    type="number"
                    value={editingFlat.size}
                    onChange={(e) => setEditingFlat({ ...editingFlat, size: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <Label>{t.parking}</Label>
                <Input
                  value={editingFlat.parking_spot || ''}
                  onChange={(e) => setEditingFlat({ ...editingFlat, parking_spot: e.target.value })}
                />
              </div>
              <div>
                <Label>{t.status}</Label>
                <Select
                  value={editingFlat.status}
                  onValueChange={(value) => setEditingFlat({ ...editingFlat, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner-occupied">{t.occupiedByOwner}</SelectItem>
                    <SelectItem value="tenant">{t.rentedOut}</SelectItem>
                    <SelectItem value="vacant">{t.vacant}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>{t.cancel}</Button>
                <Button onClick={handleUpdateFlat}>{t.save}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Remove Property Confirmation */}
      <AlertDialog open={!!deleteFlat} onOpenChange={() => setDeleteFlat(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.confirmRemove}</AlertDialogTitle>
            <AlertDialogDescription>{t.removeMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveFlat}>{t.remove}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Tenant Confirmation */}
      <AlertDialog open={!!deleteTenantId} onOpenChange={() => setDeleteTenantId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.confirmDelete}</AlertDialogTitle>
            <AlertDialogDescription>{t.deleteWarning}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTenant} className="bg-destructive">
              {t.remove}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Tenant Form */}
      <TenantForm 
        open={tenantFormOpen} 
        onOpenChange={setTenantFormOpen} 
        editData={editTenant}
        preselectedFlatId={selectedFlatForTenant}
      />
    </MainLayout>
  );
}
