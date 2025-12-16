import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useFlats } from '@/hooks/useFlats';
import { useTenants } from '@/hooks/useTenants';
import { useCreateInvoice } from '@/hooks/useInvoices';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ManualInvoiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const monthsBn = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

export const ManualInvoiceForm = ({ open, onOpenChange }: ManualInvoiceFormProps) => {
  const { t, language } = useLanguage();
  const { isAdmin, isOwner, userFlatIds } = useAuth();
  const { data: flats } = useFlats();
  const { data: tenants } = useTenants();
  const createInvoice = useCreateInvoice();

  const currentDate = new Date();
  const [flatId, setFlatId] = useState('');
  const [month, setMonth] = useState(months[currentDate.getMonth()]);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [amount, setAmount] = useState(3000);
  const [dueDate, setDueDate] = useState(
    new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 10)
      .toISOString()
      .split('T')[0]
  );
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'unpaid' | 'paid'>('unpaid');

  // Filter flats based on user role
  // Admin sees all flats, Owner sees only their flats
  const availableFlats = useMemo(() => {
    if (isAdmin) return flats || [];
    if (isOwner && userFlatIds.length > 0) {
      return flats?.filter(f => userFlatIds.includes(f.id)) || [];
    }
    return [];
  }, [flats, isAdmin, isOwner, userFlatIds]);

  // Get tenant info for selected flat
  const selectedFlatTenant = useMemo(() => {
    if (!flatId) return null;
    return tenants?.find(t => t.flat_id === flatId);
  }, [flatId, tenants]);

  const labels = language === 'en' ? {
    title: isOwner ? 'Create Invoice for Tenant' : 'Add Invoice',
    description: isOwner ? 'Create an invoice for your tenant' : 'Add a new invoice',
    selectFlat: 'Select Flat',
    tenant: 'Tenant',
    month: 'Month',
    year: 'Year',
    amount: 'Amount (৳)',
    dueDate: 'Due Date',
    invoiceDescription: 'Description',
    status: 'Status',
    unpaid: 'Unpaid',
    paid: 'Paid',
    save: 'Create Invoice',
    cancel: 'Cancel',
    noTenant: 'No tenant assigned',
  } : {
    title: isOwner ? 'ভাড়াটিয়ার জন্য বিল তৈরি' : 'বিল যুক্ত করুন',
    description: isOwner ? 'আপনার ভাড়াটিয়ার জন্য বিল তৈরি করুন' : 'নতুন বিল যুক্ত করুন',
    selectFlat: 'ফ্ল্যাট নির্বাচন করুন',
    tenant: 'ভাড়াটিয়া',
    month: 'মাস',
    year: 'বছর',
    amount: 'পরিমাণ (৳)',
    dueDate: 'নির্ধারিত তারিখ',
    invoiceDescription: 'বিবরণ',
    status: 'অবস্থা',
    unpaid: 'বকেয়া',
    paid: 'পরিশোধিত',
    save: 'বিল তৈরি করুন',
    cancel: 'বাতিল',
    noTenant: 'কোন ভাড়াটিয়া নেই',
  };

  const displayMonths = language === 'bn' ? monthsBn : months;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flatId) return;

    await createInvoice.mutateAsync({
      flat_id: flatId,
      month,
      year,
      amount,
      due_date: dueDate,
      status,
      paid_date: status === 'paid' ? new Date().toISOString().split('T')[0] : null,
      description: description || null,
    });

    onOpenChange(false);
    // Reset form
    setFlatId('');
    setDescription('');
    setStatus('unpaid');
  };

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
          <DialogDescription>{labels.description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{labels.selectFlat}</Label>
            <Select value={flatId} onValueChange={setFlatId} required>
              <SelectTrigger>
                <SelectValue placeholder={labels.selectFlat} />
              </SelectTrigger>
              <SelectContent>
                {availableFlats.map((flat) => (
                  <SelectItem key={flat.id} value={flat.id}>
                    {flat.flat_number} {flat.status === 'tenant' && '(Tenant)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Show tenant info for owner */}
          {isOwner && flatId && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">{labels.tenant}</p>
              <p className="font-medium">
                {selectedFlatTenant?.name || labels.noTenant}
              </p>
              {selectedFlatTenant?.email && (
                <p className="text-sm text-muted-foreground">{selectedFlatTenant.email}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{labels.month}</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m, i) => (
                    <SelectItem key={m} value={m}>
                      {displayMonths[i]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{labels.year}</Label>
              <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{labels.amount}</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min={0}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>{labels.dueDate}</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>{labels.invoiceDescription}</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={language === 'en' ? 'Monthly Rent / Service Charge' : 'মাসিক ভাড়া / সার্ভিস চার্জ'}
            />
          </div>

          <div className="space-y-2">
            <Label>{labels.status}</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as 'unpaid' | 'paid')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unpaid">{labels.unpaid}</SelectItem>
                <SelectItem value="paid">{labels.paid}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {labels.cancel}
            </Button>
            <Button type="submit" disabled={createInvoice.isPending || !flatId}>
              {labels.save}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
