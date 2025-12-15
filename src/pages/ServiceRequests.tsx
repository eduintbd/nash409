import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { useServiceRequests, useUpdateServiceRequest, useDeleteServiceRequest } from '@/hooks/useServiceRequests';
import { useOwners } from '@/hooks/useOwners';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ServiceRequestForm } from '@/components/forms/ServiceRequestForm';
import { Search, Plus, AlertCircle, Clock, CheckCircle, Building2, Trash2 } from 'lucide-react';
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

const statusConfig = {
  open: { icon: AlertCircle, color: 'bg-warning/10 text-warning border-warning/20', label: 'খোলা' },
  'in-progress': { icon: Clock, color: 'bg-primary/10 text-primary border-primary/20', label: 'চলমান' },
  resolved: { icon: CheckCircle, color: 'bg-success/10 text-success border-success/20', label: 'সমাধান' },
  closed: { icon: CheckCircle, color: 'bg-muted text-muted-foreground border-border', label: 'বন্ধ' },
};

const priorityConfig = {
  low: { color: 'bg-muted text-muted-foreground', label: 'কম' },
  medium: { color: 'bg-blue-100 text-blue-700', label: 'মাঝারি' },
  high: { color: 'bg-orange-100 text-orange-700', label: 'উচ্চ' },
  urgent: { color: 'bg-red-100 text-red-700', label: 'জরুরি' },
};

const categoryLabels: Record<string, string> = {
  plumbing: 'প্লাম্বিং',
  electrical: 'ইলেকট্রিক্যাল',
  elevator: 'লিফট',
  'common-area': 'কমন এরিয়া',
  other: 'অন্যান্য',
};

const ServiceRequests = () => {
  const { data: requests, isLoading } = useServiceRequests();
  const { data: owners } = useOwners();
  const updateRequest = useUpdateServiceRequest();
  const deleteRequest = useDeleteServiceRequest();
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredRequests = requests?.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const getOwner = (flatId: string) => owners?.find(o => o.flat_id === flatId);

  const openCount = requests?.filter(r => r.status === 'open').length || 0;
  const inProgressCount = requests?.filter(r => r.status === 'in-progress').length || 0;
  const resolvedCount = requests?.filter(r => r.status === 'resolved' || r.status === 'closed').length || 0;

  const handleStatusChange = async (id: string, newStatus: string) => {
    const updates: any = { id, status: newStatus };
    if (newStatus === 'resolved') {
      updates.resolved_at = new Date().toISOString();
    }
    await updateRequest.mutateAsync(updates);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteRequest.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <MainLayout>
      <Header 
        title="সার্ভিস অনুরোধ" 
        subtitle="মেরামত ও রক্ষণাবেক্ষণ অনুরোধ ট্র্যাক করুন"
      />
      
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card bg-warning/5">
            <p className="text-sm text-muted-foreground">খোলা</p>
            <p className="text-2xl font-bold mt-1 text-warning">{openCount}</p>
          </div>
          <div className="stat-card bg-primary/5">
            <p className="text-sm text-muted-foreground">চলমান</p>
            <p className="text-2xl font-bold mt-1 text-primary">{inProgressCount}</p>
          </div>
          <div className="stat-card bg-success/5">
            <p className="text-sm text-muted-foreground">সমাধান</p>
            <p className="text-2xl font-bold mt-1 text-success">{resolvedCount}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground">মোট</p>
            <p className="text-2xl font-bold mt-1">{requests?.length || 0}</p>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-1 gap-3 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="অনুরোধ খুঁজুন..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="অবস্থা" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সকল</SelectItem>
                <SelectItem value="open">খোলা</SelectItem>
                <SelectItem value="in-progress">চলমান</SelectItem>
                <SelectItem value="resolved">সমাধান</SelectItem>
                <SelectItem value="closed">বন্ধ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            নতুন অনুরোধ
          </Button>
        </div>

        {/* Requests Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48" />)}
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>কোনো অনুরোধ নেই</p>
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
                          <CardTitle className="text-base leading-tight">{request.title}</CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <Building2 className="h-3 w-3" />
                            {request.flats?.flat_number} • {owner?.name || 'অজানা'}
                          </CardDescription>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(request.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {request.description || 'কোনো বিবরণ নেই'}
                    </p>
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
                    
                    {request.status !== 'closed' && (
                      <div className="pt-2 border-t">
                        <Select 
                          value={request.status} 
                          onValueChange={(v) => handleStatusChange(request.id, v)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">খোলা</SelectItem>
                            <SelectItem value="in-progress">চলমান</SelectItem>
                            <SelectItem value="resolved">সমাধান</SelectItem>
                            <SelectItem value="closed">বন্ধ</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    <div className="text-xs text-muted-foreground flex justify-between">
                      <span>তৈরি: {new Date(request.created_at).toLocaleDateString('bn-BD')}</span>
                      {request.employees?.name && <span>দায়িত্ব: {request.employees.name}</span>}
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
            <AlertDialogTitle>আপনি কি নিশ্চিত?</AlertDialogTitle>
            <AlertDialogDescription>এই অনুরোধটি মুছে ফেলা হবে।</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">মুছে ফেলুন</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default ServiceRequests;
