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
import { useLanguage } from '@/contexts/LanguageContext';

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

export const EmployeeForm = ({ open, onOpenChange, editData }: EmployeeFormProps) => {
  const { language } = useLanguage();
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

  const roleLabels = {
    guard: language === 'bn' ? 'গার্ড' : 'Guard',
    cleaner: language === 'bn' ? 'ক্লিনার' : 'Cleaner',
    caretaker: language === 'bn' ? 'কেয়ারটেকার' : 'Caretaker',
    other: language === 'bn' ? 'অন্যান্য' : 'Other',
  };

  const t = {
    title: editData 
      ? (language === 'bn' ? 'কর্মচারী সম্পাদনা' : 'Edit Employee')
      : (language === 'bn' ? 'নতুন কর্মচারী যুক্ত করুন' : 'Add New Employee'),
    description: language === 'bn' ? 'কর্মচারীর তথ্য দিন' : 'Enter employee details',
    name: language === 'bn' ? 'নাম' : 'Name',
    namePlaceholder: language === 'bn' ? 'কর্মচারীর নাম' : 'Employee name',
    role: language === 'bn' ? 'পদবি' : 'Role',
    rolePlaceholder: language === 'bn' ? 'পদবি নির্বাচন করুন' : 'Select role',
    phone: language === 'bn' ? 'ফোন নম্বর' : 'Phone Number',
    salary: language === 'bn' ? 'বেতন (৳)' : 'Salary (৳)',
    shift: language === 'bn' ? 'শিফট' : 'Shift',
    shiftPlaceholder: language === 'bn' ? 'সকাল ৮টা - রাত ৮টা' : '8 AM - 8 PM',
    nid: language === 'bn' ? 'জাতীয় পরিচয়পত্র (NID)' : 'National ID (NID)',
    nidPlaceholder: language === 'bn' ? 'NID নম্বর' : 'NID number',
    joinDate: language === 'bn' ? 'যোগদানের তারিখ' : 'Join Date',
    cancel: language === 'bn' ? 'বাতিল' : 'Cancel',
    submit: editData 
      ? (language === 'bn' ? 'আপডেট করুন' : 'Update')
      : (language === 'bn' ? 'যুক্ত করুন' : 'Add'),
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
            <Label htmlFor="role">{t.role} *</Label>
            <Select value={formData.role} onValueChange={(v: any) => setFormData({ ...formData, role: v })}>
              <SelectTrigger>
                <SelectValue placeholder={t.rolePlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(roleLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
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
            <Label htmlFor="salary">{t.salary} *</Label>
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
            <Label htmlFor="shift">{t.shift}</Label>
            <Input
              id="shift"
              value={formData.shift}
              onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
              placeholder={t.shiftPlaceholder}
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
            <Label htmlFor="join_date">{t.joinDate}</Label>
            <Input
              id="join_date"
              type="date"
              value={formData.join_date}
              onChange={(e) => setFormData({ ...formData, join_date: e.target.value })}
            />
          </div>
          
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.cancel}
            </Button>
            <Button type="submit" disabled={createEmployee.isPending || updateEmployee.isPending}>
              {t.submit}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
