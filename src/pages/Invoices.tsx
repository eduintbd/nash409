import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { mockInvoices, mockFlats, mockOwners } from '@/data/mockData';
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
import { Search, Plus, Download, Send } from 'lucide-react';

const statusColors = {
  paid: 'bg-success/10 text-success border-success/20',
  unpaid: 'bg-warning/10 text-warning border-warning/20',
  overdue: 'bg-destructive/10 text-destructive border-destructive/20',
};

const Invoices = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredInvoices = mockInvoices.filter(invoice => {
    const flat = mockFlats.find(f => f.id === invoice.flatId);
    const matchesSearch = flat?.flatNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getFlat = (flatId: string) => mockFlats.find(f => f.id === flatId);
  const getOwner = (flatId: string) => mockOwners.find(o => o.flatId === flatId);

  const totalDue = filteredInvoices
    .filter(inv => inv.status !== 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <MainLayout>
      <Header 
        title="Invoices" 
        subtitle="Manage monthly maintenance and billing"
      />
      
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stat-card">
            <p className="text-sm text-muted-foreground">Total Invoices</p>
            <p className="text-2xl font-bold mt-1">{mockInvoices.length}</p>
          </div>
          <div className="stat-card bg-warning/5">
            <p className="text-sm text-muted-foreground">Pending Amount</p>
            <p className="text-2xl font-bold mt-1 text-warning">₹{totalDue.toLocaleString()}</p>
          </div>
          <div className="stat-card bg-success/5">
            <p className="text-sm text-muted-foreground">Collection Rate</p>
            <p className="text-2xl font-bold mt-1 text-success">
              {Math.round((mockInvoices.filter(i => i.status === 'paid').length / mockInvoices.length) * 100)}%
            </p>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-1 gap-3 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by flat..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline">
              <Send className="h-4 w-4 mr-2" />
              Send Reminders
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Generate Invoice
            </Button>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="stat-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="table-header">
                <TableHead>Invoice #</TableHead>
                <TableHead>Flat</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => {
                const flat = getFlat(invoice.flatId);
                const owner = getOwner(invoice.flatId);

                return (
                  <TableRow key={invoice.id} className="table-row-hover">
                    <TableCell className="font-mono text-sm">INV-{invoice.id.padStart(4, '0')}</TableCell>
                    <TableCell className="font-medium">{flat?.flatNumber}</TableCell>
                    <TableCell className="text-muted-foreground">{owner?.name}</TableCell>
                    <TableCell>{invoice.month} {invoice.year}</TableCell>
                    <TableCell className="font-semibold">₹{invoice.amount.toLocaleString()}</TableCell>
                    <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[invoice.status]}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        {invoice.status === 'paid' ? 'View Receipt' : 'Record Payment'}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </MainLayout>
  );
};

export default Invoices;
