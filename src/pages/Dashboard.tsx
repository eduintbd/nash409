import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/dashboard/StatCard';
import { CustomStatCard } from '@/components/dashboard/CustomStatCard';
import { DashboardCustomizer } from '@/components/dashboard/DashboardCustomizer';
import { DraggableDashboardGrid } from '@/components/dashboard/DraggableDashboardGrid';
import { PropertyOverviewCard } from '@/components/dashboard/PropertyOverviewCard';
import { FinancialSummaryCard } from '@/components/dashboard/FinancialSummaryCard';
import { useFlats } from '@/hooks/useFlats';
import { useInvoices } from '@/hooks/useInvoices';
import { useServiceRequests } from '@/hooks/useServiceRequests';
import { useEmployees } from '@/hooks/useEmployees';
import { useExpenses } from '@/hooks/useExpenses';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardCards, DashboardCard } from '@/hooks/useDashboardCards';
import { Building2, Users, Receipt, Wrench, TrendingUp, TrendingDown, Home, Wallet } from 'lucide-react';
import { formatBDT } from '@/lib/currency';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OwnerPaymentChart } from '@/components/dashboard/OwnerPaymentChart';
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { t, language } = useLanguage();
  const { isAdmin, isOwner, isTenant, userFlatId, userFlatIds, userRole } = useAuth();
  const { data: flats, isLoading: loadingFlats } = useFlats();
  const { data: invoices, isLoading: loadingInvoices } = useInvoices();
  const { data: requests, isLoading: loadingRequests } = useServiceRequests();
  const { data: employees, isLoading: loadingEmployees } = useEmployees();
  const { data: expenses, isLoading: loadingExpenses } = useExpenses();
  
  // Dashboard customization
  const adminCards = useDashboardCards('admin');
  const ownerCards = useDashboardCards('owner');

  // Filter data based on role
  const userInvoices = isOwner && userFlatIds.length > 0
    ? invoices?.filter(i => userFlatIds.includes(i.flat_id))
    : isTenant && userFlatId 
      ? invoices?.filter(i => i.flat_id === userFlatId) 
      : invoices;
  
  const userRequests = isOwner && userFlatIds.length > 0
    ? requests?.filter(r => userFlatIds.includes(r.flat_id))
    : isTenant && userFlatId 
      ? requests?.filter(r => r.flat_id === userFlatId) 
      : requests;

  // Owner's flats (multiple)
  const ownerFlats = isOwner && userFlatIds.length > 0 
    ? flats?.filter(f => userFlatIds.includes(f.id)) 
    : [];

  // Single flat for tenant
  const userFlat = flats?.find(f => f.id === userFlatId);

  // Common stats
  const pendingPayments = userInvoices?.filter(inv => inv.status === 'unpaid' || inv.status === 'overdue').length || 0;
  const openRequests = userRequests?.filter(req => req.status === 'open' || req.status === 'in-progress').length || 0;

  // Building totals (for admin)
  const totalIncome = invoices?.filter(i => i.status === 'paid' && (i as any).invoice_type !== 'service_request').reduce((sum, i) => sum + Number(i.amount), 0) || 0;
  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
  
  // Get current month/year for filtering
  const currentMonth = new Date().toLocaleString('en', { month: 'long' });
  const currentYear = new Date().getFullYear();
  
  // Owner receivable stats
  const ownerTotalReceived = userInvoices?.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.amount), 0) || 0;
  const ownerTotalReceivable = userInvoices?.filter(i => i.status !== 'paid').reduce((sum, i) => sum + Number(i.amount), 0) || 0;
  
  // Tenant payable stats
  const tenantTotalPaid = userInvoices?.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.amount), 0) || 0;
  const tenantTotalPayable = userInvoices?.filter(i => i.status !== 'paid').reduce((sum, i) => sum + Number(i.amount), 0) || 0;

  // Admin stats
  const occupiedFlats = flats?.filter(f => f.status !== 'vacant').length || 0;
  const ownerOccupiedCount = flats?.filter(f => f.status === 'owner-occupied').length || 0;
  const tenantOccupiedCount = flats?.filter(f => f.status === 'tenant').length || 0;
  const vacantCount = flats?.filter(f => f.status === 'vacant').length || 0;
  const pendingAmount = userInvoices?.filter(i => i.status !== 'paid').reduce((sum, i) => sum + Number(i.amount), 0) || 0;

  const isLoading = loadingFlats || loadingInvoices || loadingRequests || loadingEmployees || loadingExpenses;

  // Get role-specific header
  const getRoleHeader = () => {
    if (isTenant) {
      return {
        title: language === 'bn' ? 'টেন্যান্ট ড্যাশবোর্ড' : 'Tenant Dashboard',
        subtitle: language === 'bn' ? 'আপনার পেমেন্ট এবং সার্ভিস তথ্য' : 'Your payment and service information'
      };
    }
    if (isOwner) {
      return {
        title: language === 'bn' ? 'মালিক ড্যাশবোর্ড' : 'Owner Dashboard',
        subtitle: language === 'bn' ? 'আপনার প্রপার্টি এবং আয়ের তথ্য' : 'Your property and income information'
      };
    }
    return {
      title: t.dashboard.title,
      subtitle: t.dashboard.subtitle
    };
  };

  const header = getRoleHeader();

  // Card link mapping
  const cardLinks: Record<string, string> = {
    'property-overview': '/flats',
    'service-requests': '/service-requests',
  };

  // Build admin card content map
  const getAdminCardContent = (card: DashboardCard): ReactNode => {
    const wrapWithLink = (content: ReactNode, cardId: string) => {
      const link = cardLinks[cardId];
      if (link) {
        return (
          <Link to={link} className="block h-full hover:scale-[1.02] transition-transform">
            {content}
          </Link>
        );
      }
      return content;
    };

    switch (card.id) {
      case 'property-overview':
        return wrapWithLink(
          <PropertyOverviewCard
            totalFlats={flats?.length || 0}
            ownerOccupied={ownerOccupiedCount}
            tenantOccupied={tenantOccupiedCount}
            vacant={vacantCount}
            language={language}
          />,
          card.id
        );
      case 'financial-summary':
        return (
          <FinancialSummaryCard
            totalIncome={totalIncome}
            totalExpenses={totalExpenses}
            receivable={pendingAmount}
            language={language}
          />
        );
      case 'service-requests':
        return wrapWithLink(
          <Card className="stat-card border-0 bg-destructive/10 h-full cursor-pointer">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-destructive" />
                {t.dashboard.serviceRequests}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-destructive">{openRequests}</p>
              <p className="text-sm text-muted-foreground mt-1">{language === 'bn' ? 'চলমান অনুরোধ' : 'Open requests'}</p>
            </CardContent>
          </Card>,
          card.id
        );
      default:
        if (card.type === 'custom') {
          return <CustomStatCard card={card} />;
        }
        return null;
    }
  };

  // Tenant Dashboard
  if (isTenant) {
    return (
      <MainLayout>
        <Header 
          title={header.title}
          subtitle={header.subtitle}
        />
        
        <div className="p-6 space-y-6 animate-fade-in">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
            </div>
          ) : (
            <>
              {/* Main Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <StatCard
                  title={language === 'bn' ? 'আমার ফ্ল্যাট' : 'My Flat'}
                  value={userFlat?.flat_number || '-'}
                  icon={Home}
                  variant="primary"
                />
                <StatCard
                  title={language === 'bn' ? 'মোট পরিশোধযোগ্য' : 'Total Payable'}
                  value={formatBDT(tenantTotalPayable)}
                  icon={Receipt}
                  variant="warning"
                />
                <StatCard
                  title={language === 'bn' ? 'মোট পরিশোধিত' : 'Total Paid'}
                  value={formatBDT(tenantTotalPaid)}
                  icon={TrendingUp}
                  variant="success"
                />
              </div>

              {/* Secondary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <StatCard
                  title={language === 'bn' ? 'বকেয়া বিল' : 'Pending Bills'}
                  value={pendingPayments}
                  icon={Receipt}
                  variant="warning"
                />
                <Link to="/service-requests" className="block">
                  <StatCard
                    title={language === 'bn' ? 'সার্ভিস অনুরোধ' : 'Service Requests'}
                    value={openRequests}
                    icon={Wrench}
                    variant="destructive"
                  />
                </Link>
                <StatCard
                  title={language === 'bn' ? 'ফ্ল্যাটের তলা' : 'Floor'}
                  value={userFlat?.floor || '-'}
                  icon={Building2}
                  variant="default"
                />
              </div>

              {/* Recent Service Requests */}
              <Card className="stat-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    {language === 'bn' ? 'সাম্প্রতিক সার্ভিস অনুরোধ' : 'Recent Service Requests'}
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

  // Owner Dashboard
  if (isOwner) {
    const customCards = ownerCards.visibleCards.filter(c => c.type === 'custom');
    
    return (
      <MainLayout>
        <Header 
          title={header.title}
          subtitle={header.subtitle}
          actions={
            <DashboardCustomizer
              cards={ownerCards.cards}
              onToggleVisibility={ownerCards.toggleCardVisibility}
              onAddCustomCard={ownerCards.addCustomCard}
              onRemoveCard={ownerCards.removeCard}
              onUpdateCard={ownerCards.updateCard}
              onResetToDefaults={ownerCards.resetToDefaults}
              onReorderCards={ownerCards.reorderCards}
            />
          }
        />
        
        <div className="p-6 space-y-6 animate-fade-in">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-32" />)}
            </div>
          ) : (
            <>
              {/* Main Stats Grid - Same Style as Admin */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <StatCard
                  title={language === 'bn' ? 'আমার ফ্ল্যাটসমূহ' : 'My Flats'}
                  value={ownerFlats?.length || 0}
                  icon={Home}
                  variant="primary"
                />
                <StatCard
                  title={language === 'bn' ? 'মোট প্রাপ্য' : 'Total Receivable'}
                  value={formatBDT(ownerTotalReceivable)}
                  icon={TrendingDown}
                  variant="warning"
                />
                <StatCard
                  title={language === 'bn' ? 'মোট প্রাপ্ত' : 'Total Received'}
                  value={formatBDT(ownerTotalReceived)}
                  icon={TrendingUp}
                  variant="success"
                />
              </div>

              {/* Secondary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <StatCard
                  title={language === 'bn' ? 'বকেয়া বিল' : 'Pending Invoices'}
                  value={pendingPayments}
                  icon={Receipt}
                  variant="warning"
                />
                <StatCard
                  title={language === 'bn' ? 'ভাড়া দেওয়া ফ্ল্যাট' : 'Rented Flats'}
                  value={ownerFlats?.filter(f => f.status === 'tenant').length || 0}
                  icon={Users}
                  variant="primary"
                />
                <Link to="/service-requests" className="block">
                  <StatCard
                    title={language === 'bn' ? 'সার্ভিস অনুরোধ' : 'Service Requests'}
                    value={openRequests}
                    icon={Wrench}
                    variant="destructive"
                  />
                </Link>
              </div>

              {/* My Flats Details */}
              <Card className="stat-card border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Home className="h-5 w-5 text-primary" />
                    {language === 'bn' ? 'আমার ফ্ল্যাটসমূহের বিবরণ' : 'My Flats Details'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {ownerFlats && ownerFlats.length > 0 ? ownerFlats.map(flat => (
                      <div key={flat.id} className="bg-muted/50 rounded-lg p-4 border min-w-[140px]">
                        <p className="text-xl font-bold text-primary">{flat.flat_number}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {language === 'bn' ? `তলা ${flat.floor}` : `Floor ${flat.floor}`}
                        </p>
                        <p className={`text-xs mt-1 px-2 py-0.5 rounded inline-block ${
                          flat.status === 'tenant' ? 'bg-success/10 text-success' : 
                          flat.status === 'owner-occupied' ? 'bg-primary/10 text-primary' : 
                          'bg-warning/10 text-warning'
                        }`}>
                          {flat.status === 'tenant' ? (language === 'bn' ? 'ভাড়া দেওয়া' : 'Rented') : 
                           flat.status === 'owner-occupied' ? (language === 'bn' ? 'নিজে বসবাস' : 'Self') :
                           (language === 'bn' ? 'খালি' : 'Vacant')}
                        </p>
                      </div>
                    )) : (
                      <p className="text-muted-foreground">{language === 'bn' ? 'কোন ফ্ল্যাট নেই' : 'No flats assigned'}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Custom Cards */}
              {customCards.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {customCards.map((card) => (
                    <CustomStatCard key={card.id} card={card} />
                  ))}
                </div>
              )}

              {/* Payment Chart */}
              {userInvoices && userInvoices.length > 0 && (
                <OwnerPaymentChart invoices={userInvoices as any} language={language} />
              )}

              {/* Recent Service Requests */}
              <Card className="stat-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    {language === 'bn' ? 'সাম্প্রতিক সার্ভিস অনুরোধ' : 'Recent Service Requests'}
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
                            <p className="text-xs text-muted-foreground">
                              {flats?.find(f => f.id === request.flat_id)?.flat_number} • {request.category}
                            </p>
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
  const adminDraggableItems = adminCards.visibleCards
    .map(card => ({
      id: card.id,
      content: getAdminCardContent(card),
    }))
    .filter(item => item.content !== null);
  
  return (
    <MainLayout>
      <Header 
        title={header.title}
        subtitle={header.subtitle}
        actions={
          <DashboardCustomizer
            cards={adminCards.cards}
            onToggleVisibility={adminCards.toggleCardVisibility}
            onAddCustomCard={adminCards.addCustomCard}
            onRemoveCard={adminCards.removeCard}
            onUpdateCard={adminCards.updateCard}
            onResetToDefaults={adminCards.resetToDefaults}
            onReorderCards={adminCards.reorderCards}
          />
        }
      />
      
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Stats Grid - Draggable */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
        ) : (
          <DraggableDashboardGrid
            items={adminDraggableItems}
            onReorder={adminCards.reorderCards}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          />
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
