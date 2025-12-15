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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateOwner, useUpdateOwner } from '@/hooks/useOwners';
import { useFlats } from '@/hooks/useFlats';
import { useLanguage } from '@/contexts/LanguageContext';

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
}

export const OwnerForm = ({ open, onOpenChange, editData }: OwnerFormProps) => {
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
    flat_id: '',
    ownership_start: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name || '',
        email: editData.email || '',
        phone: editData.phone || '',
        nid: editData.nid || '',
        emergency_contact: editData.emergency_contact || '',
        flat_id: editData.flat_id || '',
        ownership_start: editData.ownership_start || new Date().toISOString().split('T')[0],
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        nid: '',
        emergency_contact: '',
        flat_id: '',
        ownership_start: new Date().toISOString().split('T')[0],
      });
    }
  }, [editData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      name: formData.name,
      email: formData.email || null,
      phone: formData.phone,
      nid: formData.nid || null,
      emergency_contact: formData.emergency_contact || null,
      flat_id: formData.flat_id || null,
      ownership_start: formData.ownership_start,
    };

    if (editData) {
      await updateOwner.mutateAsync({ id: editData.id, ...data });
    } else {
      await createOwner.mutateAsync(data);
    }
    
    onOpenChange(false);
  };

  const vacantFlats = flats?.filter(f => f.status === 'vacant' || f.id === editData?.flat_id) || [];

  const t = {
    title: editData 
      ? (language === 'bn' ? 'মালিক সম্পাদনা' : 'Edit Owner')
      : (language === 'bn' ? 'নতুন মালিক যুক্ত করুন' : 'Add New Owner'),
    description: language === 'bn' ? 'ফ্ল্যাট মালিকের তথ্য দিন' : 'Enter flat owner details',
    name: language === 'bn' ? 'নাম' : 'Name',
    namePlaceholder: language === 'bn' ? 'মালিকের নাম' : 'Owner name',
    flat: language === 'bn' ? 'ফ্ল্যাট' : 'Flat',
    flatPlaceholder: language === 'bn' ? 'ফ্ল্যাট নির্বাচন করুন' : 'Select flat',
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
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
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
            <Label htmlFor="flat_id">{t.flat} *</Label>
            <Select value={formData.flat_id} onValueChange={(v) => setFormData({ ...formData, flat_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder={t.flatPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {vacantFlats.map(flat => (
                  <SelectItem key={flat.id} value={flat.id}>
                    {flat.flat_number} ({t.floor} {flat.floor})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Button type="submit" disabled={createOwner.isPending || updateOwner.isPending}>
              {t.submit}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
