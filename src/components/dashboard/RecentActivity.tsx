import { mockServiceRequests, mockInvoices, mockFlats, mockOwners } from '@/data/mockData';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, Receipt } from 'lucide-react';

const statusIcons = {
  open: AlertCircle,
  'in-progress': Clock,
  resolved: CheckCircle,
  closed: CheckCircle,
};

const statusColors = {
  open: 'bg-warning/10 text-warning border-warning/20',
  'in-progress': 'bg-primary/10 text-primary border-primary/20',
  resolved: 'bg-success/10 text-success border-success/20',
  closed: 'bg-muted text-muted-foreground border-border',
};

export function RecentActivity() {
  const recentRequests = mockServiceRequests.slice(0, 3);
  const overdueInvoices = mockInvoices.filter(inv => inv.status === 'overdue' || inv.status === 'unpaid').slice(0, 3);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Service Requests */}
      <div className="stat-card">
        <h3 className="text-lg font-semibold mb-4">Recent Service Requests</h3>
        <div className="space-y-4">
          {recentRequests.map((request) => {
            const flat = mockFlats.find(f => f.id === request.flatId);
            const StatusIcon = statusIcons[request.status];
            return (
              <div key={request.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <div className={`p-2 rounded-lg ${statusColors[request.status]}`}>
                  <StatusIcon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{request.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {flat?.flatNumber} • {request.category}
                  </p>
                </div>
                <Badge variant="outline" className={statusColors[request.status]}>
                  {request.status}
                </Badge>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending Payments */}
      <div className="stat-card">
        <h3 className="text-lg font-semibold mb-4">Pending Payments</h3>
        <div className="space-y-4">
          {overdueInvoices.map((invoice) => {
            const flat = mockFlats.find(f => f.id === invoice.flatId);
            const owner = mockOwners.find(o => o.flatId === invoice.flatId);
            return (
              <div key={invoice.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <div className={`p-2 rounded-lg ${invoice.status === 'overdue' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>
                  <Receipt className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{flat?.flatNumber} - {owner?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {invoice.month} {invoice.year} • Due: {invoice.dueDate}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">₹{invoice.amount.toLocaleString()}</p>
                  <Badge variant="outline" className={invoice.status === 'overdue' ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-warning/10 text-warning border-warning/20'}>
                    {invoice.status}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
