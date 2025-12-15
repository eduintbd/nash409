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
import { useCreateTenant, useUpdateTenant } from '@/hooks/useTenants';
import { useFlats } from '@/hooks/useFlats';

interface TenantFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: {
    id: string;
    name: string;
    email: string | null;
    phone: string;
    nid: string | null;
    rent_amount: number;
    flat_id: string | null;
    start_date: string;
    end_date: string | null;
  };
}

export const TenantForm = ({ open, onOpenChange, editData }: TenantFormProps) => {
  const { data: flats } = useFlats();
  const createTenant = useCreateTenant();
  const updateTenant = useUpdateTenant();
  
  const [formData, setFormData] = useState({
    name: editData?.name || '',
    email: editData?.email || '',
    phone: editData?.phone || '',
    nid: editData?.nid || '',
    rent_amount: editData?.rent_amount?.toString() || '',
    flat_id: editData?.flat_id || '',
    start_date: editData?.start_date || new Date().toISOString().split('T')[0],
    end_date: editData?.end_date || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      name: formData.name,
      email: formData.email || null,
      phone: formData.phone,
      nid: formData.nid || null,
      rent_amount: parseFloat(formData.rent_amount) || 0,
      flat_id: formData.flat_id || null,
      start_date: formData.start_date,
      end_date: formData.end_date || null,
    };

    if (editData) {
      await updateTenant.mutateAsync({ id: editData.id, ...data });
    } else {
      await createTenant.mutateAsync(data);
    }
    
    onOpenChange(false);
    setFormData({ name: '', email: '', phone: '', nid: '', rent_amount: '', flat_id: '', start_date: new Date().toISOString().split('T')[0], end_date: '' });
  };

  const availableFlats = flats?.filter(f => f.status !== 'tenant' || f.id === editData?.flat_id) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editData ? 'ভাড়াটিয়া সম্পাদনা' : 'নতুন ভাড়াটিয়া যুক্ত করুন'}</DialogTitle>
          <DialogDescription>ভাড়াটিয়ার তথ্য দিন</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">নাম *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="ভাড়াটিয়ার নাম"
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
                {availableFlats.map(flat => (
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
            <Label htmlFor="rent_amount">ভাড়ার পরিমাণ (৳) *</Label>
            <Input
              id="rent_amount"
              type="number"
              value={formData.rent_amount}
              onChange={(e) => setFormData({ ...formData, rent_amount: e.target.value })}
              placeholder="15000"
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
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">ভাড়া শুরু</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="end_date">ভাড়া শেষ</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>
          
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              বাতিল
            </Button>
            <Button type="submit" disabled={createTenant.isPending || updateTenant.isPending}>
              {editData ? 'আপডেট করুন' : 'যুক্ত করুন'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
