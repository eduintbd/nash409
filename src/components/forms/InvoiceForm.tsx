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
import { useGenerateBulkInvoices } from '@/hooks/useInvoices';

interface InvoiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const monthsBangla = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

export const InvoiceForm = ({ open, onOpenChange }: InvoiceFormProps) => {
  const generateBulk = useGenerateBulkInvoices();
  const currentDate = new Date();
  
  const [formData, setFormData] = useState({
    month: months[currentDate.getMonth()],
    year: currentDate.getFullYear().toString(),
    amount: '3000',
    description: 'মাসিক সার্ভিস চার্জ',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await generateBulk.mutateAsync({
      month: formData.month,
      year: parseInt(formData.year),
      amount: parseFloat(formData.amount),
      description: formData.description,
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>বিল তৈরি করুন</DialogTitle>
          <DialogDescription>সকল অকুপায়েড ফ্ল্যাটের জন্য বিল তৈরি হবে</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="month">মাস *</Label>
              <Select value={formData.month} onValueChange={(v) => setFormData({ ...formData, month: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, i) => (
                    <SelectItem key={month} value={month}>{monthsBangla[i]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="year">বছর *</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                required
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="amount">পরিমাণ (৳) *</Label>
            <Input
              id="amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="3000"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">বিবরণ</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="মাসিক সার্ভিস চার্জ"
            />
          </div>
          
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              বাতিল
            </Button>
            <Button type="submit" disabled={generateBulk.isPending}>
              বিল তৈরি করুন
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
