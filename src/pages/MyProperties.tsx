import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useFlats, useCreateFlat, useUpdateFlat } from '@/hooks/useFlats';
import { useMyOwnerFlats, useAddOwnerFlat, useRemoveOwnerFlat } from '@/hooks/useOwnerFlats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, Pencil, Trash2, Home } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function MyProperties() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { data: allFlats = [] } = useFlats();
  const { data: ownerFlats = [], isLoading } = useMyOwnerFlats(user?.id);
  const createFlat = useCreateFlat();
  const updateFlat = useUpdateFlat();
  const addOwnerFlat = useAddOwnerFlat();
  const removeOwnerFlat = useRemoveOwnerFlat();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddExistingDialog, setShowAddExistingDialog] = useState(false);
  const [deleteFlat, setDeleteFlat] = useState<any>(null);
  const [editingFlat, setEditingFlat] = useState<any>(null);
  const [newFlatData, setNewFlatData] = useState({
    flat_number: '',
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
  };

  // Get owner ID from ownerFlats data
  const ownerId = ownerFlats.length > 0 ? ownerFlats[0].owner_id : null;

  // Filter out flats already owned by this owner
  const ownedFlatIds = ownerFlats.map((of: any) => of.flat_id);
  const availableFlats = allFlats.filter(flat => 
    !ownedFlatIds.includes(flat.id) && flat.status === 'vacant'
  );

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
        floor: newFlatData.floor,
        size: newFlatData.size,
        parking_spot: newFlatData.parking_spot || null,
        status: newFlatData.status,
      });
      
      if (flat) {
        await addOwnerFlat.mutateAsync({ ownerId, flatId: flat.id });
      }
      
      setShowAddDialog(false);
      setNewFlatData({ flat_number: '', floor: 1, size: 1200, parking_spot: '', status: 'owner-occupied' });
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

  return (
    <MainLayout>
      <Header 
        title={t.title}
        subtitle={t.subtitle}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
      <div className="flex flex-wrap gap-2 mb-6">
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
                    <TableHead>{t.flatNumber}</TableHead>
                    <TableHead>{t.floor}</TableHead>
                    <TableHead>{t.size}</TableHead>
                    <TableHead>{t.parking}</TableHead>
                    <TableHead>{t.status}</TableHead>
                    <TableHead className="text-right">{t.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ownerFlats.map((ownerFlat: any) => (
                    <TableRow key={ownerFlat.id}>
                      <TableCell className="font-medium">{ownerFlat.flats?.flat_number}</TableCell>
                      <TableCell>{ownerFlat.flats?.floor}</TableCell>
                      <TableCell>{ownerFlat.flats?.size?.toLocaleString()} {t.sqft}</TableCell>
                      <TableCell>{ownerFlat.flats?.parking_spot || '-'}</TableCell>
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
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.edit}</DialogTitle>
          </DialogHeader>
          {editingFlat && (
            <div className="space-y-4 py-4">
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

      {/* Remove Confirmation */}
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
    </MainLayout>
  );
}
