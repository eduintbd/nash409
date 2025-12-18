import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { useFlats, useUpdateFlat, useCreateFlat, useDeleteFlat, useReorderFlats, Flat } from '@/hooks/useFlats';
import { useOwners, useUpdateOwner, Owner } from '@/hooks/useOwners';
import { useTenants, useUpdateTenant, Tenant } from '@/hooks/useTenants';
import { useAllOwnerFlats, useRemoveOwnerFlat } from '@/hooks/useOwnerFlats';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Search, Building2, User, Phone, Mail, Car, Plus, Pencil, Trash2, 
  MapPin, Home, BarChart3, GripVertical, Save, X, Shield, Unlink 
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatBDT } from '@/lib/currency';
import FlatForm from '@/components/forms/FlatForm';
import { PropertyAnalytics } from '@/components/dashboard/PropertyAnalytics';
import { OwnerForm } from '@/components/forms/OwnerForm';
import { PropertyForm } from '@/components/forms/PropertyForm';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableRow } from '@/components/flats/SortableRow';

const Flats = () => {
  const { t, language } = useLanguage();
  const { isAdmin } = useAuth();
  const { data: flats, isLoading } = useFlats();
  const { data: owners } = useOwners();
  const { data: tenants } = useTenants();
  const { data: allOwnerFlats, isLoading: ownerFlatsLoading } = useAllOwnerFlats();
  const updateFlat = useUpdateFlat();
  const createFlat = useCreateFlat();
  const deleteFlat = useDeleteFlat();
  const reorderFlats = useReorderFlats();
  const removeOwnerFlat = useRemoveOwnerFlat();
  const updateOwner = useUpdateOwner();
  const updateTenant = useUpdateTenant();
  
  const [activeTab, setActiveTab] = useState('all-flats');
  const [search, setSearch] = useState('');
  const [ownerSearch, setOwnerSearch] = useState('');
  const [selectedFlat, setSelectedFlat] = useState<Flat | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editFlat, setEditFlat] = useState<Flat | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Flat | null>(null);
  const [showOwnerForm, setShowOwnerForm] = useState(false);
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [editOwnerData, setEditOwnerData] = useState<any>(null);
  const [editOwnerFlatIds, setEditOwnerFlatIds] = useState<string[]>([]);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [unlinkConfirm, setUnlinkConfirm] = useState<{ ownerId: string; flatId: string; flatNumber: string } | null>(null);
  const [orderedFlats, setOrderedFlats] = useState<Flat[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
    const sourceFlats = isReorderMode ? orderedFlats : flats;
    return sourceFlats?.filter(flat => 
      flat.building_name && // Only include flats with a building name
      (flat.flat_number.toLowerCase().includes(search.toLowerCase()) ||
      flat.building_name.toLowerCase().includes(search.toLowerCase()))
    ) || [];
  }, [flats, orderedFlats, isReorderMode, search]);

  // Owner-occupied flats filter for "Owner Properties" tab
  const ownerOccupiedFlats = useMemo(() => {
    return flats?.filter(flat => 
      flat.building_name && flat.status === 'owner-occupied'
    ) || [];
  }, [flats]);

  // Group owner flats by owner for admin view
  const groupedOwnerFlats = allOwnerFlats?.reduce((acc: any, item: any) => {
    const ownerId = item.owner_id;
    if (!acc[ownerId]) {
      acc[ownerId] = {
        owner: item.owners,
        flats: []
      };
    }
    acc[ownerId].flats.push(item.flats);
    return acc;
  }, {}) || {};

  const filteredOwnerGroups = Object.entries(groupedOwnerFlats).filter(([_, group]: [string, any]) => {
    const searchLower = ownerSearch.toLowerCase();
    return group.owner?.name?.toLowerCase().includes(searchLower) ||
           group.flats.some((f: any) => 
             f?.flat_number?.toLowerCase().includes(searchLower) ||
             f?.building_name?.toLowerCase().includes(searchLower)
           );
  });

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
      } else {
        await createFlat.mutateAsync(data.flat as Omit<Flat, 'id' | 'created_at' | 'updated_at' | 'display_order'>);
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

  const handleDelete = (flat: Flat) => {
    if (flat.status !== 'vacant') {
      return; // Only allow deleting vacant flats
    }
    setDeleteConfirm(flat);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteFlat.mutate(deleteConfirm.id, {
        onSuccess: () => setDeleteConfirm(null)
      });
    }
  };

  const startReorderMode = () => {
    if (flats) {
      setOrderedFlats([...flats].filter(f => f.building_name));
      setIsReorderMode(true);
    }
  };

  const cancelReorderMode = () => {
    setIsReorderMode(false);
    setOrderedFlats([]);
  };

  const saveOrder = () => {
    const updates = orderedFlats.map((flat, index) => ({
      id: flat.id,
      display_order: index + 1,
    }));
    reorderFlats.mutate(updates, {
      onSuccess: () => {
        setIsReorderMode(false);
        setOrderedFlats([]);
      },
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setOrderedFlats((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
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
              <TabsTrigger value="all-flats">
                <Building2 className="h-4 w-4 mr-2" />
                {language === 'bn' ? 'সকল ফ্ল্যাট' : 'All Flats'}
              </TabsTrigger>
              <TabsTrigger value="owner-properties">
                <User className="h-4 w-4 mr-2" />
                {language === 'bn' ? 'মালিকদের সম্পত্তি' : 'Owner Properties'}
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart3 className="h-4 w-4 mr-2" />
                {language === 'bn' ? 'বিশ্লেষণ' : 'Analytics'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all-flats" className="space-y-4">
              {/* Actions Bar */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t.flats.searchPlaceholder}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                    disabled={isReorderMode}
                  />
                </div>
                <div className="flex gap-2">
                  {isReorderMode ? (
                    <>
                      <Button variant="outline" onClick={cancelReorderMode}>
                        <X className="h-4 w-4 mr-2" />
                        {language === 'bn' ? 'বাতিল' : 'Cancel'}
                      </Button>
                      <Button onClick={saveOrder} disabled={reorderFlats.isPending}>
                        <Save className="h-4 w-4 mr-2" />
                        {language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Order'}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" onClick={startReorderMode}>
                        <GripVertical className="h-4 w-4 mr-2" />
                        {language === 'bn' ? 'পুনর্বিন্যাস' : 'Reorder'}
                      </Button>
                      <Button onClick={() => { setEditFlat(null); setShowForm(true); }}>
                        <Plus className="h-4 w-4 mr-2" />
                        {language === 'bn' ? 'নতুন ফ্ল্যাট' : 'Add Flat'}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Flats Table */}
              <div className="stat-card overflow-hidden">
                {isLoading ? (
                  <div className="p-4 space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12" />
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <Table>
                        <TableHeader>
                          <TableRow className="table-header">
                            {isReorderMode && <TableHead className="w-10"></TableHead>}
                            <TableHead className="min-w-[120px]">{language === 'bn' ? 'বিল্ডিং' : 'Building'}</TableHead>
                            <TableHead className="w-24">{t.flats.flatNo}</TableHead>
                            <TableHead className="min-w-[100px]">{t.flats.owner}</TableHead>
                            <TableHead className="min-w-[100px]">{language === 'bn' ? 'ভাড়াটিয়া' : 'Tenant'}</TableHead>
                            <TableHead className="w-16 text-center">{t.flats.floor}</TableHead>
                            <TableHead className="w-20 text-right">{t.flats.size}</TableHead>
                            <TableHead className="w-28">{t.common.status}</TableHead>
                            <TableHead className="min-w-[120px]">{t.flats.contact}</TableHead>
                            <TableHead className="w-20">{t.flats.parking}</TableHead>
                            <TableHead className="text-right w-32">{t.common.actions}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <SortableContext
                          items={filteredFlats.map(f => f.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <TableBody>
                            {filteredFlats.map((flat) => (
                              <SortableRow
                                key={flat.id}
                                flat={flat}
                                owner={getOwner(flat.id)}
                                tenant={getTenant(flat.id)}
                                isAdmin={isAdmin}
                                isReorderMode={isReorderMode}
                                statusColors={statusColors}
                                statusLabels={statusLabels}
                                onDetails={setSelectedFlat}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                t={t}
                              />
                            ))}
                          </TableBody>
                        </SortableContext>
                      </Table>
                    </DndContext>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="owner-properties" className="space-y-4">
              {/* Search and Add New Property */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={language === 'bn' ? 'মালিক বা সম্পত্তি খুঁজুন...' : 'Search owner or property...'}
                    value={ownerSearch}
                    onChange={(e) => setOwnerSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button onClick={() => setShowPropertyForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {language === 'bn' ? 'নতুন প্রপার্টি' : 'Add Property'}
                </Button>
              </div>

              {/* Owner Properties Cards */}
              {ownerFlatsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-40" />
                  ))}
                </div>
              ) : filteredOwnerGroups.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    {language === 'bn' ? 'কোনো মালিকের সম্পত্তি পাওয়া যায়নি' : 'No owner properties found'}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredOwnerGroups.map(([ownerId, group]: [string, any]) => (
                    <Card key={ownerId}>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-3 text-lg">
                          <div className="p-2 rounded-full bg-primary/10">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-primary/5 text-primary font-mono">
                                O{group.owner?.owner_number || '?'}
                              </Badge>
                              <p className="font-semibold">{group.owner?.name || 'Unknown Owner'}</p>
                            </div>
                            <div className="flex items-center gap-4 text-sm font-normal text-muted-foreground mt-1">
                              {group.owner?.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" /> {group.owner.phone}
                                </span>
                              )}
                              {group.owner?.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" /> {group.owner.email}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="ml-auto flex items-center gap-2">
                            <Badge variant="secondary">
                              {group.flats.length} {language === 'bn' ? 'টি সম্পত্তি' : 'Properties'}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditOwnerData(group.owner);
                                setEditOwnerFlatIds(group.flats.map((f: any) => f?.id).filter(Boolean));
                                setShowOwnerForm(true);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              {language === 'bn' ? 'নতুন সম্পত্তি যোগ করুন' : 'Add New Property'}
                            </Button>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>{language === 'bn' ? 'বিল্ডিং/লোকেশন' : 'Building/Location'}</TableHead>
                                <TableHead>{t.flats.flatNo}</TableHead>
                                <TableHead>{t.flats.floor}</TableHead>
                                <TableHead>{t.flats.size}</TableHead>
                                <TableHead>{t.common.status}</TableHead>
                                <TableHead>{t.flats.parking}</TableHead>
                                <TableHead className="text-right">{t.common.actions}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {group.flats.map((flat: any) => flat && (
                                <TableRow key={flat.id}>
                                  <TableCell>
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3 text-muted-foreground" />
                                      {flat.building_name || '-'}
                                    </span>
                                  </TableCell>
                                  <TableCell className="font-semibold">{flat.flat_number}</TableCell>
                                  <TableCell>{flat.floor}</TableCell>
                                  <TableCell>{flat.size?.toLocaleString()} sq ft</TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className={statusColors[flat.status as keyof typeof statusColors]}>
                                      {statusLabels[flat.status as keyof typeof statusLabels]}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{flat.parking_spot || '-'}</TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        title={language === 'bn' ? 'সম্পাদনা' : 'Edit Flat'}
                                        onClick={() => {
                                          const fullFlat = flats?.find(f => f.id === flat.id);
                                          if (fullFlat) handleEdit(fullFlat);
                                        }}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        title={language === 'bn' ? 'মালিক থেকে সংযোগ বিচ্ছিন্ন' : 'Unlink from Owner'}
                                        onClick={() => setUnlinkConfirm({ 
                                          ownerId: ownerId, 
                                          flatId: flat.id, 
                                          flatNumber: flat.flat_number 
                                        })}
                                      >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
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
                              <Button variant="ghost" size="sm" onClick={() => setSelectedFlat(flat)}>
                                {t.common.details}
                              </Button>
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
        isLoading={createFlat.isPending || updateFlat.isPending || updateOwner.isPending || updateTenant.isPending}
      />

      {/* Owner Form for editing/adding properties */}
      <OwnerForm
        open={showOwnerForm}
        onOpenChange={(open) => {
          setShowOwnerForm(open);
          if (!open) {
            setEditOwnerData(null);
            setEditOwnerFlatIds([]);
          }
        }}
        editData={editOwnerData}
        existingFlatIds={editOwnerFlatIds}
      />

      {/* Property Form for adding new properties */}
      <PropertyForm
        open={showPropertyForm}
        onOpenChange={setShowPropertyForm}
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
              onClick={confirmDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteConfirm?.status !== 'vacant'}
            >
              {language === 'bn' ? 'মুছুন' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unlink Property from Owner Confirmation */}
      <AlertDialog open={!!unlinkConfirm} onOpenChange={() => setUnlinkConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'bn' ? 'সম্পত্তি সরাতে চান?' : 'Remove Property?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'bn' 
                ? `ফ্ল্যাট ${unlinkConfirm?.flatNumber} এই মালিক থেকে সরানো হবে। ফ্ল্যাটটি ভ্যাকেন্ট হিসেবে চিহ্নিত হবে।`
                : `Flat ${unlinkConfirm?.flatNumber} will be removed from this owner. The flat will be marked as vacant.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === 'bn' ? 'বাতিল' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (unlinkConfirm) {
                  removeOwnerFlat.mutate({ 
                    ownerId: unlinkConfirm.ownerId, 
                    flatId: unlinkConfirm.flatId 
                  });
                  setUnlinkConfirm(null);
                }
              }} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {language === 'bn' ? 'সরান' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default Flats;
