import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { useServiceRequests, useUpdateServiceRequest, useDeleteServiceRequest } from '@/hooks/useServiceRequests';
import { useOwners } from '@/hooks/useOwners';
import { useFlats } from '@/hooks/useFlats';
import { useCreateInvoice } from '@/hooks/useInvoices';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ServiceRequestForm } from '@/components/forms/ServiceRequestForm';
import { Search, Plus, AlertCircle, Clock, CheckCircle, Building2, Trash2, Ticket, Receipt } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
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
import { formatBDT } from '@/lib/currency';

const ServiceRequests = () => {
  const { t, language } = useLanguage();
  const { isAdmin, isOwner, isTenant, userFlatId } = useAuth();
  const { data: requests, isLoading } = useServiceRequests();
  const { data: owners } = useOwners();
  const { data: flats } = useFlats();
  const updateRequest = useUpdateServiceRequest();
  const deleteRequest = useDeleteServiceRequest();
  const createInvoice = useCreateInvoice();
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Close dialog state
  const [closeDialog, setCloseDialog] = useState<{ open: boolean; request: any | null }>({ open: false, request: null });
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [createInvoiceForRequest, setCreateInvoiceForRequest] = useState(false);
  const [invoiceCost, setInvoiceCost] = useState('');

  const statusConfig = {
    open: { icon: AlertCircle, color: 'bg-warning/10 text-warning border-warning/20', label: t.serviceRequests.open },
    'in-progress': { icon: Clock, color: 'bg-primary/10 text-primary border-primary/20', label: t.serviceRequests.inProgress },
    resolved: { icon: CheckCircle, color: 'bg-success/10 text-success border-success/20', label: t.serviceRequests.resolved },
    closed: { icon: CheckCircle, color: 'bg-muted text-muted-foreground border-border', label: t.serviceRequests.closed },
  };

  const priorityConfig = {
    low: { color: 'bg-muted text-muted-foreground', label: t.serviceRequests.priLow },
    medium: { color: 'bg-blue-100 text-blue-700', label: t.serviceRequests.priMedium },
    high: { color: 'bg-orange-100 text-orange-700', label: t.serviceRequests.priHigh },
    urgent: { color: 'bg-red-100 text-red-700', label: t.serviceRequests.priUrgent },
  };

  const categoryLabels: Record<string, string> = {
    plumbing: t.serviceRequests.catPlumbing,
    electrical: t.serviceRequests.catElectrical,
    elevator: t.serviceRequests.catElevator,
    'common-area': t.serviceRequests.catCommonArea,
    other: t.serviceRequests.catOther,
  };

  // Filter requests based on role
  const roleFilteredRequests = requests?.filter(request => {
    // Admin sees all
    if (isAdmin) return true;
    // Owner/Tenant sees only their flat requests
    if ((isOwner || isTenant) && userFlatId) {
      return request.flat_id === userFlatId;
    }
    return true;
  }) || [];

  const filteredRequests = roleFilteredRequests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(search.toLowerCase()) || 
                          `TKT-${request.ticket_number}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getOwner = (flatId: string) => owners?.find(o => o.flat_id === flatId);

  const openCount = roleFilteredRequests.filter(r => r.status === 'open').length;
  const inProgressCount = roleFilteredRequests.filter(r => r.status === 'in-progress').length;
  const resolvedCount = roleFilteredRequests.filter(r => r.status === 'resolved' || r.status === 'closed').length;

  const handleStatusChange = async (id: string, newStatus: string, request?: any) => {
    // If closing, open the close dialog
    if (newStatus === 'closed' && isAdmin && request) {
      setCloseDialog({ open: true, request });
      setResolutionNotes('');
      setCreateInvoiceForRequest(false);
      setInvoiceCost(request.cost?.toString() || '');
      return;
    }
    
    const updates: any = { id, status: newStatus };
    if (newStatus === 'resolved') {
      updates.resolved_at = new Date().toISOString();
    }
    await updateRequest.mutateAsync(updates);
  };

  const handleCloseRequest = async () => {
    if (!closeDialog.request) return;
    
    const request = closeDialog.request;
    let invoiceId: string | null = null;
    
    // Create invoice if requested
    if (createInvoiceForRequest && invoiceCost) {
      const currentDate = new Date();
      const flat = flats?.find(f => f.id === request.flat_id);
      
      const invoice = await createInvoice.mutateAsync({
        flat_id: request.flat_id,
        amount: parseFloat(invoiceCost),
        month: currentDate.toLocaleString('default', { month: 'long' }),
        year: currentDate.getFullYear(),
        due_date: new Date(currentDate.setDate(currentDate.getDate() + 15)).toISOString().split('T')[0],
        status: 'unpaid',
        paid_date: null,
        description: `Service Request TKT-${request.ticket_number}: ${request.title}`,
        invoice_type: 'service_request',
      });
      invoiceId = invoice.id;
    }
    
    // Update service request
    await updateRequest.mutateAsync({
      id: request.id,
      status: 'closed',
      resolution_notes: resolutionNotes || null,
      invoice_id: invoiceId,
      cost: invoiceCost ? parseFloat(invoiceCost) : request.cost,
    });
    
    setCloseDialog({ open: false, request: null });
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteRequest.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const locale = language === 'bn' ? 'bn-BD' : 'en-US';

  return (
    <MainLayout>
      <Header 
        title={t.serviceRequests.title} 
        subtitle={t.serviceRequests.subtitle}
      />
      
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card bg-warning/5">
            <p className="text-sm text-muted-foreground">{t.serviceRequests.open}</p>
            <p className="text-2xl font-bold mt-1 text-warning">{openCount}</p>
          </div>
          <div className="stat-card bg-primary/5">
            <p className="text-sm text-muted-foreground">{t.serviceRequests.inProgress}</p>
            <p className="text-2xl font-bold mt-1 text-primary">{inProgressCount}</p>
          </div>
          <div className="stat-card bg-success/5">
            <p className="text-sm text-muted-foreground">{t.serviceRequests.resolved}</p>
            <p className="text-2xl font-bold mt-1 text-success">{resolvedCount}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground">{t.serviceRequests.total}</p>
            <p className="text-2xl font-bold mt-1">{roleFilteredRequests.length}</p>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-1 gap-3 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.serviceRequests.searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t.common.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.common.all}</SelectItem>
                <SelectItem value="open">{t.serviceRequests.open}</SelectItem>
                <SelectItem value="in-progress">{t.serviceRequests.inProgress}</SelectItem>
                <SelectItem value="resolved">{t.serviceRequests.resolved}</SelectItem>
                <SelectItem value="closed">{t.serviceRequests.closed}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t.serviceRequests.newRequest}
          </Button>
        </div>

        {/* Requests Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48" />)}
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>{t.serviceRequests.noRequests}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredRequests.map((request: any) => {
              const owner = getOwner(request.flat_id);
              const StatusIcon = statusConfig[request.status as keyof typeof statusConfig]?.icon || AlertCircle;

              return (
                <Card key={request.id} className="stat-card border-0">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${statusConfig[request.status as keyof typeof statusConfig]?.color}`}>
                          <StatusIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs font-mono">
                              <Ticket className="h-3 w-3 mr-1" />
                              TKT-{request.ticket_number}
                            </Badge>
                          </div>
                          <CardTitle className="text-base leading-tight mt-1">{request.title}</CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <Building2 className="h-3 w-3" />
                            {request.flats?.flat_number} • {owner?.name || (language === 'bn' ? 'অজানা' : 'Unknown')}
                          </CardDescription>
                        </div>
                      </div>
                      {isAdmin && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(request.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {request.description || t.serviceRequests.noDescription}
                    </p>
                    
                    {/* Show resolution notes for closed requests */}
                    {request.status === 'closed' && request.resolution_notes && (
                      <div className="p-2 bg-muted/50 rounded-md text-sm">
                        <span className="font-medium">{language === 'bn' ? 'মন্তব্য:' : 'Resolution:'}</span>{' '}
                        {request.resolution_notes}
                      </div>
                    )}
                    
                    {/* Show invoice link if created */}
                    {request.invoice_id && (
                      <div className="flex items-center gap-2 text-sm text-primary">
                        <Receipt className="h-4 w-4" />
                        {language === 'bn' ? 'চালান তৈরি করা হয়েছে' : 'Invoice created'}
                        {request.cost && ` - ${formatBDT(request.cost)}`}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={statusConfig[request.status as keyof typeof statusConfig]?.color}>
                          {statusConfig[request.status as keyof typeof statusConfig]?.label}
                        </Badge>
                        <Badge className={priorityConfig[request.priority as keyof typeof priorityConfig]?.color}>
                          {priorityConfig[request.priority as keyof typeof priorityConfig]?.label}
                        </Badge>
                      </div>
                      <Badge variant="outline">{categoryLabels[request.category] || request.category}</Badge>
                    </div>
                    
                    {isAdmin && request.status !== 'closed' && (
                      <div className="pt-2 border-t">
                        <Select 
                          value={request.status} 
                          onValueChange={(v) => handleStatusChange(request.id, v, request)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">{t.serviceRequests.open}</SelectItem>
                            <SelectItem value="in-progress">{t.serviceRequests.inProgress}</SelectItem>
                            <SelectItem value="resolved">{t.serviceRequests.resolved}</SelectItem>
                            <SelectItem value="closed">{t.serviceRequests.closed}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    <div className="text-xs text-muted-foreground flex justify-between">
                      <span>{t.serviceRequests.created}: {new Date(request.created_at).toLocaleDateString(locale)}</span>
                      {request.employees?.name && <span>{t.serviceRequests.assignedTo}: {request.employees.name}</span>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <ServiceRequestForm open={formOpen} onOpenChange={setFormOpen} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.common.confirmDelete}</AlertDialogTitle>
            <AlertDialogDescription>{t.common.deleteWarning}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">{t.common.delete}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Close Request Dialog */}
      <Dialog open={closeDialog.open} onOpenChange={(open) => setCloseDialog({ open, request: open ? closeDialog.request : null })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {language === 'bn' ? 'টিকেট বন্ধ করুন' : 'Close Ticket'}
            </DialogTitle>
            <DialogDescription>
              {closeDialog.request && (
                <span className="font-mono">TKT-{closeDialog.request.ticket_number}</span>
              )}
              {' - '}
              {language === 'bn' 
                ? 'সমাধানের মন্তব্য যোগ করুন এবং প্রয়োজনে চালান তৈরি করুন।' 
                : 'Add resolution notes and create an invoice if needed.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{language === 'bn' ? 'সমাধানের মন্তব্য' : 'Resolution Notes'}</Label>
              <Textarea
                placeholder={language === 'bn' ? 'কাজ সম্পন্ন হওয়ার বিবরণ লিখুন...' : 'Describe how the issue was resolved...'}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="createInvoice"
                checked={createInvoiceForRequest}
                onCheckedChange={(checked) => setCreateInvoiceForRequest(checked as boolean)}
              />
              <Label htmlFor="createInvoice" className="text-sm font-normal cursor-pointer">
                {language === 'bn' ? 'এই টিকেটের জন্য চালান তৈরি করুন' : 'Create invoice for this ticket'}
              </Label>
            </div>
            
            {createInvoiceForRequest && (
              <div className="space-y-2 pl-6">
                <Label>{language === 'bn' ? 'খরচ' : 'Cost'}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">৳</span>
                  <Input
                    type="number"
                    placeholder="0"
                    value={invoiceCost}
                    onChange={(e) => setInvoiceCost(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseDialog({ open: false, request: null })}>
              {t.common.cancel}
            </Button>
            <Button onClick={handleCloseRequest} disabled={updateRequest.isPending || createInvoice.isPending}>
              {language === 'bn' ? 'টিকেট বন্ধ করুন' : 'Close Ticket'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default ServiceRequests;