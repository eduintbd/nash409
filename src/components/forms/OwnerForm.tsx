import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCreateOwner, useUpdateOwner } from '@/hooks/useOwners';
import { useFlats } from '@/hooks/useFlats';
import { useLanguage } from '@/contexts/LanguageContext';
import { ScrollArea } from '@/components/ui/scroll-area';

interface OwnerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: {
    id: string;
    name: string;
    email: string | null;
    phone: string;
    nid: string | null;
    emergency_contact: string | null;
    flat_id: string | null;
    ownership_start: string;
  };
  existingFlatIds?: string[];
}

type OccupancyType = 'owner-occupied' | 'for-rent';

export const OwnerForm = ({ open, onOpenChange, editData, existingFlatIds = [] }: OwnerFormProps) => {
  const { language } = useLanguage();
  const { data: flats } = useFlats();
  const createOwner = useCreateOwner();
  const updateOwner = useUpdateOwner();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    nid: '',
    emergency_contact: '',
    flat_ids: [] as string[],
    ownership_start: new Date().toISOString().split('T')[0],
  });

  // Track occupancy type for each selected flat
  const [flatOccupancy, setFlatOccupancy] = useState<Record<string, OccupancyType>>({});

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name || '',
        email: editData.email || '',
        phone: editData.phone || '',
        nid: editData.nid || '',
        emergency_contact: editData.emergency_contact || '',
        flat_ids: existingFlatIds,
        ownership_start: editData.ownership_start || new Date().toISOString().split('T')[0],
      });
      // Set existing occupancy based on flat status
      const occupancy: Record<string, OccupancyType> = {};
      existingFlatIds.forEach(flatId => {
        const flat = flats?.find(f => f.id === flatId);
        occupancy[flatId] = flat?.status === 'owner-occupied' ? 'owner-occupied' : 'for-rent';
      });
      setFlatOccupancy(occupancy);
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        nid: '',
        emergency_contact: '',
        flat_ids: [],
        ownership_start: new Date().toISOString().split('T')[0],
      });
      setFlatOccupancy({});
    }
  }, [editData, existingFlatIds, open, flats]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      name: formData.name,
      email: formData.email || null,
      phone: formData.phone,
      nid: formData.nid || null,
      emergency_contact: formData.emergency_contact || null,
      flat_id: formData.flat_ids[0] || null,
      ownership_start: formData.ownership_start,
      flat_ids: formData.flat_ids,
      flat_occupancy: flatOccupancy,
    };

    if (editData) {
      await updateOwner.mutateAsync({ id: editData.id, ...data });
    } else {
      await createOwner.mutateAsync(data);
    }
    
    onOpenChange(false);
  };

  const handleFlatToggle = (flatId: string) => {
    setFormData(prev => {
      const newFlatIds = prev.flat_ids.includes(flatId)
        ? prev.flat_ids.filter(id => id !== flatId)
        : [...prev.flat_ids, flatId];
      
      // Set default occupancy for newly added flats
      if (!prev.flat_ids.includes(flatId)) {
        setFlatOccupancy(prevOccupancy => ({
          ...prevOccupancy,
          [flatId]: 'owner-occupied',
        }));
      } else {
        // Remove occupancy when flat is deselected
        setFlatOccupancy(prevOccupancy => {
          const { [flatId]: _, ...rest } = prevOccupancy;
          return rest;
        });
      }
      
      return { ...prev, flat_ids: newFlatIds };
    });
  };

  const handleOccupancyChange = (flatId: string, occupancy: OccupancyType) => {
    setFlatOccupancy(prev => ({
      ...prev,
      [flatId]: occupancy,
    }));
  };

  // Show vacant flats, tenant-occupied flats, and flats already owned by this owner (when editing)
  const availableFlats = flats?.filter(f => 
    f.status === 'vacant' || 
    f.status === 'tenant' || 
    existingFlatIds.includes(f.id)
  ) || [];

  const t = {
    title: editData 
      ? (language === 'bn' ? 'মালিক সম্পাদনা' : 'Edit Owner')
      : (language === 'bn' ? 'নতুন মালিক যুক্ত করুন' : 'Add New Owner'),
    description: language === 'bn' ? 'ফ্ল্যাট মালিকের তথ্য দিন' : 'Enter flat owner details',
    name: language === 'bn' ? 'নাম' : 'Name',
    namePlaceholder: language === 'bn' ? 'মালিকের নাম' : 'Owner name',
    flats: language === 'bn' ? 'ফ্ল্যাটসমূহ' : 'Flats',
    selectFlats: language === 'bn' ? 'এক বা একাধিক ফ্ল্যাট নির্বাচন করুন' : 'Select one or more flats',
    phone: language === 'bn' ? 'ফোন নম্বর' : 'Phone Number',
    email: language === 'bn' ? 'ইমেইল' : 'Email',
    nid: language === 'bn' ? 'জাতীয় পরিচয়পত্র (NID)' : 'National ID (NID)',
    nidPlaceholder: language === 'bn' ? 'NID নম্বর' : 'NID number',
    emergency: language === 'bn' ? 'জরুরি যোগাযোগ' : 'Emergency Contact',
    ownershipStart: language === 'bn' ? 'মালিকানা শুরু' : 'Ownership Start',
    cancel: language === 'bn' ? 'বাতিল' : 'Cancel',
    submit: editData 
      ? (language === 'bn' ? 'আপডেট করুন' : 'Update')
      : (language === 'bn' ? 'যুক্ত করুন' : 'Add'),
    floor: language === 'bn' ? 'তলা' : 'Floor',
    tenant: language === 'bn' ? 'ভাড়াটে আছে' : 'Has Tenant',
    vacant: language === 'bn' ? 'খালি' : 'Vacant',
    occupancyType: language === 'bn' ? 'থাকবেন নাকি ভাড়া দেবেন?' : 'Will stay or rent?',
    ownerWillStay: language === 'bn' ? 'মালিক থাকবেন' : 'Owner will stay',
    willRent: language === 'bn' ? 'ভাড়া দেবেন' : 'Will rent out',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">{t.name} *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t.namePlaceholder}
              required
            />
          </div>
          
          <div>
            <Label>{t.flats} *</Label>
            <p className="text-sm text-muted-foreground mb-2">{t.selectFlats}</p>
            <ScrollArea className="h-48 border rounded-md p-2">
              <div className="space-y-3">
                {availableFlats.map(flat => (
                  <div key={flat.id} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`flat-${flat.id}`}
                        checked={formData.flat_ids.includes(flat.id)}
                        onCheckedChange={() => handleFlatToggle(flat.id)}
                      />
                      <label
                        htmlFor={`flat-${flat.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      >
                        {flat.flat_number} ({t.floor} {flat.floor})
                        <span className="ml-2 text-xs text-muted-foreground">
                          {flat.status === 'tenant' ? `- ${t.tenant}` : flat.status === 'vacant' ? `- ${t.vacant}` : ''}
                        </span>
                      </label>
                    </div>
                    
                    {/* Occupancy selection - shown when flat is selected */}
                    {formData.flat_ids.includes(flat.id) && (
                      <div className="ml-6 p-2 bg-muted/50 rounded-md">
                        <p className="text-xs text-muted-foreground mb-2">{t.occupancyType}</p>
                        <RadioGroup
                          value={flatOccupancy[flat.id] || 'owner-occupied'}
                          onValueChange={(value) => handleOccupancyChange(flat.id, value as OccupancyType)}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="owner-occupied" id={`stay-${flat.id}`} />
                            <label htmlFor={`stay-${flat.id}`} className="text-xs cursor-pointer">
                              {t.ownerWillStay}
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="for-rent" id={`rent-${flat.id}`} />
                            <label htmlFor={`rent-${flat.id}`} className="text-xs cursor-pointer">
                              {t.willRent}
                            </label>
                          </div>
                        </RadioGroup>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          
          <div>
            <Label htmlFor="phone">{t.phone} *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="01XXXXXXXXX"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="email">{t.email}</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@example.com"
            />
          </div>
          
          <div>
            <Label htmlFor="nid">{t.nid}</Label>
            <Input
              id="nid"
              value={formData.nid}
              onChange={(e) => setFormData({ ...formData, nid: e.target.value })}
              placeholder={t.nidPlaceholder}
            />
          </div>
          
          <div>
            <Label htmlFor="emergency_contact">{t.emergency}</Label>
            <Input
              id="emergency_contact"
              value={formData.emergency_contact}
              onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
              placeholder="01XXXXXXXXX"
            />
          </div>
          
          <div>
            <Label htmlFor="ownership_start">{t.ownershipStart}</Label>
            <Input
              id="ownership_start"
              type="date"
              value={formData.ownership_start}
              onChange={(e) => setFormData({ ...formData, ownership_start: e.target.value })}
            />
          </div>
          
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.cancel}
            </Button>
            <Button type="submit" disabled={createOwner.isPending || updateOwner.isPending || formData.flat_ids.length === 0}>
              {t.submit}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};