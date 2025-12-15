import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { mockFlats, mockOwners, mockTenants } from '@/data/mockData';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Search, Plus, Building2, User, Phone, Mail, Car } from 'lucide-react';

const statusColors = {
  'owner-occupied': 'bg-primary/10 text-primary border-primary/20',
  'tenant': 'bg-success/10 text-success border-success/20',
  'vacant': 'bg-muted text-muted-foreground border-border',
};

const Flats = () => {
  const [search, setSearch] = useState('');
  const [selectedFlat, setSelectedFlat] = useState<string | null>(null);

  const filteredFlats = mockFlats.filter(flat => 
    flat.flatNumber.toLowerCase().includes(search.toLowerCase())
  );

  const getOwner = (flatId: string) => mockOwners.find(o => o.flatId === flatId);
  const getTenant = (flatId: string) => mockTenants.find(t => t.flatId === flatId);

  return (
    <MainLayout>
      <Header 
        title="Flats Management" 
        subtitle="Manage all flats in your building"
      />
      
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search flats..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Flat
          </Button>
        </div>

        {/* Flats Table */}
        <div className="stat-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="table-header">
                <TableHead className="w-24">Flat No.</TableHead>
                <TableHead>Floor</TableHead>
                <TableHead>Size (sq.ft)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Parking</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFlats.map((flat) => {
                const owner = getOwner(flat.id);
                const tenant = flat.status === 'tenant' ? getTenant(flat.id) : null;
                const displayPerson = tenant || owner;

                return (
                  <TableRow key={flat.id} className="table-row-hover">
                    <TableCell className="font-semibold">{flat.flatNumber}</TableCell>
                    <TableCell>{flat.floor}</TableCell>
                    <TableCell>{flat.size.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[flat.status]}>
                        {flat.status.replace('-', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{owner?.name || '-'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {displayPerson?.phone || '-'}
                    </TableCell>
                    <TableCell>
                      {flat.parkingSpot ? (
                        <span className="flex items-center gap-1 text-sm">
                          <Car className="h-3 w-3" /> {flat.parkingSpot}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">View Details</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Building2 className="h-5 w-5 text-primary" />
                              Flat {flat.flatNumber}
                            </DialogTitle>
                            <DialogDescription>
                              Floor {flat.floor} • {flat.size.toLocaleString()} sq.ft
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <div className="p-4 rounded-lg bg-muted/30">
                              <Badge variant="outline" className={statusColors[flat.status]}>
                                {flat.status.replace('-', ' ')}
                              </Badge>
                              {flat.parkingSpot && (
                                <p className="mt-2 text-sm flex items-center gap-2">
                                  <Car className="h-4 w-4" /> Parking: {flat.parkingSpot}
                                </p>
                              )}
                            </div>
                            
                            {owner && (
                              <div className="p-4 rounded-lg border">
                                <h4 className="font-medium mb-3 flex items-center gap-2">
                                  <User className="h-4 w-4" /> Owner Details
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <p className="font-medium">{owner.name}</p>
                                  <p className="flex items-center gap-2 text-muted-foreground">
                                    <Mail className="h-3 w-3" /> {owner.email}
                                  </p>
                                  <p className="flex items-center gap-2 text-muted-foreground">
                                    <Phone className="h-3 w-3" /> {owner.phone}
                                  </p>
                                  <p className="text-muted-foreground">
                                    Owner since: {new Date(owner.ownershipStart).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            )}

                            {tenant && (
                              <div className="p-4 rounded-lg border border-success/20 bg-success/5">
                                <h4 className="font-medium mb-3 flex items-center gap-2 text-success">
                                  <User className="h-4 w-4" /> Tenant Details
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <p className="font-medium">{tenant.name}</p>
                                  <p className="flex items-center gap-2 text-muted-foreground">
                                    <Mail className="h-3 w-3" /> {tenant.email}
                                  </p>
                                  <p className="flex items-center gap-2 text-muted-foreground">
                                    <Phone className="h-3 w-3" /> {tenant.phone}
                                  </p>
                                  <p className="text-muted-foreground">
                                    Rent: ₹{tenant.rentAmount.toLocaleString()}/month
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
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

export default Flats;
