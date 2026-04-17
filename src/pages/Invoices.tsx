import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { useInvoices, useUpdateInvoice, useDeleteInvoice, Invoice } from '@/hooks/useInvoices';
import { useOwners } from '@/hooks/useOwners';
import { useTenants } from '@/hooks/useTenants';
import { useFlats } from '@/hooks/useFlats';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InvoiceForm } from '@/components/forms/InvoiceForm';
import { ManualInvoiceForm } from '@/components/forms/ManualInvoiceForm';
import { Search, Plus, FileText, MoreHorizontal, Check, Pencil, Trash2, Download, Loader2, Wallet } from 'lucide-react';
import { useDownloadRentReceipt } from '@/hooks/useInvoiceReceipt';
import { useSubmitPaymentIntent, type PaymentMethod } from '@/hooks/usePaymentIntents';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { formatBDT } from '@/lib/currency';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const statusColors = {
  paid: 'bg-success/10 text-success border-success/20',
  unpaid: 'bg-warning/10 text-warning border-warning/20',
  overdue: 'bg-destructive/10 text-destructive border-destructive/20',
};

const Invoices = () => {
  const { t, language } = useLanguage();
  const { isAdmin, isOwner, isTenant, userFlatId, userFlatIds } = useAuth();
  const { data: invoices, isLoading } = useInvoices();
  const { data: owners } = useOwners();
  const { data: tenants } = useTenants();
  const { data: flats } = useFlats();
  const updateInvoice = useUpdateInvoice();
  const deleteInvoice = useDeleteInvoice();
  const downloadReceipt = useDownloadRentReceipt();
  const submitPayment = useSubmitPaymentIntent();
  const [payIntentInvoice, setPayIntentInvoice] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({
    method: 'bkash' as PaymentMethod,
    reference: '',
    payer_phone: '',
    notes: '',
  });

  const handleDownloadReceipt = (invoiceId: string) => {
    downloadReceipt.mutate(
      { invoiceId },
      {
        onError: (err) => {
          toast({
            title: language === 'bn' ? 'ত্রুটি' : 'Error',
            description: err instanceof Error ? err.message : 'Failed to generate receipt',
            variant: 'destructive',
          });
        },
      },
    );
  };
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [manualFormOpen, setManualFormOpen] = useState(false);
  const [editInvoice, setEditInvoice] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);

  const statusLabels = {
    paid: t.invoices.statusPaid,
    unpaid: t.invoices.statusUnpaid,
    overdue: t.invoices.statusOverdue,
  };

  // Filter invoices based on role
  const roleFilteredInvoices = invoices?.filter(invoice => {
    // Admin sees all
    if (isAdmin) return true;
    // Owner sees invoices for all their flats
    if (isOwner && userFlatIds.length > 0) {
      return userFlatIds.includes(invoice.flat_id);
    }
    // Tenant sees only their flat invoices
    if (isTenant && userFlatId) {
      return invoice.flat_id === userFlatId;
    }
    return true; // Regular user sees all (can be restricted later)
  }) || [];

  const filteredInvoices = roleFilteredInvoices.filter(invoice => {
    const matchesSearch = (invoice as any).flats?.flat_number?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getOwner = (flatId: string) => owners?.find(o => o.flat_id === flatId);
  const getTenant = (flatId: string) => tenants?.find(t => t.flat_id === flatId);
  const getFlat = (flatId: string) => flats?.find(f => f.id === flatId);

  // Get bill payer based on flat status
  const getBillPayBy = (flatId: string) => {
    const flat = getFlat(flatId);
    const owner = getOwner(flatId);
    const tenant = getTenant(flatId);
    
    if (flat?.status === 'tenant' && tenant) {
      return tenant.name;
    }
    // For owner-occupied or vacant, owner pays
    return owner?.name || '-';
  };

  const getBillTypeLabel = (invoiceType: string) => {
    if (language === 'bn') {
      return invoiceType === 'rent' ? 'ভাড়া' : 
             invoiceType === 'service_charge' ? 'সার্ভিস চার্জ' : 'অন্যান্য';
    }
    return invoiceType === 'rent' ? 'Rent' : 
           invoiceType === 'service_charge' ? 'Service Charge' : 'Others';
  };

  // Can record payment: Admin or Owner (for their flats)
  const canRecordPayment = (flatId: string) => {
    if (isAdmin) return true;
    if (isOwner && userFlatIds.includes(flatId)) return true;
    return false;
  };
  const totalDue = filteredInvoices
    .filter(inv => inv.status !== 'paid')
    .reduce((sum, inv) => sum + Number(inv.amount), 0);

  const totalInvoices = roleFilteredInvoices.length;
  const paidCount = roleFilteredInvoices.filter(i => i.status === 'paid').length;
  const collectionRate = totalInvoices > 0 ? Math.round((paidCount / totalInvoices) * 100) : 0;

  const handleRecordPayment = async (invoice: any) => {
    await updateInvoice.mutateAsync({
      id: invoice.id,
      status: 'paid',
      paid_date: new Date().toISOString().split('T')[0],
    });
  };

  const handleDeleteInvoice = async () => {
    if (invoiceToDelete) {
      await deleteInvoice.mutateAsync(invoiceToDelete);
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
    }
  };

  const confirmDelete = (id: string) => {
    setInvoiceToDelete(id);
    setDeleteDialogOpen(true);
  };

  const locale = language === 'bn' ? 'bn-BD' : 'en-US';

  return (
    <MainLayout>
      <Header 
        title={t.invoices.title} 
        subtitle={t.invoices.subtitle}
      />
      
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stat-card">
            <p className="text-sm text-muted-foreground">{t.invoices.totalInvoices}</p>
            <p className="text-2xl font-bold mt-1">{totalInvoices}</p>
          </div>
          <div className="stat-card bg-warning/5">
            <p className="text-sm text-muted-foreground">{t.invoices.pendingAmount}</p>
            <p className="text-2xl font-bold mt-1 text-warning">{formatBDT(totalDue)}</p>
          </div>
          <div className="stat-card bg-success/5">
            <p className="text-sm text-muted-foreground">{t.invoices.collectionRate}</p>
            <p className="text-2xl font-bold mt-1 text-success">{collectionRate}%</p>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-1 gap-3 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.invoices.searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder={t.common.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.common.all}</SelectItem>
                <SelectItem value="paid">{t.invoices.statusPaid}</SelectItem>
                <SelectItem value="unpaid">{t.invoices.statusUnpaid}</SelectItem>
                <SelectItem value="overdue">{t.invoices.statusOverdue}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Admin can generate bulk invoices, Admin and Owner can add individual invoices */}
          {(isAdmin || isOwner) && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setManualFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {language === 'en' ? 'Add Invoice' : 'বিল যুক্ত করুন'}
              </Button>
              {isAdmin && (
                <Button onClick={() => setFormOpen(true)}>
                  <FileText className="h-4 w-4 mr-2" />
                  {t.invoices.generateInvoice}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Invoices Table */}
        <div className="stat-card overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>{t.common.noData}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="table-header">
                  <TableHead>{t.invoices.invoiceNo}</TableHead>
                  <TableHead>{t.invoices.flat}</TableHead>
                  <TableHead>{language === 'bn' ? 'বিল প্রদানকারী' : 'Bill Pay By'}</TableHead>
                  <TableHead>{language === 'bn' ? 'বিলের ধরন' : 'Bill Type'}</TableHead>
                  <TableHead>{t.invoices.period}</TableHead>
                  <TableHead>{t.common.amount}</TableHead>
                  <TableHead>{t.invoices.dueDate}</TableHead>
                  <TableHead>{t.common.status}</TableHead>
                  {(isAdmin || isOwner) && <TableHead className="text-right">{t.common.actions}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice: any) => {
                  return (
                    <TableRow key={invoice.id} className="table-row-hover">
                      <TableCell className="font-mono text-sm">INV-{invoice.id.slice(0, 6)}</TableCell>
                      <TableCell className="font-medium">{invoice.flats?.flat_number}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {getBillPayBy(invoice.flat_id)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {getBillTypeLabel(invoice.invoice_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>{invoice.month} {invoice.year}</TableCell>
                      <TableCell className="font-semibold">{formatBDT(invoice.amount)}</TableCell>
                      <TableCell>{new Date(invoice.due_date).toLocaleDateString(locale)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[invoice.status as keyof typeof statusColors]}>
                          {statusLabels[invoice.status as keyof typeof statusLabels]}
                        </Badge>
                      </TableCell>
                      {(isAdmin || isOwner || isTenant) && (
                        <TableCell className="text-right">
                          {isAdmin ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {invoice.status !== 'paid' && (
                                  <DropdownMenuItem onClick={() => handleRecordPayment(invoice)}>
                                    <Check className="h-4 w-4 mr-2" />
                                    {language === 'bn' ? 'অনুমোদন করুন' : 'Approve'}
                                  </DropdownMenuItem>
                                )}
                                {invoice.status === 'paid' && (
                                  <DropdownMenuItem
                                    onClick={() => handleDownloadReceipt(invoice.id)}
                                    disabled={downloadReceipt.isPending}
                                  >
                                    {downloadReceipt.isPending ? (
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                      <Download className="h-4 w-4 mr-2" />
                                    )}
                                    {language === 'bn' ? 'রসিদ ডাউনলোড' : 'Download receipt'}
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => setEditInvoice(invoice)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  {language === 'bn' ? 'সম্পাদনা' : 'Edit'}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => confirmDelete(invoice.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {language === 'bn' ? 'মুছুন' : 'Delete'}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <div className="flex gap-1 justify-end">
                              {invoice.status !== 'paid' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setPayIntentInvoice(invoice);
                                    setPaymentForm({
                                      method: 'bkash',
                                      reference: '',
                                      payer_phone: '',
                                      notes: '',
                                    });
                                  }}
                                >
                                  <Wallet className="h-4 w-4 mr-1" />
                                  {language === 'bn' ? 'আমি পরিশোধ করেছি' : 'I paid'}
                                </Button>
                              )}
                              {isOwner && invoice.status !== 'paid' && canRecordPayment(invoice.flat_id) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRecordPayment(invoice)}
                                  disabled={updateInvoice.isPending}
                                >
                                  {t.invoices.recordPayment}
                                </Button>
                              )}
                              {invoice.status === 'paid' && (
                                <>
                                  <span className="text-xs text-muted-foreground self-center">
                                    {invoice.paid_date && new Date(invoice.paid_date).toLocaleDateString(locale)}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDownloadReceipt(invoice.id)}
                                    disabled={downloadReceipt.isPending}
                                    title={language === 'bn' ? 'রসিদ' : 'Receipt'}
                                  >
                                    <Download className="h-4 w-4" aria-hidden="true" />
                                  </Button>
                                </>
                              )}
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Payment submission dialog (tenant / owner submits an intent; committee approves) */}
      <Dialog
        open={!!payIntentInvoice}
        onOpenChange={(v) => !v && setPayIntentInvoice(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {language === 'bn' ? 'পেমেন্ট জমা দিন' : 'Submit payment'}
            </DialogTitle>
            <DialogDescription>
              {language === 'bn'
                ? 'আপনার পেমেন্টের বিবরণ দিন। কমিটি যাচাই করে অনুমোদন করবে।'
                : "Enter your payment details. The committee will verify and approve."}
            </DialogDescription>
          </DialogHeader>
          {payIntentInvoice && (
            <div className="space-y-3">
              <div className="rounded-md bg-muted/40 p-3 text-sm flex justify-between">
                <span className="text-muted-foreground">
                  {payIntentInvoice.month} {payIntentInvoice.year}
                </span>
                <span className="font-semibold">{formatBDT(payIntentInvoice.amount)}</span>
              </div>
              <div>
                <Label>{language === 'bn' ? 'পদ্ধতি' : 'Method'}</Label>
                <Select
                  value={paymentForm.method}
                  onValueChange={(v) =>
                    setPaymentForm((f) => ({ ...f, method: v as PaymentMethod }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bkash">bKash</SelectItem>
                    <SelectItem value="nagad">Nagad</SelectItem>
                    <SelectItem value="rocket">Rocket</SelectItem>
                    <SelectItem value="bank">Bank</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{language === 'bn' ? 'ট্রানজেকশন রেফারেন্স' : 'Transaction reference'}</Label>
                <Input
                  placeholder="TrxID / bank ref"
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm((f) => ({ ...f, reference: e.target.value }))}
                />
              </div>
              <div>
                <Label>{language === 'bn' ? 'ফোন (যে নম্বর থেকে পাঠানো হয়েছে)' : 'Sender phone'}</Label>
                <Input
                  placeholder="01XXXXXXXXX"
                  value={paymentForm.payer_phone}
                  onChange={(e) => setPaymentForm((f) => ({ ...f, payer_phone: e.target.value }))}
                />
              </div>
              <div>
                <Label>{language === 'bn' ? 'নোট' : 'Notes'}</Label>
                <Input
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayIntentInvoice(null)}>
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button
              disabled={submitPayment.isPending || !payIntentInvoice}
              onClick={async () => {
                if (!payIntentInvoice) return;
                try {
                  await submitPayment.mutateAsync({
                    invoice_id: payIntentInvoice.id,
                    amount: Number(payIntentInvoice.amount),
                    method: paymentForm.method,
                    reference: paymentForm.reference || undefined,
                    payer_phone: paymentForm.payer_phone || undefined,
                    notes: paymentForm.notes || undefined,
                  });
                  toast({
                    title: language === 'bn' ? 'জমা দেওয়া হয়েছে' : 'Submitted',
                    description:
                      language === 'bn'
                        ? 'কমিটির অনুমোদনের অপেক্ষায়।'
                        : 'Awaiting committee approval.',
                  });
                  setPayIntentInvoice(null);
                } catch (err) {
                  toast({
                    title: language === 'bn' ? 'ত্রুটি' : 'Error',
                    description: err instanceof Error ? err.message : String(err),
                    variant: 'destructive',
                  });
                }
              }}
            >
              {submitPayment.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {language === 'bn' ? 'জমা দিন' : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <InvoiceForm open={formOpen} onOpenChange={setFormOpen} />
      <ManualInvoiceForm 
        open={manualFormOpen || !!editInvoice} 
        onOpenChange={(open) => {
          setManualFormOpen(open);
          if (!open) setEditInvoice(null);
        }}
        editData={editInvoice}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'bn' ? 'বিল মুছে ফেলতে চান?' : 'Delete Invoice?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'bn' 
                ? 'এই বিলটি স্থায়ীভাবে মুছে ফেলা হবে। এই ক্রিয়াটি পূর্বাবস্থায় ফেরানো যাবে না।' 
                : 'This invoice will be permanently deleted. This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === 'bn' ? 'বাতিল' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteInvoice}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {language === 'bn' ? 'মুছুন' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default Invoices;