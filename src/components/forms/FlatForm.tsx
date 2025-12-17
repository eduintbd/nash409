import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Flat, useFlats } from '@/hooks/useFlats';
import { Owner } from '@/hooks/useOwners';
import { Tenant } from '@/hooks/useTenants';
import { Building2, User, Users, Plus } from 'lucide-react';

interface FlatFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    flat: Partial<Flat>;
    owner?: Partial<Owner> & { id?: string };
    tenant?: Partial<Tenant> & { id?: string };
  }) => void;
  editData?: Flat | null;
  ownerData?: Owner | null;
  tenantData?: Tenant | null;
  isLoading?: boolean;
}

const FlatForm = ({ isOpen, onClose, onSubmit, editData, ownerData, tenantData, isLoading }: FlatFormProps) => {
  const { language } = useLanguage();
  const { data: allFlats } = useFlats();
  
  // Get unique building names from existing flats
  const existingBuildings = [...new Set(allFlats?.map(f => f.building_name).filter(Boolean) || [])];
  
  const [selectedBuilding, setSelectedBuilding] = useState<string>('');
  const [isNewBuilding, setIsNewBuilding] = useState(false);
  const [newBuildingName, setNewBuildingName] = useState('');
  
  const [flatData, setFlatData] = useState({
    flat_number: '',
    floor: '',
    size: '',
    status: 'vacant' as 'owner-occupied' | 'tenant' | 'vacant',
    parking_spot: '',
  });

  const [ownerFormData, setOwnerFormData] = useState({
    name: '',
    phone: '',
    email: '',
    nid: '',
    emergency_contact: '',
  });

  const [tenantFormData, setTenantFormData] = useState({
    name: '',
    phone: '',
    email: '',
    nid: '',
    rent_amount: '',
  });

  useEffect(() => {
    if (editData) {
      setFlatData({
        flat_number: editData.flat_number,
        floor: editData.floor.toString(),
        size: editData.size.toString(),
        status: editData.status,
        parking_spot: editData.parking_spot || '',
      });
      // Set building name for edit
      if (editData.building_name) {
        setSelectedBuilding(editData.building_name);
        setIsNewBuilding(false);
      }
    } else {
      setFlatData({
        flat_number: '',
        floor: '',
        size: '',
        status: 'vacant',
        parking_spot: '',
      });
      setSelectedBuilding('');
      setIsNewBuilding(false);
      setNewBuildingName('');
    }

    if (ownerData) {
      setOwnerFormData({
        name: ownerData.name || '',
        phone: ownerData.phone || '',
        email: ownerData.email || '',
        nid: ownerData.nid || '',
        emergency_contact: ownerData.emergency_contact || '',
      });
    } else {
      setOwnerFormData({ name: '', phone: '', email: '', nid: '', emergency_contact: '' });
    }

    if (tenantData) {
      setTenantFormData({
        name: tenantData.name || '',
        phone: tenantData.phone || '',
        email: tenantData.email || '',
        nid: tenantData.nid || '',
        rent_amount: tenantData.rent_amount?.toString() || '',
      });
    } else {
      setTenantFormData({ name: '', phone: '', email: '', nid: '', rent_amount: '' });
    }
  }, [editData, ownerData, tenantData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const buildingName = isNewBuilding ? newBuildingName : selectedBuilding;
    
    const flatPayload: Partial<Flat> = {
      flat_number: flatData.flat_number,
      building_name: buildingName || null,
      floor: parseInt(flatData.floor),
      size: parseInt(flatData.size),
      status: flatData.status,
      parking_spot: flatData.parking_spot || null,
    };

    const ownerPayload = ownerData ? {
      id: ownerData.id,
      name: ownerFormData.name,
      phone: ownerFormData.phone,
      email: ownerFormData.email || null,
      nid: ownerFormData.nid || null,
      emergency_contact: ownerFormData.emergency_contact || null,
    } : undefined;

    const tenantPayload = tenantData ? {
      id: tenantData.id,
      name: tenantFormData.name,
      phone: tenantFormData.phone,
      email: tenantFormData.email || null,
      nid: tenantFormData.nid || null,
      rent_amount: parseFloat(tenantFormData.rent_amount) || tenantData.rent_amount,
    } : undefined;

    onSubmit({ flat: flatPayload, owner: ownerPayload, tenant: tenantPayload });
  };

  const statusOptions = [
    { value: 'owner-occupied', label: language === 'bn' ? 'মালিক বসবাস' : 'Owner Occupied' },
    { value: 'tenant', label: language === 'bn' ? 'ভাড়াটিয়া' : 'Tenant' },
    { value: 'vacant', label: language === 'bn' ? 'খালি' : 'Vacant' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editData 
              ? (language === 'bn' ? 'ফ্ল্যাট সম্পাদনা' : 'Edit Flat')
              : (language === 'bn' ? 'নতুন ফ্ল্যাট' : 'New Flat')
            }
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="flat" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="flat" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {language === 'bn' ? 'ফ্ল্যাট' : 'Flat'}
              </TabsTrigger>
              <TabsTrigger value="owner" className="flex items-center gap-2" disabled={!ownerData && !!editData}>
                <User className="h-4 w-4" />
                {language === 'bn' ? 'মালিক' : 'Owner'}
              </TabsTrigger>
              <TabsTrigger value="tenant" className="flex items-center gap-2" disabled={!tenantData}>
                <Users className="h-4 w-4" />
                {language === 'bn' ? 'ভাড়াটিয়া' : 'Tenant'}
              </TabsTrigger>
            </TabsList>

            {/* Flat Details Tab */}
            <TabsContent value="flat" className="space-y-4">
              {/* Property Name Selection */}
              <div>
                <Label>{language === 'bn' ? 'প্রপার্টি/বিল্ডিং' : 'Property/Building'} *</Label>
                {!isNewBuilding ? (
                  <div className="flex gap-2">
                    <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder={language === 'bn' ? 'বিল্ডিং নির্বাচন করুন' : 'Select building'} />
                      </SelectTrigger>
                      <SelectContent>
                        {existingBuildings.map((building) => (
                          <SelectItem key={building} value={building!}>
                            {building}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsNewBuilding(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      {language === 'bn' ? 'নতুন' : 'New'}
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={newBuildingName}
                      onChange={(e) => setNewBuildingName(e.target.value)}
                      placeholder={language === 'bn' ? 'নতুন প্রপার্টির নাম' : 'New property name'}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsNewBuilding(false);
                        setNewBuildingName('');
                      }}
                    >
                      {language === 'bn' ? 'বাতিল' : 'Cancel'}
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="flat_number">{language === 'bn' ? 'ফ্ল্যাট নম্বর' : 'Flat No.'} *</Label>
                  <Input
                    id="flat_number"
                    value={flatData.flat_number}
                    onChange={(e) => setFlatData({ ...flatData, flat_number: e.target.value })}
                    placeholder="e.g., 2A"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="floor">{language === 'bn' ? 'তলা' : 'Floor'} *</Label>
                  <Input
                    id="floor"
                    type="number"
                    value={flatData.floor}
                    onChange={(e) => setFlatData({ ...flatData, floor: e.target.value })}
                    placeholder="e.g., 2"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="size">{language === 'bn' ? 'আয়তন (sq.ft)' : 'Size (sq.ft)'} *</Label>
                  <Input
                    id="size"
                    type="number"
                    value={flatData.size}
                    onChange={(e) => setFlatData({ ...flatData, size: e.target.value })}
                    placeholder="e.g., 1200"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="status">{language === 'bn' ? 'স্থিতি' : 'Status'} *</Label>
                  <Select 
                    value={flatData.status} 
                    onValueChange={(v: any) => setFlatData({ ...flatData, status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="parking_spot">{language === 'bn' ? 'পার্কিং স্পট' : 'Parking'}</Label>
                <Input
                  id="parking_spot"
                  value={flatData.parking_spot}
                  onChange={(e) => setFlatData({ ...flatData, parking_spot: e.target.value })}
                  placeholder="e.g., P-01"
                />
              </div>
            </TabsContent>

            {/* Owner Details Tab */}
            <TabsContent value="owner" className="space-y-4">
              {ownerData ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="owner_name">{language === 'bn' ? 'নাম' : 'Name'} *</Label>
                      <Input
                        id="owner_name"
                        value={ownerFormData.name}
                        onChange={(e) => setOwnerFormData({ ...ownerFormData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="owner_phone">{language === 'bn' ? 'ফোন' : 'Contact'} *</Label>
                      <Input
                        id="owner_phone"
                        value={ownerFormData.phone}
                        onChange={(e) => setOwnerFormData({ ...ownerFormData, phone: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="owner_email">{language === 'bn' ? 'ইমেইল' : 'Email'}</Label>
                      <Input
                        id="owner_email"
                        type="email"
                        value={ownerFormData.email}
                        onChange={(e) => setOwnerFormData({ ...ownerFormData, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="owner_nid">{language === 'bn' ? 'NID' : 'NID'}</Label>
                      <Input
                        id="owner_nid"
                        value={ownerFormData.nid}
                        onChange={(e) => setOwnerFormData({ ...ownerFormData, nid: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="owner_emergency">{language === 'bn' ? 'জরুরী যোগাযোগ' : 'Emergency Contact'}</Label>
                    <Input
                      id="owner_emergency"
                      value={ownerFormData.emergency_contact}
                      onChange={(e) => setOwnerFormData({ ...ownerFormData, emergency_contact: e.target.value })}
                    />
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {language === 'bn' ? 'এই ফ্ল্যাটে কোনো মালিক নেই' : 'No owner assigned to this flat'}
                </div>
              )}
            </TabsContent>

            {/* Tenant Details Tab */}
            <TabsContent value="tenant" className="space-y-4">
              {tenantData ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tenant_name">{language === 'bn' ? 'নাম' : 'Name'} *</Label>
                      <Input
                        id="tenant_name"
                        value={tenantFormData.name}
                        onChange={(e) => setTenantFormData({ ...tenantFormData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="tenant_phone">{language === 'bn' ? 'ফোন' : 'Contact'} *</Label>
                      <Input
                        id="tenant_phone"
                        value={tenantFormData.phone}
                        onChange={(e) => setTenantFormData({ ...tenantFormData, phone: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tenant_email">{language === 'bn' ? 'ইমেইল' : 'Email'}</Label>
                      <Input
                        id="tenant_email"
                        type="email"
                        value={tenantFormData.email}
                        onChange={(e) => setTenantFormData({ ...tenantFormData, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="tenant_nid">{language === 'bn' ? 'NID' : 'NID'}</Label>
                      <Input
                        id="tenant_nid"
                        value={tenantFormData.nid}
                        onChange={(e) => setTenantFormData({ ...tenantFormData, nid: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="tenant_rent">{language === 'bn' ? 'ভাড়া (৳)' : 'Rent Amount (৳)'}</Label>
                    <Input
                      id="tenant_rent"
                      type="number"
                      value={tenantFormData.rent_amount}
                      onChange={(e) => setTenantFormData({ ...tenantFormData, rent_amount: e.target.value })}
                    />
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {language === 'bn' ? 'এই ফ্ল্যাটে কোনো ভাড়াটিয়া নেই' : 'No tenant in this flat'}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex gap-3 pt-6 border-t mt-6">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {language === 'bn' ? 'সংরক্ষণ করুন' : 'Save All Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FlatForm;
