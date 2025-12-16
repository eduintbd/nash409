import { useState, useEffect } from 'react';
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
import { useCreateServiceRequest } from '@/hooks/useServiceRequests';
import { useFlats } from '@/hooks/useFlats';
import { useEmployees } from '@/hooks/useEmployees';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

interface ServiceRequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ServiceRequestForm = ({ open, onOpenChange }: ServiceRequestFormProps) => {
  const { language } = useLanguage();
  const { isAdmin, isOwner, isTenant, userFlatId } = useAuth();
  const { data: flats } = useFlats();
  const { data: employees } = useEmployees();
  const createRequest = useCreateServiceRequest();
  
  const isResident = isOwner || isTenant;
  
  const [formData, setFormData] = useState({
    flat_id: '',
    title: '',
    category: 'other' as 'plumbing' | 'electrical' | 'elevator' | 'common-area' | 'other',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    assigned_to: '',
  });

  useEffect(() => {
    if (!open) {
      setFormData({
        flat_id: isResident && userFlatId ? userFlatId : '',
        title: '',
        category: 'other',
        description: '',
        priority: 'medium',
        assigned_to: '',
      });
    } else if (isResident && userFlatId) {
      setFormData(prev => ({ ...prev, flat_id: userFlatId }));
    }
  }, [open, isResident, userFlatId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createRequest.mutateAsync({
      flat_id: formData.flat_id,
      title: formData.title,
      category: formData.category,
      description: formData.description || null,
      status: 'open',
      priority: formData.priority,
      assigned_to: isAdmin && formData.assigned_to ? formData.assigned_to : null,
      cost: null,
      resolved_at: null,
    });
    
    onOpenChange(false);
  };

  const categories = [
    { value: 'plumbing', label: language === 'bn' ? 'প্লাম্বিং' : 'Plumbing' },
    { value: 'electrical', label: language === 'bn' ? 'ইলেকট্রিক্যাল' : 'Electrical' },
    { value: 'elevator', label: language === 'bn' ? 'লিফট' : 'Elevator' },
    { value: 'common-area', label: language === 'bn' ? 'কমন এরিয়া' : 'Common Area' },
    { value: 'other', label: language === 'bn' ? 'অন্যান্য' : 'Other' },
  ];

  const priorities = [
    { value: 'low', label: language === 'bn' ? 'কম' : 'Low' },
    { value: 'medium', label: language === 'bn' ? 'মাঝারি' : 'Medium' },
    { value: 'high', label: language === 'bn' ? 'উচ্চ' : 'High' },
    { value: 'urgent', label: language === 'bn' ? 'জরুরি' : 'Urgent' },
  ];

  const t = {
    title: language === 'bn' ? 'নতুন সার্ভিস অনুরোধ' : 'New Service Request',
    description: language === 'bn' ? 'মেরামত বা সার্ভিসের জন্য অনুরোধ করুন' : 'Submit a repair or service request',
    flat: language === 'bn' ? 'ফ্ল্যাট' : 'Flat',
    flatPlaceholder: language === 'bn' ? 'ফ্ল্যাট নির্বাচন করুন' : 'Select flat',
    requestTitle: language === 'bn' ? 'শিরোনাম' : 'Title',
    titlePlaceholder: language === 'bn' ? 'সমস্যার শিরোনাম' : 'Issue title',
    category: language === 'bn' ? 'ক্যাটাগরি' : 'Category',
    priority: language === 'bn' ? 'অগ্রাধিকার' : 'Priority',
    requestDescription: language === 'bn' ? 'বিবরণ' : 'Description',
    descriptionPlaceholder: language === 'bn' ? 'সমস্যার বিস্তারিত বিবরণ' : 'Detailed description of the issue',
    assignedTo: language === 'bn' ? 'দায়িত্বপ্রাপ্ত' : 'Assigned To',
    assigneePlaceholder: language === 'bn' ? 'কর্মচারী নির্বাচন করুন' : 'Select employee',
    cancel: language === 'bn' ? 'বাতিল' : 'Cancel',
    submit: language === 'bn' ? 'যুক্ত করুন' : 'Submit',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isResident ? (
            <div>
              <Label htmlFor="flat_id">{t.flat} *</Label>
              <Select value={formData.flat_id} onValueChange={(v) => setFormData({ ...formData, flat_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder={t.flatPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {flats?.map(flat => (
                    <SelectItem key={flat.id} value={flat.id}>
                      {flat.flat_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div>
              <Label>{t.flat}</Label>
              <Input value={flats?.find(f => f.id === userFlatId)?.flat_number || ''} disabled />
            </div>
          )}
          
          <div>
            <Label htmlFor="title">{t.requestTitle} *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={t.titlePlaceholder}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">{t.category}</Label>
              <Select value={formData.category} onValueChange={(v: any) => setFormData({ ...formData, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">{t.priority}</Label>
              <Select value={formData.priority} onValueChange={(v: any) => setFormData({ ...formData, priority: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">{t.requestDescription}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t.descriptionPlaceholder}
            />
          </div>
          
          {isAdmin && (
            <div>
              <Label htmlFor="assigned_to">{t.assignedTo}</Label>
              <Select value={formData.assigned_to} onValueChange={(v) => setFormData({ ...formData, assigned_to: v })}>
                <SelectTrigger>
                  <SelectValue placeholder={t.assigneePlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {employees?.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.cancel}
            </Button>
            <Button type="submit" disabled={createRequest.isPending}>
              {t.submit}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
