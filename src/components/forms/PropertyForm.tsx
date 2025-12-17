import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { useCreateFlat } from '@/hooks/useFlats';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface PropertyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PropertyForm = ({ open, onOpenChange }: PropertyFormProps) => {
  const { language } = useLanguage();
  const createFlat = useCreateFlat();
  
  const [formData, setFormData] = useState({
    propertyName: '',
    numberOfFlats: '1',
    fromFlatNumber: '1',
    toFlatNumber: '',
    startFloor: '2',
    address: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const numFlats = parseInt(formData.numberOfFlats) || 1;
      const fromFlat = parseInt(formData.fromFlatNumber) || 1;
      const startFloor = parseInt(formData.startFloor) || 2;
      
      // Generate flats for the property
      const flatsToCreate = [];
      const flatsPerFloor = 4; // Default flats per floor
      
      for (let i = 0; i < numFlats; i++) {
        const floor = startFloor + Math.floor(i / flatsPerFloor);
        const flatIndex = i % flatsPerFloor;
        const flatLetter = String.fromCharCode(65 + flatIndex); // A, B, C, D
        const flatNumber = `${floor}${flatLetter}`;
        
        flatsToCreate.push({
          building_name: formData.propertyName,
          flat_number: flatNumber,
          floor: floor,
          size: 1200,
          status: 'vacant' as const,
          parking_spot: null,
        });
      }

      // Create all flats
      for (const flat of flatsToCreate) {
        await createFlat.mutateAsync(flat);
      }

      toast.success(
        language === 'bn' 
          ? `${flatsToCreate.length} টি ফ্ল্যাট সহ প্রপার্টি তৈরি হয়েছে` 
          : `Property created with ${flatsToCreate.length} flats`
      );
      
      onOpenChange(false);
      // Reset form
      setFormData({
        propertyName: '',
        numberOfFlats: '1',
        fromFlatNumber: '1',
        toFlatNumber: '',
        startFloor: '2',
        address: '',
      });
    } catch (error) {
      toast.error(language === 'bn' ? 'প্রপার্টি তৈরিতে সমস্যা হয়েছে' : 'Failed to create property');
    } finally {
      setIsSubmitting(false);
    }
  };

  const t = {
    title: language === 'bn' ? 'নতুন প্রপার্টি যুক্ত করুন' : 'Add Property',
    description: language === 'bn' ? 'প্রপার্টির বিস্তারিত তথ্য দিন' : 'Enter property details',
    propertyName: language === 'bn' ? 'প্রপার্টির নাম' : 'Property Name',
    propertyNamePlaceholder: language === 'bn' ? 'যেমন: গ্রিন ভিউ টাওয়ার' : 'e.g., Green View Tower',
    numberOfFlats: language === 'bn' ? 'ফ্ল্যাট সংখ্যা' : 'Number of Flats',
    fromFlatNumber: language === 'bn' ? 'শুরু ফ্ল্যাট নম্বর' : 'From Flat Number',
    toFlatNumber: language === 'bn' ? 'শেষ ফ্ল্যাট নম্বর' : 'To Flat Number',
    startFloor: language === 'bn' ? 'শুরু তলা' : 'Starting Floor',
    address: language === 'bn' ? 'ঠিকানা' : 'Address',
    addressPlaceholder: language === 'bn' ? 'প্রপার্টির ঠিকানা লিখুন' : 'Enter property address',
    cancel: language === 'bn' ? 'বাতিল' : 'Cancel',
    submit: language === 'bn' ? 'প্রপার্টি তৈরি করুন' : 'Create Property',
  };

  const canSubmit = formData.propertyName && formData.numberOfFlats;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="propertyName">{t.propertyName} *</Label>
            <Input
              id="propertyName"
              value={formData.propertyName}
              onChange={(e) => setFormData({ ...formData, propertyName: e.target.value })}
              placeholder={t.propertyNamePlaceholder}
              required
            />
          </div>

          <div>
            <Label htmlFor="numberOfFlats">{t.numberOfFlats} *</Label>
            <Input
              id="numberOfFlats"
              type="number"
              min="1"
              max="100"
              value={formData.numberOfFlats}
              onChange={(e) => setFormData({ ...formData, numberOfFlats: e.target.value })}
              placeholder="1"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="fromFlatNumber">{t.fromFlatNumber}</Label>
              <Select 
                value={formData.fromFlatNumber} 
                onValueChange={(value) => setFormData({ ...formData, fromFlatNumber: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={language === 'bn' ? 'নির্বাচন করুন' : 'Select'} />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(num => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="toFlatNumber">{t.toFlatNumber}</Label>
              <Select 
                value={formData.toFlatNumber} 
                onValueChange={(value) => setFormData({ ...formData, toFlatNumber: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={language === 'bn' ? 'নির্বাচন করুন' : 'Select'} />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(num => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="startFloor">{t.startFloor} *</Label>
            <Select 
              value={formData.startFloor} 
              onValueChange={(value) => setFormData({ ...formData, startFloor: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(floor => (
                  <SelectItem key={floor} value={floor.toString()}>
                    {floor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="address">{t.address}</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder={t.addressPlaceholder}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.cancel}
            </Button>
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? (language === 'bn' ? 'তৈরি হচ্ছে...' : 'Creating...') : t.submit}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
