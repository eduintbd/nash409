import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Flat } from '@/hooks/useFlats';

interface FlatFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Flat>) => void;
  editData?: Flat | null;
  isLoading?: boolean;
}

const FlatForm = ({ isOpen, onClose, onSubmit, editData, isLoading }: FlatFormProps) => {
  const { language } = useLanguage();
  
  const [formData, setFormData] = useState({
    flat_number: '',
    floor: '',
    size: '',
    status: 'vacant' as 'owner-occupied' | 'tenant' | 'vacant',
    parking_spot: '',
  });

  useEffect(() => {
    if (editData) {
      setFormData({
        flat_number: editData.flat_number,
        floor: editData.floor.toString(),
        size: editData.size.toString(),
        status: editData.status,
        parking_spot: editData.parking_spot || '',
      });
    } else {
      setFormData({
        flat_number: '',
        floor: '',
        size: '',
        status: 'vacant',
        parking_spot: '',
      });
    }
  }, [editData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      flat_number: formData.flat_number,
      floor: parseInt(formData.floor),
      size: parseInt(formData.size),
      status: formData.status,
      parking_spot: formData.parking_spot || null,
    });
  };

  const statusOptions = [
    { value: 'owner-occupied', label: language === 'bn' ? 'মালিক বসবাস' : 'Owner Occupied' },
    { value: 'tenant', label: language === 'bn' ? 'ভাড়াটিয়া' : 'Tenant' },
    { value: 'vacant', label: language === 'bn' ? 'খালি' : 'Vacant' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editData 
              ? (language === 'bn' ? 'ফ্ল্যাট সম্পাদনা' : 'Edit Flat')
              : (language === 'bn' ? 'নতুন ফ্ল্যাট' : 'New Flat')
            }
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="flat_number">{language === 'bn' ? 'ফ্ল্যাট নম্বর' : 'Flat Number'} *</Label>
              <Input
                id="flat_number"
                value={formData.flat_number}
                onChange={(e) => setFormData({ ...formData, flat_number: e.target.value })}
                placeholder="e.g., 2A"
                required
              />
            </div>
            <div>
              <Label htmlFor="floor">{language === 'bn' ? 'তলা' : 'Floor'} *</Label>
              <Input
                id="floor"
                type="number"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
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
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                placeholder="e.g., 1200"
                required
              />
            </div>
            <div>
              <Label htmlFor="status">{language === 'bn' ? 'স্থিতি' : 'Status'} *</Label>
              <Select 
                value={formData.status} 
                onValueChange={(v: any) => setFormData({ ...formData, status: v })}
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
            <Label htmlFor="parking_spot">{language === 'bn' ? 'পার্কিং স্পট' : 'Parking Spot'}</Label>
            <Input
              id="parking_spot"
              value={formData.parking_spot}
              onChange={(e) => setFormData({ ...formData, parking_spot: e.target.value })}
              placeholder="e.g., P-01"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {editData 
                ? (language === 'bn' ? 'আপডেট করুন' : 'Update')
                : (language === 'bn' ? 'যোগ করুন' : 'Add')
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FlatForm;
