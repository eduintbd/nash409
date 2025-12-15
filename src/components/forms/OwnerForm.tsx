import { useState } from 'react';
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
  const { data: flats } = useFlats();
  const createOwner = useCreateOwner();
  const updateOwner = useUpdateOwner();
  
  const [formData, setFormData] = useState({
    name: editData?.name || '',
    email: editData?.email || '',
    phone: editData?.phone || '',
    nid: editData?.nid || '',
    emergency_contact: editData?.emergency_contact || '',
    flat_id: editData?.flat_id || '',
    ownership_start: editData?.ownership_start || new Date().toISOString().split('T')[0],
  });

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
    setFormData({ name: '', email: '', phone: '', nid: '', emergency_contact: '', flat_id: '', ownership_start: new Date().toISOString().split('T')[0] });
  };

  const vacantFlats = flats?.filter(f => f.status === 'vacant' || f.id === editData?.flat_id) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editData ? 'মালিক সম্পাদনা' : 'নতুন মালিক যুক্ত করুন'}</DialogTitle>
          <DialogDescription>ফ্ল্যাট মালিকের তথ্য দিন</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">নাম *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="মালিকের নাম"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="flat_id">ফ্ল্যাট *</Label>
            <Select value={formData.flat_id} onValueChange={(v) => setFormData({ ...formData, flat_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="ফ্ল্যাট নির্বাচন করুন" />
              </SelectTrigger>
              <SelectContent>
                {vacantFlats.map(flat => (
                  <SelectItem key={flat.id} value={flat.id}>
                    {flat.flat_number} (Floor {flat.floor})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="phone">ফোন নম্বর *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="01XXXXXXXXX"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="email">ইমেইল</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@example.com"
            />
          </div>
          
          <div>
            <Label htmlFor="nid">জাতীয় পরিচয়পত্র (NID)</Label>
            <Input
              id="nid"
              value={formData.nid}
              onChange={(e) => setFormData({ ...formData, nid: e.target.value })}
              placeholder="NID নম্বর"
            />
          </div>
          
          <div>
            <Label htmlFor="emergency_contact">জরুরি যোগাযোগ</Label>
            <Input
              id="emergency_contact"
              value={formData.emergency_contact}
              onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
              placeholder="01XXXXXXXXX"
            />
          </div>
          
          <div>
            <Label htmlFor="ownership_start">মালিকানা শুরু</Label>
            <Input
              id="ownership_start"
              type="date"
              value={formData.ownership_start}
              onChange={(e) => setFormData({ ...formData, ownership_start: e.target.value })}
            />
          </div>
          
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              বাতিল
            </Button>
            <Button type="submit" disabled={createOwner.isPending || updateOwner.isPending}>
              {editData ? 'আপডেট করুন' : 'যুক্ত করুন'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
