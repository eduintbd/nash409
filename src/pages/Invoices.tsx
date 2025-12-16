import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { useInvoices, useUpdateInvoice } from '@/hooks/useInvoices';
import { useOwners } from '@/hooks/useOwners';
import { useTenants } from '@/hooks/useTenants';
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
import { Search, Plus, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatBDT } from '@/lib/currency';

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
  const updateInvoice = useUpdateInvoice();
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [manualFormOpen, setManualFormOpen] = useState(false);

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
                  <TableHead>{isOwner ? (language === 'bn' ? 'ভাড়াটিয়া' : 'Tenant') : t.flats.owner}</TableHead>
                  <TableHead>{t.invoices.period}</TableHead>
                  <TableHead>{t.common.amount}</TableHead>
                  <TableHead>{t.invoices.dueDate}</TableHead>
                  <TableHead>{t.common.status}</TableHead>
                  {(isAdmin || isOwner) && <TableHead className="text-right">{t.common.actions}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice: any) => {
                  const owner = getOwner(invoice.flat_id);
                  const tenant = getTenant(invoice.flat_id);
                  return (
                    <TableRow key={invoice.id} className="table-row-hover">
                      <TableCell className="font-mono text-sm">INV-{invoice.id.slice(0, 6)}</TableCell>
                      <TableCell className="font-medium">{invoice.flats?.flat_number}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {isOwner ? (tenant?.name || '-') : (owner?.name || '-')}
                      </TableCell>
                      <TableCell>{invoice.month} {invoice.year}</TableCell>
                      <TableCell className="font-semibold">{formatBDT(invoice.amount)}</TableCell>
                      <TableCell>{new Date(invoice.due_date).toLocaleDateString(locale)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[invoice.status as keyof typeof statusColors]}>
                          {statusLabels[invoice.status as keyof typeof statusLabels]}
                        </Badge>
                      </TableCell>
                      {(isAdmin || isOwner) && (
                        <TableCell className="text-right">
                          {invoice.status !== 'paid' && canRecordPayment(invoice.flat_id) ? (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleRecordPayment(invoice)}
                              disabled={updateInvoice.isPending}
                            >
                              {t.invoices.recordPayment}
                            </Button>
                          ) : invoice.status === 'paid' ? (
                            <span className="text-xs text-muted-foreground">
                              {invoice.paid_date && new Date(invoice.paid_date).toLocaleDateString(locale)}
                            </span>
                          ) : null}
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

      <InvoiceForm open={formOpen} onOpenChange={setFormOpen} />
      <ManualInvoiceForm open={manualFormOpen} onOpenChange={setManualFormOpen} />
    </MainLayout>
  );
};

export default Invoices;