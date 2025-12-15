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
import { useCreateExpense, useExpenseCategories } from '@/hooks/useExpenses';

interface ExpenseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const paymentMethods = [
  { value: 'cash', label: 'নগদ' },
  { value: 'bank', label: 'ব্যাংক' },
  { value: 'bkash', label: 'বিকাশ' },
  { value: 'nagad', label: 'নগদ (Nagad)' },
  { value: 'rocket', label: 'রকেট' },
  { value: 'cheque', label: 'চেক' },
];

export const ExpenseForm = ({ open, onOpenChange }: ExpenseFormProps) => {
  const { data: categories } = useExpenseCategories();
  const createExpense = useCreateExpense();
  
  const [formData, setFormData] = useState({
    category_id: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    vendor: '',
    payment_method: 'cash' as 'cash' | 'bank' | 'bkash' | 'nagad' | 'rocket' | 'cheque',
  });

  useEffect(() => {
    if (!open) {
      setFormData({
        category_id: '',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        vendor: '',
        payment_method: 'cash',
      });
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createExpense.mutateAsync({
      category_id: formData.category_id || null,
      description: formData.description,
      amount: parseFloat(formData.amount) || 0,
      date: formData.date,
      vendor: formData.vendor || null,
      payment_method: formData.payment_method,
      attachment_url: null,
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>নতুন খরচ যুক্ত করুন</DialogTitle>
          <DialogDescription>বিল্ডিং খরচের তথ্য দিন</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="category">ক্যাটাগরি *</Label>
            <Select value={formData.category_id} onValueChange={(v) => setFormData({ ...formData, category_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="ক্যাটাগরি নির্বাচন করুন" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="description">বিবরণ *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="খরচের বিবরণ লিখুন"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="amount">পরিমাণ (৳) *</Label>
            <Input
              id="amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="5000"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="date">তারিখ</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
          
          <div>
            <Label htmlFor="vendor">বিক্রেতা/প্রতিষ্ঠান</Label>
            <Input
              id="vendor"
              value={formData.vendor}
              onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
              placeholder="বিক্রেতার নাম"
            />
          </div>
          
          <div>
            <Label htmlFor="payment_method">পেমেন্ট পদ্ধতি</Label>
            <Select value={formData.payment_method} onValueChange={(v: any) => setFormData({ ...formData, payment_method: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map(method => (
                  <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              বাতিল
            </Button>
            <Button type="submit" disabled={createExpense.isPending}>
              যুক্ত করুন
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
