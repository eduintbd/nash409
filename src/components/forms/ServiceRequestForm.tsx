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

interface ServiceRequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categories = [
  { value: 'plumbing', label: 'প্লাম্বিং' },
  { value: 'electrical', label: 'ইলেকট্রিক্যাল' },
  { value: 'elevator', label: 'লিফট' },
  { value: 'common-area', label: 'কমন এরিয়া' },
  { value: 'other', label: 'অন্যান্য' },
];

const priorities = [
  { value: 'low', label: 'কম' },
  { value: 'medium', label: 'মাঝারি' },
  { value: 'high', label: 'উচ্চ' },
  { value: 'urgent', label: 'জরুরি' },
];

export const ServiceRequestForm = ({ open, onOpenChange }: ServiceRequestFormProps) => {
  const { data: flats } = useFlats();
  const { data: employees } = useEmployees();
  const createRequest = useCreateServiceRequest();
  
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
        flat_id: '',
        title: '',
        category: 'other',
        description: '',
        priority: 'medium',
        assigned_to: '',
      });
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createRequest.mutateAsync({
      flat_id: formData.flat_id,
      title: formData.title,
      category: formData.category,
      description: formData.description || null,
      status: 'open',
      priority: formData.priority,
      assigned_to: formData.assigned_to || null,
      cost: null,
      resolved_at: null,
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>নতুন সার্ভিস অনুরোধ</DialogTitle>
          <DialogDescription>মেরামত বা সার্ভিসের জন্য অনুরোধ করুন</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="flat_id">ফ্ল্যাট *</Label>
            <Select value={formData.flat_id} onValueChange={(v) => setFormData({ ...formData, flat_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="ফ্ল্যাট নির্বাচন করুন" />
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
          
          <div>
            <Label htmlFor="title">শিরোনাম *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="সমস্যার শিরোনাম"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">ক্যাটাগরি</Label>
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
              <Label htmlFor="priority">অগ্রাধিকার</Label>
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
            <Label htmlFor="description">বিবরণ</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="সমস্যার বিস্তারিত বিবরণ"
            />
          </div>
          
          <div>
            <Label htmlFor="assigned_to">দায়িত্বপ্রাপ্ত</Label>
            <Select value={formData.assigned_to} onValueChange={(v) => setFormData({ ...formData, assigned_to: v })}>
              <SelectTrigger>
                <SelectValue placeholder="কর্মচারী নির্বাচন করুন" />
              </SelectTrigger>
              <SelectContent>
                {employees?.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              বাতিল
            </Button>
            <Button type="submit" disabled={createRequest.isPending}>
              যুক্ত করুন
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
