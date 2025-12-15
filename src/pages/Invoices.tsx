import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { useInvoices, useUpdateInvoice } from '@/hooks/useInvoices';
import { useOwners } from '@/hooks/useOwners';
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
import { Search, Plus, Download } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatBDT } from '@/lib/currency';

const statusColors = {
  paid: 'bg-success/10 text-success border-success/20',
  unpaid: 'bg-warning/10 text-warning border-warning/20',
  overdue: 'bg-destructive/10 text-destructive border-destructive/20',
};

const statusLabels = {
  paid: 'পরিশোধিত',
  unpaid: 'বকেয়া',
  overdue: 'মেয়াদোত্তীর্ণ',
};

const Invoices = () => {
  const { data: invoices, isLoading } = useInvoices();
  const { data: owners } = useOwners();
  const updateInvoice = useUpdateInvoice();
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formOpen, setFormOpen] = useState(false);

  const filteredInvoices = invoices?.filter(invoice => {
    const matchesSearch = (invoice as any).flats?.flat_number?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const getOwner = (flatId: string) => owners?.find(o => o.flat_id === flatId);

  const totalDue = filteredInvoices
    .filter(inv => inv.status !== 'paid')
    .reduce((sum, inv) => sum + Number(inv.amount), 0);

  const totalInvoices = invoices?.length || 0;
  const paidCount = invoices?.filter(i => i.status === 'paid').length || 0;
  const collectionRate = totalInvoices > 0 ? Math.round((paidCount / totalInvoices) * 100) : 0;

  const handleRecordPayment = async (invoice: any) => {
    await updateInvoice.mutateAsync({
      id: invoice.id,
      status: 'paid',
      paid_date: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <MainLayout>
      <Header 
        title="বিল ও ইনভয়েস" 
        subtitle="মাসিক সার্ভিস চার্জ ব্যবস্থাপনা"
      />
      
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stat-card">
            <p className="text-sm text-muted-foreground">মোট বিল</p>
            <p className="text-2xl font-bold mt-1">{totalInvoices}</p>
          </div>
          <div className="stat-card bg-warning/5">
            <p className="text-sm text-muted-foreground">বকেয়া পরিমাণ</p>
            <p className="text-2xl font-bold mt-1 text-warning">{formatBDT(totalDue)}</p>
          </div>
          <div className="stat-card bg-success/5">
            <p className="text-sm text-muted-foreground">আদায় হার</p>
            <p className="text-2xl font-bold mt-1 text-success">{collectionRate}%</p>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-1 gap-3 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ফ্ল্যাট দিয়ে খুঁজুন..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="অবস্থা" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সকল</SelectItem>
                <SelectItem value="paid">পরিশোধিত</SelectItem>
                <SelectItem value="unpaid">বকেয়া</SelectItem>
                <SelectItem value="overdue">মেয়াদোত্তীর্ণ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              বিল তৈরি করুন
            </Button>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="stat-card overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>কোনো বিল নেই</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="table-header">
                  <TableHead>বিল নং</TableHead>
                  <TableHead>ফ্ল্যাট</TableHead>
                  <TableHead>মালিক</TableHead>
                  <TableHead>মাস/বছর</TableHead>
                  <TableHead>পরিমাণ</TableHead>
                  <TableHead>নির্ধারিত তারিখ</TableHead>
                  <TableHead>অবস্থা</TableHead>
                  <TableHead className="text-right">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice: any) => {
                  const owner = getOwner(invoice.flat_id);
                  return (
                    <TableRow key={invoice.id} className="table-row-hover">
                      <TableCell className="font-mono text-sm">INV-{invoice.id.slice(0, 6)}</TableCell>
                      <TableCell className="font-medium">{invoice.flats?.flat_number}</TableCell>
                      <TableCell className="text-muted-foreground">{owner?.name || '-'}</TableCell>
                      <TableCell>{invoice.month} {invoice.year}</TableCell>
                      <TableCell className="font-semibold">{formatBDT(invoice.amount)}</TableCell>
                      <TableCell>{new Date(invoice.due_date).toLocaleDateString('bn-BD')}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[invoice.status as keyof typeof statusColors]}>
                          {statusLabels[invoice.status as keyof typeof statusLabels]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {invoice.status !== 'paid' ? (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleRecordPayment(invoice)}
                            disabled={updateInvoice.isPending}
                          >
                            পেমেন্ট রেকর্ড
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {invoice.paid_date && new Date(invoice.paid_date).toLocaleDateString('bn-BD')}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <InvoiceForm open={formOpen} onOpenChange={setFormOpen} />
    </MainLayout>
  );
};

export default Invoices;
