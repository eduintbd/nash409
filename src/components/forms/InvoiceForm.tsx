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
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { language } = useLanguage();
  const generateBulk = useGenerateBulkInvoices();
  const currentDate = new Date();
  
  const [formData, setFormData] = useState({
    month: months[currentDate.getMonth()],
    year: currentDate.getFullYear().toString(),
    amount: '3000',
    description: language === 'bn' ? 'মাসিক সার্ভিস চার্জ' : 'Monthly Service Charge',
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

  const t = {
    title: language === 'bn' ? 'বিল তৈরি করুন' : 'Generate Invoices',
    description: language === 'bn' ? 'সকল অকুপায়েড ফ্ল্যাটের জন্য বিল তৈরি হবে' : 'Invoices will be generated for all occupied flats',
    month: language === 'bn' ? 'মাস' : 'Month',
    year: language === 'bn' ? 'বছর' : 'Year',
    amount: language === 'bn' ? 'পরিমাণ (৳)' : 'Amount (৳)',
    invoiceDescription: language === 'bn' ? 'বিবরণ' : 'Description',
    descriptionPlaceholder: language === 'bn' ? 'মাসিক সার্ভিস চার্জ' : 'Monthly Service Charge',
    cancel: language === 'bn' ? 'বাতিল' : 'Cancel',
    submit: language === 'bn' ? 'বিল তৈরি করুন' : 'Generate Invoices',
  };

  const monthLabels = language === 'bn' ? monthsBangla : months;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="month">{t.month} *</Label>
              <Select value={formData.month} onValueChange={(v) => setFormData({ ...formData, month: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, i) => (
                    <SelectItem key={month} value={month}>{monthLabels[i]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="year">{t.year} *</Label>
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
            <Label htmlFor="amount">{t.amount} *</Label>
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
            <Label htmlFor="description">{t.invoiceDescription}</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t.descriptionPlaceholder}
            />
          </div>
          
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.cancel}
            </Button>
            <Button type="submit" disabled={generateBulk.isPending}>
              {t.submit}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
