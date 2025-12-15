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
import { useCreateEmployee, useUpdateEmployee } from '@/hooks/useEmployees';

interface EmployeeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: {
    id: string;
    name: string;
    role: 'guard' | 'cleaner' | 'caretaker' | 'other';
    phone: string;
    nid: string | null;
    salary: number;
    shift: string | null;
    join_date: string;
  };
}

const roleLabels = {
  guard: 'গার্ড',
  cleaner: 'ক্লিনার',
  caretaker: 'কেয়ারটেকার',
  other: 'অন্যান্য',
};

export const EmployeeForm = ({ open, onOpenChange, editData }: EmployeeFormProps) => {
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  
  const [formData, setFormData] = useState({
    name: '',
    role: 'guard' as 'guard' | 'cleaner' | 'caretaker' | 'other',
    phone: '',
    nid: '',
    salary: '',
    shift: '',
    join_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name,
        role: editData.role,
        phone: editData.phone,
        nid: editData.nid || '',
        salary: editData.salary.toString(),
        shift: editData.shift || '',
        join_date: editData.join_date,
      });
    } else {
      setFormData({
        name: '',
        role: 'guard',
        phone: '',
        nid: '',
        salary: '',
        shift: '',
        join_date: new Date().toISOString().split('T')[0],
      });
    }
  }, [editData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      name: formData.name,
      role: formData.role,
      phone: formData.phone,
      nid: formData.nid || null,
      salary: parseFloat(formData.salary) || 0,
      shift: formData.shift || null,
      join_date: formData.join_date,
    };

    if (editData) {
      await updateEmployee.mutateAsync({ id: editData.id, ...data });
    } else {
      await createEmployee.mutateAsync(data);
    }
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editData ? 'কর্মচারী সম্পাদনা' : 'নতুন কর্মচারী যুক্ত করুন'}</DialogTitle>
          <DialogDescription>কর্মচারীর তথ্য দিন</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">নাম *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="কর্মচারীর নাম"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="role">পদবি *</Label>
            <Select value={formData.role} onValueChange={(v: any) => setFormData({ ...formData, role: v })}>
              <SelectTrigger>
                <SelectValue placeholder="পদবি নির্বাচন করুন" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(roleLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
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
            <Label htmlFor="salary">বেতন (৳) *</Label>
            <Input
              id="salary"
              type="number"
              value={formData.salary}
              onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
              placeholder="10000"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="shift">শিফট</Label>
            <Input
              id="shift"
              value={formData.shift}
              onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
              placeholder="সকাল ৮টা - রাত ৮টা"
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
            <Label htmlFor="join_date">যোগদানের তারিখ</Label>
            <Input
              id="join_date"
              type="date"
              value={formData.join_date}
              onChange={(e) => setFormData({ ...formData, join_date: e.target.value })}
            />
          </div>
          
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              বাতিল
            </Button>
            <Button type="submit" disabled={createEmployee.isPending || updateEmployee.isPending}>
              {editData ? 'আপডেট করুন' : 'যুক্ত করুন'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
