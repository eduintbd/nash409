import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { useFlats, useUpdateFlat } from '@/hooks/useFlats';
import { useOwners } from '@/hooks/useOwners';
import { useTenants } from '@/hooks/useTenants';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, Building2, User, Phone, Mail, Car } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatBDT } from '@/lib/currency';

const statusColors = {
  'owner-occupied': 'bg-primary/10 text-primary border-primary/20',
  'tenant': 'bg-success/10 text-success border-success/20',
  'vacant': 'bg-muted text-muted-foreground border-border',
};

const statusLabels = {
  'owner-occupied': 'মালিক',
  'tenant': 'ভাড়াটিয়া',
  'vacant': 'খালি',
};

const Flats = () => {
  const { data: flats, isLoading } = useFlats();
  const { data: owners } = useOwners();
  const { data: tenants } = useTenants();
  const [search, setSearch] = useState('');
  const [selectedFlat, setSelectedFlat] = useState<any | null>(null);

  const filteredFlats = flats?.filter(flat => 
    flat.flat_number.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const getOwner = (flatId: string) => owners?.find(o => o.flat_id === flatId);
  const getTenant = (flatId: string) => tenants?.find(t => t.flat_id === flatId);

  return (
    <MainLayout>
      <Header 
        title="ফ্ল্যাট ব্যবস্থাপনা" 
        subtitle="আপনার বিল্ডিংয়ের সকল ফ্ল্যাট"
      />
      
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ফ্ল্যাট খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Flats Table */}
        <div className="stat-card overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="table-header">
                  <TableHead className="w-24">ফ্ল্যাট নং</TableHead>
                  <TableHead>ফ্লোর</TableHead>
                  <TableHead>আয়তন (sq.ft)</TableHead>
                  <TableHead>অবস্থা</TableHead>
                  <TableHead>মালিক/ভাড়াটিয়া</TableHead>
                  <TableHead>যোগাযোগ</TableHead>
                  <TableHead>পার্কিং</TableHead>
                  <TableHead className="text-right">বিস্তারিত</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFlats.map((flat) => {
                  const owner = getOwner(flat.id);
                  const tenant = flat.status === 'tenant' ? getTenant(flat.id) : null;
                  const displayPerson = tenant || owner;

                  return (
                    <TableRow key={flat.id} className="table-row-hover">
                      <TableCell className="font-semibold">{flat.flat_number}</TableCell>
                      <TableCell>{flat.floor}</TableCell>
                      <TableCell>{flat.size.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[flat.status]}>
                          {statusLabels[flat.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>{displayPerson?.name || '-'}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {displayPerson?.phone || '-'}
                      </TableCell>
                      <TableCell>
                        {flat.parking_spot ? (
                          <span className="flex items-center gap-1 text-sm">
                            <Car className="h-3 w-3" /> {flat.parking_spot}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedFlat(flat)}>
                          বিস্তারিত
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Details Dialog */}
      <Dialog open={!!selectedFlat} onOpenChange={() => setSelectedFlat(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              ফ্ল্যাট {selectedFlat?.flat_number}
            </DialogTitle>
            <DialogDescription>
              ফ্লোর {selectedFlat?.floor} • {selectedFlat?.size?.toLocaleString()} sq.ft
            </DialogDescription>
          </DialogHeader>
          {selectedFlat && (
            <div className="space-y-4 mt-4">
              <div className="p-4 rounded-lg bg-muted/30">
                <Badge variant="outline" className={statusColors[selectedFlat.status]}>
                  {statusLabels[selectedFlat.status]}
                </Badge>
                {selectedFlat.parking_spot && (
                  <p className="mt-2 text-sm flex items-center gap-2">
                    <Car className="h-4 w-4" /> পার্কিং: {selectedFlat.parking_spot}
                  </p>
                )}
              </div>
              
              {getOwner(selectedFlat.id) && (
                <div className="p-4 rounded-lg border">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" /> মালিকের তথ্য
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">{getOwner(selectedFlat.id)?.name}</p>
                    {getOwner(selectedFlat.id)?.email && (
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3 w-3" /> {getOwner(selectedFlat.id)?.email}
                      </p>
                    )}
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3 w-3" /> {getOwner(selectedFlat.id)?.phone}
                    </p>
                    <p className="text-muted-foreground">
                      মালিকানা: {new Date(getOwner(selectedFlat.id)?.ownership_start).toLocaleDateString('bn-BD')}
                    </p>
                  </div>
                </div>
              )}

              {getTenant(selectedFlat.id) && (
                <div className="p-4 rounded-lg border border-success/20 bg-success/5">
                  <h4 className="font-medium mb-3 flex items-center gap-2 text-success">
                    <User className="h-4 w-4" /> ভাড়াটিয়ার তথ্য
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">{getTenant(selectedFlat.id)?.name}</p>
                    {getTenant(selectedFlat.id)?.email && (
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3 w-3" /> {getTenant(selectedFlat.id)?.email}
                      </p>
                    )}
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3 w-3" /> {getTenant(selectedFlat.id)?.phone}
                    </p>
                    <p className="text-muted-foreground">
                      ভাড়া: {formatBDT(getTenant(selectedFlat.id)?.rent_amount || 0)}/মাস
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Flats;
