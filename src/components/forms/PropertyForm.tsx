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
    numberOfFlats: '',
    flatNumberPrefix: '',
    startFloor: '',
    address: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate preview of flat numbers based on inputs
  const getFlatNumbersPreview = () => {
    const numFlats = parseInt(formData.numberOfFlats) || 0;
    const prefix = formData.flatNumberPrefix.trim();
    const startFloor = parseInt(formData.startFloor) || 2;
    
    if (!numFlats || !prefix) return [];
    
    const flatNumbers = [];
    const flatsPerFloor = 4;
    
    for (let i = 0; i < numFlats && i < 12; i++) {
      const floor = startFloor + Math.floor(i / flatsPerFloor);
      const flatIndex = i % flatsPerFloor;
      const flatLetter = String.fromCharCode(65 + flatIndex); // A, B, C, D
      flatNumbers.push(`${prefix}-${floor}${flatLetter}`);
    }
    
    if (numFlats > 12) {
      flatNumbers.push('...');
    }
    
    return flatNumbers;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const numFlats = parseInt(formData.numberOfFlats) || 1;
      const prefix = formData.flatNumberPrefix.trim();
      const startFloor = parseInt(formData.startFloor) || 2;
      
      // Generate flats for the property
      const flatsToCreate = [];
      const flatsPerFloor = 4;
      
      for (let i = 0; i < numFlats; i++) {
        const floor = startFloor + Math.floor(i / flatsPerFloor);
        const flatIndex = i % flatsPerFloor;
        const flatLetter = String.fromCharCode(65 + flatIndex); // A, B, C, D
        const flatNumber = `${prefix}-${floor}${flatLetter}`;
        
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
        numberOfFlats: '',
        flatNumberPrefix: '',
        startFloor: '',
        address: '',
      });
    } catch (error) {
      toast.error(language === 'bn' ? 'প্রপার্টি তৈরিতে সমস্যা হয়েছে' : 'Failed to create property');
    } finally {
      setIsSubmitting(false);
    }
  };

  const t = {
    title: language === 'bn' ? 'প্রপার্টি যুক্ত করুন' : 'Add Property',
    description: language === 'bn' ? 'প্রপার্টির বিস্তারিত তথ্য দিন' : 'Enter property details',
    propertyName: language === 'bn' ? 'প্রপার্টির নাম' : 'Property Name',
    propertyNamePlaceholder: language === 'bn' ? 'যেমন: গ্রিন ভিউ টাওয়ার' : 'e.g., Green View Tower',
    numberOfFlats: language === 'bn' ? 'ফ্ল্যাট সংখ্যা' : 'Number of Flats',
    flatNumberPrefix: language === 'bn' ? 'ফ্ল্যাট নম্বর প্রিফিক্স' : 'Flat Number Prefix',
    flatNumberPrefixPlaceholder: language === 'bn' ? 'যেমন: NB, FL, GV' : 'e.g., NB, FL, GV',
    startFloor: language === 'bn' ? 'শুরু তলা' : 'Starting Floor',
    address: language === 'bn' ? 'ঠিকানা' : 'Address',
    addressPlaceholder: language === 'bn' ? 'প্রপার্টির ঠিকানা লিখুন' : 'Enter property address',
    cancel: language === 'bn' ? 'বাতিল' : 'Cancel',
    submit: language === 'bn' ? 'প্রপার্টি তৈরি করুন' : 'Create Property',
    preview: language === 'bn' ? 'ফ্ল্যাট নম্বর প্রিভিউ' : 'Flat Numbers Preview',
  };

  const flatNumbersPreview = getFlatNumbersPreview();
  const canSubmit = formData.propertyName && formData.numberOfFlats && formData.flatNumberPrefix && formData.startFloor;

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
              <Label htmlFor="flatNumberPrefix">{t.flatNumberPrefix} *</Label>
              <Input
                id="flatNumberPrefix"
                value={formData.flatNumberPrefix}
                onChange={(e) => setFormData({ ...formData, flatNumberPrefix: e.target.value.toUpperCase() })}
                placeholder={t.flatNumberPrefixPlaceholder}
                required
              />
            </div>
            <div>
              <Label htmlFor="startFloor">{t.startFloor} *</Label>
              <Input
                id="startFloor"
                type="number"
                min="1"
                max="50"
                value={formData.startFloor}
                onChange={(e) => setFormData({ ...formData, startFloor: e.target.value })}
                placeholder="2"
                required
              />
            </div>
          </div>

          {/* Flat Numbers Preview */}
          {flatNumbersPreview.length > 0 && (
            <div className="p-3 rounded-lg bg-muted/50 border">
              <Label className="text-xs text-muted-foreground">{t.preview}</Label>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {flatNumbersPreview.map((num, idx) => (
                  <span 
                    key={idx} 
                    className="px-2 py-0.5 text-xs rounded bg-primary/10 text-primary font-mono"
                  >
                    {num}
                  </span>
                ))}
              </div>
            </div>
          )}

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
