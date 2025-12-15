import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { mockServiceRequests, mockFlats, mockOwners } from '@/data/mockData';
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
import { Search, Plus, AlertCircle, Clock, CheckCircle, Building2 } from 'lucide-react';

const statusConfig = {
  open: { icon: AlertCircle, color: 'bg-warning/10 text-warning border-warning/20', label: 'Open' },
  'in-progress': { icon: Clock, color: 'bg-primary/10 text-primary border-primary/20', label: 'In Progress' },
  resolved: { icon: CheckCircle, color: 'bg-success/10 text-success border-success/20', label: 'Resolved' },
  closed: { icon: CheckCircle, color: 'bg-muted text-muted-foreground border-border', label: 'Closed' },
};

const priorityColors = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

const ServiceRequests = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredRequests = mockServiceRequests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getFlat = (flatId: string) => mockFlats.find(f => f.id === flatId);
  const getOwner = (flatId: string) => mockOwners.find(o => o.flatId === flatId);

  const openCount = mockServiceRequests.filter(r => r.status === 'open').length;
  const inProgressCount = mockServiceRequests.filter(r => r.status === 'in-progress').length;

  return (
    <MainLayout>
      <Header 
        title="Service Requests" 
        subtitle="Track and manage maintenance requests"
      />
      
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card bg-warning/5">
            <p className="text-sm text-muted-foreground">Open</p>
            <p className="text-2xl font-bold mt-1 text-warning">{openCount}</p>
          </div>
          <div className="stat-card bg-primary/5">
            <p className="text-sm text-muted-foreground">In Progress</p>
            <p className="text-2xl font-bold mt-1 text-primary">{inProgressCount}</p>
          </div>
          <div className="stat-card bg-success/5">
            <p className="text-sm text-muted-foreground">Resolved This Month</p>
            <p className="text-2xl font-bold mt-1 text-success">
              {mockServiceRequests.filter(r => r.status === 'resolved' || r.status === 'closed').length}
            </p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold mt-1">{mockServiceRequests.length}</p>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-1 gap-3 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search requests..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </div>

        {/* Requests Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredRequests.map((request) => {
            const flat = getFlat(request.flatId);
            const owner = getOwner(request.flatId);
            const StatusIcon = statusConfig[request.status].icon;

            return (
              <Card key={request.id} className="stat-card border-0">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${statusConfig[request.status].color}`}>
                        <StatusIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-base leading-tight">{request.title}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <Building2 className="h-3 w-3" />
                          {flat?.flatNumber} • {owner?.name}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {request.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={statusConfig[request.status].color}>
                        {statusConfig[request.status].label}
                      </Badge>
                      <Badge className={priorityColors[request.priority]}>
                        {request.priority}
                      </Badge>
                    </div>
                  </div>
                  <div className="pt-2 border-t text-xs text-muted-foreground flex justify-between">
                    <span>Created: {new Date(request.createdAt).toLocaleDateString()}</span>
                    {request.assignedTo && <span>Assigned: {request.assignedTo}</span>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
};

export default ServiceRequests;
