import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/dashboard/StatCard';
import { useFlats } from '@/hooks/useFlats';
import { useInvoices } from '@/hooks/useInvoices';
import { useServiceRequests } from '@/hooks/useServiceRequests';
import { useEmployees } from '@/hooks/useEmployees';
import { useExpenses } from '@/hooks/useExpenses';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, Users, Receipt, Wrench, TrendingUp, TrendingDown, Home } from 'lucide-react';
import { formatBDT } from '@/lib/currency';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Dashboard = () => {
  const { t, language } = useLanguage();
  const { isAdmin, isOwner, isTenant, userFlatId, userRole } = useAuth();
  const { data: flats, isLoading: loadingFlats } = useFlats();
  const { data: invoices, isLoading: loadingInvoices } = useInvoices();
  const { data: requests, isLoading: loadingRequests } = useServiceRequests();
  const { data: employees, isLoading: loadingEmployees } = useEmployees();
  const { data: expenses, isLoading: loadingExpenses } = useExpenses();

  const isResident = isOwner || isTenant;

  // Filter data based on role
  const userInvoices = isResident && userFlatId 
    ? invoices?.filter(i => i.flat_id === userFlatId) 
    : invoices;
  
  const userRequests = isResident && userFlatId 
    ? requests?.filter(r => r.flat_id === userFlatId) 
    : requests;

  const userFlat = flats?.find(f => f.id === userFlatId);

  // Admin stats
  const occupiedFlats = flats?.filter(f => f.status !== 'vacant').length || 0;
  const pendingPayments = userInvoices?.filter(inv => inv.status === 'unpaid' || inv.status === 'overdue').length || 0;
  const openRequests = userRequests?.filter(req => req.status === 'open' || req.status === 'in-progress').length || 0;

  const totalIncome = invoices?.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.amount), 0) || 0;
  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
  const pendingAmount = userInvoices?.filter(i => i.status !== 'paid').reduce((sum, i) => sum + Number(i.amount), 0) || 0;

  const isLoading = loadingFlats || loadingInvoices || loadingRequests || loadingEmployees || loadingExpenses;

  // Tenant Dashboard - minimal view
  if (isTenant) {
    return (
      <MainLayout>
        <Header 
          title={language === 'bn' ? 'আমার ড্যাশবোর্ড' : 'My Dashboard'}
          subtitle={language === 'bn' ? 'ভাড়াটিয়ার প্যানেল' : 'Tenant Panel'}
        />
        
        <div className="p-6 space-y-6 animate-fade-in">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-32" />)}
            </div>
          ) : (
            <>
              {/* Flat Info */}
              <Card className="stat-card border-0 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-primary" />
                    {language === 'bn' ? 'আমার ফ্ল্যাট' : 'My Flat'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">{userFlat?.flat_number || '-'}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {language === 'bn' ? `তলা ${userFlat?.floor || '-'}` : `Floor ${userFlat?.floor || '-'}`} • {userFlat?.size || 0} sqft
                  </p>
                </CardContent>
              </Card>

              {/* Payment Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="stat-card border-0 bg-warning/5">
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-warning" />
                      {language === 'bn' ? 'বকেয়া টাকা' : 'Pending Amount'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-warning">{formatBDT(pendingAmount)}</p>
                    <p className="text-sm text-muted-foreground mt-1">{pendingPayments} {language === 'bn' ? 'বিল বকেয়া' : 'bills pending'}</p>
                  </CardContent>
                </Card>

                <Card className="stat-card border-0 bg-success/5">
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-success" />
                      {language === 'bn' ? 'পরিশোধিত' : 'Total Paid'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-success">
                      {formatBDT(userInvoices?.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.amount), 0) || 0)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Service Requests */}
              <Card className="stat-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    {language === 'bn' ? 'সার্ভিস অনুরোধ' : 'Service Requests'} ({openRequests} {language === 'bn' ? 'চলমান' : 'open'})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userRequests?.length === 0 ? (
                    <p className="text-muted-foreground text-sm">{language === 'bn' ? 'কোনো অনুরোধ নেই' : 'No service requests'}</p>
                  ) : (
                    <div className="space-y-3">
                      {userRequests?.slice(0, 5).map(request => (
                        <div key={request.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{request.title}</p>
                            <p className="text-xs text-muted-foreground">{request.category}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            request.status === 'open' ? 'bg-warning/10 text-warning' :
                            request.status === 'in-progress' ? 'bg-primary/10 text-primary' :
                            'bg-success/10 text-success'
                          }`}>
                            {request.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </MainLayout>
    );
  }

  // Owner Dashboard - with income/expense overview
  if (isOwner) {
    return (
      <MainLayout>
        <Header 
          title={language === 'bn' ? 'আমার ড্যাশবোর্ড' : 'My Dashboard'}
          subtitle={language === 'bn' ? 'ফ্ল্যাট মালিকের প্যানেল' : 'Flat Owner Panel'}
        />
        
        <div className="p-6 space-y-6 animate-fade-in">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}
            </div>
          ) : (
            <>
              {/* Flat Info */}
              <Card className="stat-card border-0 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-primary" />
                    {language === 'bn' ? 'আমার ফ্ল্যাট' : 'My Flat'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">{userFlat?.flat_number || '-'}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {language === 'bn' ? `তলা ${userFlat?.floor || '-'}` : `Floor ${userFlat?.floor || '-'}`} • {userFlat?.size || 0} sqft
                  </p>
                </CardContent>
              </Card>

              {/* Building Financial Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="stat-card border-0 bg-success/5">
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-success" />
                      {language === 'bn' ? 'বিল্ডিং আয়' : 'Building Income'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-success">{formatBDT(totalIncome)}</p>
                    <p className="text-sm text-muted-foreground mt-1">{language === 'bn' ? 'পরিশোধিত বিল থেকে' : 'From paid invoices'}</p>
                  </CardContent>
                </Card>
                
                <Card className="stat-card border-0 bg-destructive/5">
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-destructive" />
                      {language === 'bn' ? 'বিল্ডিং খরচ' : 'Building Expenses'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-destructive">{formatBDT(totalExpenses)}</p>
                    <p className="text-sm text-muted-foreground mt-1">{language === 'bn' ? 'মোট খরচ' : 'Total expenses'}</p>
                  </CardContent>
                </Card>
                
                <Card className="stat-card border-0 bg-warning/5">
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-warning" />
                      {language === 'bn' ? 'আমার বকেয়া' : 'My Pending'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-warning">{formatBDT(pendingAmount)}</p>
                    <p className="text-sm text-muted-foreground mt-1">{pendingPayments} {language === 'bn' ? 'বিল বকেয়া' : 'bills pending'}</p>
                  </CardContent>
                </Card>
              </div>

              {/* My Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                  title={language === 'bn' ? 'আমার বিল' : 'My Invoices'}
                  value={userInvoices?.length || 0}
                  icon={Receipt}
                  variant="primary"
                />
                <StatCard
                  title={language === 'bn' ? 'পরিশোধিত' : 'Paid'}
                  value={userInvoices?.filter(i => i.status === 'paid').length || 0}
                  icon={Receipt}
                  variant="success"
                />
                <StatCard
                  title={language === 'bn' ? 'সার্ভিস অনুরোধ' : 'Service Requests'}
                  value={openRequests}
                  icon={Wrench}
                  variant="destructive"
                />
              </div>

              {/* Service Requests */}
              <Card className="stat-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg">{language === 'bn' ? 'আমার সার্ভিস অনুরোধ' : 'My Service Requests'}</CardTitle>
                </CardHeader>
                <CardContent>
                  {userRequests?.length === 0 ? (
                    <p className="text-muted-foreground text-sm">{language === 'bn' ? 'কোনো অনুরোধ নেই' : 'No service requests'}</p>
                  ) : (
                    <div className="space-y-3">
                      {userRequests?.slice(0, 5).map(request => (
                        <div key={request.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{request.title}</p>
                            <p className="text-xs text-muted-foreground">{request.category}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            request.status === 'open' ? 'bg-warning/10 text-warning' :
                            request.status === 'in-progress' ? 'bg-primary/10 text-primary' :
                            'bg-success/10 text-success'
                          }`}>
                            {request.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </MainLayout>
    );
  }

  // Admin/Staff Dashboard
  return (
    <MainLayout>
      <Header 
        title={t.dashboard.title}
        subtitle={t.dashboard.subtitle}
      />
      
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Stats Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <StatCard
              title={t.dashboard.totalFlats}
              value={flats?.length || 0}
              icon={Building2}
              variant="primary"
            />
            <StatCard
              title={t.dashboard.occupied}
              value={occupiedFlats}
              icon={Users}
              variant="success"
            />
            <StatCard
              title={t.dashboard.pendingPayments}
              value={pendingPayments}
              icon={Receipt}
              variant="warning"
            />
            <StatCard
              title={t.dashboard.serviceRequests}
              value={openRequests}
              icon={Wrench}
              variant="destructive"
            />
          </div>
        )}

        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="stat-card border-0 bg-success/5">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-success" />
                {t.dashboard.totalIncome}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-success">{formatBDT(totalIncome)}</p>
              <p className="text-sm text-muted-foreground mt-1">{t.dashboard.fromPaidInvoices}</p>
            </CardContent>
          </Card>
          
          <Card className="stat-card border-0 bg-destructive/5">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-destructive" />
                {t.dashboard.totalExpenses}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-destructive">{formatBDT(totalExpenses)}</p>
              <p className="text-sm text-muted-foreground mt-1">{t.dashboard.allExpensesCombined}</p>
            </CardContent>
          </Card>
          
          <Card className="stat-card border-0 bg-warning/5">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-warning" />
                {t.dashboard.pendingAmount}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-warning">{formatBDT(pendingAmount)}</p>
              <p className="text-sm text-muted-foreground mt-1">{pendingPayments} {t.dashboard.invoicesPending}</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="stat-card border-0">
            <CardHeader>
              <CardTitle className="text-lg">{t.dashboard.flatStatus}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t.dashboard.ownerOccupied}</span>
                  <span className="font-semibold">{flats?.filter(f => f.status === 'owner-occupied').length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t.dashboard.tenantOccupied}</span>
                  <span className="font-semibold">{flats?.filter(f => f.status === 'tenant').length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t.dashboard.vacant}</span>
                  <span className="font-semibold">{flats?.filter(f => f.status === 'vacant').length || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card border-0">
            <CardHeader>
              <CardTitle className="text-lg">{t.dashboard.employees}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t.dashboard.guard}</span>
                  <span className="font-semibold">{employees?.filter(e => e.role === 'guard').length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t.dashboard.cleaner}</span>
                  <span className="font-semibold">{employees?.filter(e => e.role === 'cleaner').length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t.dashboard.caretaker}</span>
                  <span className="font-semibold">{employees?.filter(e => e.role === 'caretaker').length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t.dashboard.totalSalary}</span>
                  <span className="font-semibold">{formatBDT(employees?.reduce((sum, e) => sum + e.salary, 0) || 0)}{t.common.perMonth}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
