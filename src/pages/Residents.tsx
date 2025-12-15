import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { mockOwners, mockTenants, mockFlats } from '@/data/mockData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Plus, Mail, Phone, Building2, Calendar } from 'lucide-react';

const Residents = () => {
  const [search, setSearch] = useState('');

  const filteredOwners = mockOwners.filter(owner =>
    owner.name.toLowerCase().includes(search.toLowerCase()) ||
    owner.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTenants = mockTenants.filter(tenant =>
    tenant.name.toLowerCase().includes(search.toLowerCase()) ||
    tenant.email.toLowerCase().includes(search.toLowerCase())
  );

  const getFlat = (flatId: string) => mockFlats.find(f => f.id === flatId);

  return (
    <MainLayout>
      <Header 
        title="Owners & Tenants" 
        subtitle="Manage residents in your building"
      />
      
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search residents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Resident
          </Button>
        </div>

        <Tabs defaultValue="owners" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="owners">Owners ({mockOwners.length})</TabsTrigger>
            <TabsTrigger value="tenants">Tenants ({mockTenants.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="owners" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredOwners.map((owner) => {
                const flat = getFlat(owner.flatId);
                return (
                  <Card key={owner.id} className="stat-card border-0">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{owner.name}</CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <Building2 className="h-3 w-3" />
                            {flat?.flatNumber}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                          Owner
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" /> {owner.email}
                      </p>
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" /> {owner.phone}
                      </p>
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" /> Since {new Date(owner.ownershipStart).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="tenants" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredTenants.map((tenant) => {
                const flat = getFlat(tenant.flatId);
                return (
                  <Card key={tenant.id} className="stat-card border-0">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{tenant.name}</CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <Building2 className="h-3 w-3" />
                            {flat?.flatNumber}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                          Tenant
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" /> {tenant.email}
                      </p>
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" /> {tenant.phone}
                      </p>
                      <div className="pt-2 border-t">
                        <p className="font-medium text-foreground">
                          ₹{tenant.rentAmount.toLocaleString()}/month
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Since {new Date(tenant.startDate).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Residents;
