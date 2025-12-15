import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { useFlats } from '@/hooks/useFlats';
import { useOwners } from '@/hooks/useOwners';
import { useTenants } from '@/hooks/useTenants';
import { useLanguage } from '@/contexts/LanguageContext';
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

const Flats = () => {
  const { t, language } = useLanguage();
  const { data: flats, isLoading } = useFlats();
  const { data: owners } = useOwners();
  const { data: tenants } = useTenants();
  const [search, setSearch] = useState('');
  const [selectedFlat, setSelectedFlat] = useState<any | null>(null);

  const statusColors = {
    'owner-occupied': 'bg-primary/10 text-primary border-primary/20',
    'tenant': 'bg-success/10 text-success border-success/20',
    'vacant': 'bg-muted text-muted-foreground border-border',
  };

  const statusLabels = {
    'owner-occupied': t.flats.statusOwner,
    'tenant': t.flats.statusTenant,
    'vacant': t.flats.statusVacant,
  };

  const filteredFlats = flats?.filter(flat => 
    flat.flat_number.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const getOwner = (flatId: string) => owners?.find(o => o.flat_id === flatId);
  const getTenant = (flatId: string) => tenants?.find(t => t.flat_id === flatId);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US');
  };

  return (
    <MainLayout>
      <Header 
        title={t.flats.title}
        subtitle={t.flats.subtitle}
      />
      
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.flats.searchPlaceholder}
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
                  <TableHead className="w-24">{t.flats.flatNo}</TableHead>
                  <TableHead>{t.flats.floor}</TableHead>
                  <TableHead>{t.flats.size}</TableHead>
                  <TableHead>{t.common.status}</TableHead>
                  <TableHead>{t.flats.owner}</TableHead>
                  <TableHead>{t.flats.contact}</TableHead>
                  <TableHead>{t.flats.parking}</TableHead>
                  <TableHead className="text-right">{t.common.details}</TableHead>
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
                      <TableCell>{(displayPerson as any)?.name || '-'}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {(displayPerson as any)?.phone || '-'}
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
                          {t.common.details}
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
              {t.flats.flatNo} {selectedFlat?.flat_number}
            </DialogTitle>
            <DialogDescription>
              {t.flats.floor} {selectedFlat?.floor} • {selectedFlat?.size?.toLocaleString()} sq.ft
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
                    <Car className="h-4 w-4" /> {t.flats.parking}: {selectedFlat.parking_spot}
                  </p>
                )}
              </div>
              
              {getOwner(selectedFlat.id) && (
                <div className="p-4 rounded-lg border">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" /> {t.flats.ownerDetails}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">{(getOwner(selectedFlat.id) as any)?.name}</p>
                    {(getOwner(selectedFlat.id) as any)?.email && (
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3 w-3" /> {(getOwner(selectedFlat.id) as any)?.email}
                      </p>
                    )}
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3 w-3" /> {(getOwner(selectedFlat.id) as any)?.phone}
                    </p>
                    <p className="text-muted-foreground">
                      {t.flats.ownerSince}: {formatDate((getOwner(selectedFlat.id) as any)?.ownership_start)}
                    </p>
                  </div>
                </div>
              )}

              {getTenant(selectedFlat.id) && (
                <div className="p-4 rounded-lg border border-success/20 bg-success/5">
                  <h4 className="font-medium mb-3 flex items-center gap-2 text-success">
                    <User className="h-4 w-4" /> {t.flats.tenantDetails}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">{(getTenant(selectedFlat.id) as any)?.name}</p>
                    {(getTenant(selectedFlat.id) as any)?.email && (
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3 w-3" /> {(getTenant(selectedFlat.id) as any)?.email}
                      </p>
                    )}
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3 w-3" /> {(getTenant(selectedFlat.id) as any)?.phone}
                    </p>
                    <p className="text-muted-foreground">
                      {t.flats.rent}: {formatBDT((getTenant(selectedFlat.id) as any)?.rent_amount || 0)}{t.common.perMonth}
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
