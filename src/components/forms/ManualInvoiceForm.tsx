import { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useFlats } from '@/hooks/useFlats';
import { useTenants } from '@/hooks/useTenants';
import { useCreateInvoice, useUpdateInvoice, Invoice } from '@/hooks/useInvoices';
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
  editData?: any;
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const monthsBn = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

export const ManualInvoiceForm = ({ open, onOpenChange, editData }: ManualInvoiceFormProps) => {
  const { t, language } = useLanguage();
  const { isAdmin, isOwner, userFlatIds } = useAuth();
  const { data: flats } = useFlats();
  const { data: tenants } = useTenants();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();

  const currentDate = new Date();
  const [flatId, setFlatId] = useState('');
  const [invoiceType, setInvoiceType] = useState<'rent' | 'service_charge' | 'other'>('service_charge');
  const [month, setMonth] = useState(months[currentDate.getMonth()]);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [amount, setAmount] = useState(3000);
  const [dueDate, setDueDate] = useState(
    new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 10)
      .toISOString()
      .split('T')[0]
  );
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'paid' | 'unpaid' | 'overdue'>('unpaid');

  const isEditing = !!editData;

  // Populate form when editing
  useEffect(() => {
    if (editData) {
      setFlatId(editData.flat_id || '');
      setInvoiceType(editData.invoice_type || 'service_charge');
      setMonth(editData.month || months[currentDate.getMonth()]);
      setYear(editData.year || currentDate.getFullYear());
      setAmount(editData.amount || 3000);
      setDueDate(editData.due_date || '');
      setDescription(editData.description || '');
      setStatus(editData.status || 'unpaid');
    } else {
      // Reset form for new invoice
      setFlatId('');
      setInvoiceType('service_charge');
      setMonth(months[currentDate.getMonth()]);
      setYear(currentDate.getFullYear());
      setAmount(3000);
      setDueDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 10)
          .toISOString()
          .split('T')[0]
      );
      setDescription('');
      setStatus('unpaid');
    }
  }, [editData]);

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
    title: isEditing ? 'Edit Invoice' : (isOwner ? 'Create Invoice for Tenant' : 'Add Invoice'),
    description: isEditing ? 'Update invoice details' : (isOwner ? 'Create an invoice for your tenant' : 'Add a new invoice'),
    selectFlat: 'Select Flat',
    invoiceType: 'Bill Type',
    rent: 'Rent',
    serviceCharge: 'Service Charge',
    other: 'Others',
    tenant: 'Tenant',
    month: 'Month',
    year: 'Year',
    amount: 'Amount (৳)',
    dueDate: 'Due Date',
    invoiceDescription: 'Description',
    status: 'Status',
    statusPaid: 'Paid',
    statusUnpaid: 'Unpaid',
    statusOverdue: 'Overdue',
    save: isEditing ? 'Update Invoice' : 'Create Invoice',
    cancel: 'Cancel',
    noTenant: 'No tenant assigned',
  } : {
    title: isEditing ? 'বিল সম্পাদনা' : (isOwner ? 'ভাড়াটিয়ার জন্য বিল তৈরি' : 'বিল যুক্ত করুন'),
    description: isEditing ? 'বিলের তথ্য আপডেট করুন' : (isOwner ? 'আপনার ভাড়াটিয়ার জন্য বিল তৈরি করুন' : 'নতুন বিল যুক্ত করুন'),
    selectFlat: 'ফ্ল্যাট নির্বাচন করুন',
    invoiceType: 'বিলের ধরন',
    rent: 'ভাড়া',
    serviceCharge: 'সার্ভিস চার্জ',
    other: 'অন্যান্য',
    tenant: 'ভাড়াটিয়া',
    month: 'মাস',
    year: 'বছর',
    amount: 'পরিমাণ (৳)',
    dueDate: 'নির্ধারিত তারিখ',
    invoiceDescription: 'বিবরণ',
    status: 'স্ট্যাটাস',
    statusPaid: 'পরিশোধিত',
    statusUnpaid: 'অপরিশোধিত',
    statusOverdue: 'মেয়াদোত্তীর্ণ',
    save: isEditing ? 'আপডেট করুন' : 'বিল তৈরি করুন',
    cancel: 'বাতিল',
    noTenant: 'কোন ভাড়াটিয়া নেই',
  };

  const displayMonths = language === 'bn' ? monthsBn : months;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flatId) return;

    const defaultDescription = invoiceType === 'rent' 
      ? (language === 'en' ? 'Monthly Rent' : 'মাসিক ভাড়া')
      : invoiceType === 'service_charge'
      ? (language === 'en' ? 'Monthly Service Charge' : 'মাসিক সার্ভিস চার্জ')
      : null;

    if (isEditing && editData?.id) {
      await updateInvoice.mutateAsync({
        id: editData.id,
        flat_id: flatId,
        month,
        year,
        amount,
        due_date: dueDate,
        status,
        paid_date: status === 'paid' ? (editData.paid_date || new Date().toISOString().split('T')[0]) : null,
        description: description || defaultDescription,
        invoice_type: invoiceType === 'other' ? 'service_charge' : invoiceType,
      });
    } else {
      await createInvoice.mutateAsync({
        flat_id: flatId,
        month,
        year,
        amount,
        due_date: dueDate,
        status: 'unpaid',
        paid_date: null,
        description: description || defaultDescription,
        invoice_type: invoiceType === 'other' ? 'service_charge' : invoiceType,
      });
    }

    onOpenChange(false);
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

          <div className="space-y-2">
            <Label>{labels.invoiceType}</Label>
            <Select value={invoiceType} onValueChange={(v) => setInvoiceType(v as 'rent' | 'service_charge' | 'other')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="service_charge">{labels.serviceCharge}</SelectItem>
                <SelectItem value="rent">{labels.rent}</SelectItem>
                <SelectItem value="other">{labels.other}</SelectItem>
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

          {/* Status field - only shown when editing */}
          {isEditing && (
            <div className="space-y-2">
              <Label>{labels.status}</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as 'paid' | 'unpaid' | 'overdue')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">{labels.statusUnpaid}</SelectItem>
                  <SelectItem value="paid">{labels.statusPaid}</SelectItem>
                  <SelectItem value="overdue">{labels.statusOverdue}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {labels.cancel}
            </Button>
            <Button type="submit" disabled={(createInvoice.isPending || updateInvoice.isPending) || !flatId}>
              {labels.save}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
