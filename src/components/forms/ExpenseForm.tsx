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
import { useLanguage } from '@/contexts/LanguageContext';

interface ExpenseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ExpenseForm = ({ open, onOpenChange }: ExpenseFormProps) => {
  const { language } = useLanguage();
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

  const paymentMethods = [
    { value: 'cash', label: language === 'bn' ? 'নগদ' : 'Cash' },
    { value: 'bank', label: language === 'bn' ? 'ব্যাংক' : 'Bank' },
    { value: 'bkash', label: language === 'bn' ? 'বিকাশ' : 'bKash' },
    { value: 'nagad', label: language === 'bn' ? 'নগদ (Nagad)' : 'Nagad' },
    { value: 'rocket', label: language === 'bn' ? 'রকেট' : 'Rocket' },
    { value: 'cheque', label: language === 'bn' ? 'চেক' : 'Cheque' },
  ];

  const t = {
    title: language === 'bn' ? 'নতুন খরচ যুক্ত করুন' : 'Add New Expense',
    description: language === 'bn' ? 'বিল্ডিং খরচের তথ্য দিন' : 'Enter building expense details',
    category: language === 'bn' ? 'ক্যাটাগরি' : 'Category',
    categoryPlaceholder: language === 'bn' ? 'ক্যাটাগরি নির্বাচন করুন' : 'Select category',
    expenseDescription: language === 'bn' ? 'বিবরণ' : 'Description',
    descriptionPlaceholder: language === 'bn' ? 'খরচের বিবরণ লিখুন' : 'Enter expense description',
    amount: language === 'bn' ? 'পরিমাণ (৳)' : 'Amount (৳)',
    date: language === 'bn' ? 'তারিখ' : 'Date',
    vendor: language === 'bn' ? 'বিক্রেতা/প্রতিষ্ঠান' : 'Vendor/Organization',
    vendorPlaceholder: language === 'bn' ? 'বিক্রেতার নাম' : 'Vendor name',
    paymentMethod: language === 'bn' ? 'পেমেন্ট পদ্ধতি' : 'Payment Method',
    cancel: language === 'bn' ? 'বাতিল' : 'Cancel',
    submit: language === 'bn' ? 'যুক্ত করুন' : 'Add',
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
            <Label htmlFor="category">{t.category} *</Label>
            <Select value={formData.category_id} onValueChange={(v) => setFormData({ ...formData, category_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder={t.categoryPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {categories?.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="description">{t.expenseDescription} *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t.descriptionPlaceholder}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="amount">{t.amount} *</Label>
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
            <Label htmlFor="date">{t.date}</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
          
          <div>
            <Label htmlFor="vendor">{t.vendor}</Label>
            <Input
              id="vendor"
              value={formData.vendor}
              onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
              placeholder={t.vendorPlaceholder}
            />
          </div>
          
          <div>
            <Label htmlFor="payment_method">{t.paymentMethod}</Label>
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
              {t.cancel}
            </Button>
            <Button type="submit" disabled={createExpense.isPending}>
              {t.submit}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
