import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { CustomStatCard } from '@/components/dashboard/CustomStatCard';
import { DashboardCustomizer } from '@/components/dashboard/DashboardCustomizer';
import { DraggableDashboardGrid } from '@/components/dashboard/DraggableDashboardGrid';
import { PropertyOverviewCard } from '@/components/dashboard/PropertyOverviewCard';
import { OwnerPropertyCard } from '@/components/dashboard/OwnerPropertyCard';
import { TenantPropertyCard } from '@/components/dashboard/TenantPropertyCard';
import { FinancialWaterfallChart } from '@/components/dashboard/FinancialWaterfallChart';
import { useFlats } from '@/hooks/useFlats';
import { useInvoices } from '@/hooks/useInvoices';
import { useServiceRequests } from '@/hooks/useServiceRequests';
import { useEmployees } from '@/hooks/useEmployees';
import { useExpenses } from '@/hooks/useExpenses';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBuilding } from '@/contexts/BuildingContext';
import { useDashboardCards, DashboardCard } from '@/hooks/useDashboardCards';
import { Wrench } from 'lucide-react';
import { formatBDT } from '@/lib/currency';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OwnerPaymentChart } from '@/components/dashboard/OwnerPaymentChart';
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { t, language } = useLanguage();
  const { isAdmin, isOwner, isTenant, userFlatId, userFlatIds } = useAuth();
  const { currentRoles } = useBuilding();
  const { data: flats, isLoading: loadingFlats } = useFlats();
  const { data: invoices, isLoading: loadingInvoices } = useInvoices();
  const { data: requests, isLoading: loadingRequests } = useServiceRequests();
  const { data: employees, isLoading: loadingEmployees } = useEmployees();
  const { data: expenses, isLoading: loadingExpenses } = useExpenses();

  // Derive the active dashboard variant. Building-scoped roles win over the
  // legacy user_roles booleans so a user can be e.g. committee here and tenant
  // in another building.
  const role: 'admin' | 'owner' | 'tenant' = (() => {
    if (currentRoles.includes('committee') || currentRoles.includes('manager')) return 'admin';
    if (currentRoles.includes('landlord_owner') || currentRoles.includes('resident_owner')) return 'owner';
    if (currentRoles.includes('tenant')) return 'tenant';
    // Staff + vendor have no tailored dashboard yet — fall through to tenant layout
    // (limited data view) until dedicated variants ship in a later phase.
    if (currentRoles.includes('staff') || currentRoles.includes('vendor')) return 'tenant';
    // Legacy fallback for users pre-dating building_members migration.
    return isAdmin ? 'admin' : isOwner ? 'owner' : isTenant ? 'tenant' : 'tenant';
  })();

  const dashboardCards = useDashboardCards(role);

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

  // Owner's flats
  const ownerFlats = isOwner && userFlatIds.length > 0 
    ? flats?.filter(f => userFlatIds.includes(f.id)) 
    : [];

  // Tenant's flat
  const userFlat = flats?.find(f => f.id === userFlatId);

  // Common stats
  const openRequests = userRequests?.filter(req => req.status === 'open' || req.status === 'in-progress').length || 0;
  const pendingPayments = userInvoices?.filter(inv => inv.status === 'unpaid' || inv.status === 'overdue').length || 0;

  // Admin stats
  const totalIncome = invoices?.filter(i => i.status === 'paid' && (i as any).invoice_type !== 'service_request').reduce((sum, i) => sum + Number(i.amount), 0) || 0;
  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
  const pendingAmount = invoices?.filter(i => i.status !== 'paid').reduce((sum, i) => sum + Number(i.amount), 0) || 0;
  const ownerOccupiedCount = flats?.filter(f => f.status === 'owner-occupied').length || 0;
  const tenantOccupiedCount = flats?.filter(f => f.status === 'tenant').length || 0;
  const vacantCount = flats?.filter(f => f.status === 'vacant').length || 0;

  // Owner stats
  const ownerTotalReceived = userInvoices?.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.amount), 0) || 0;
  const ownerTotalReceivable = userInvoices?.filter(i => i.status !== 'paid').reduce((sum, i) => sum + Number(i.amount), 0) || 0;
  const ownerServiceChargePaid = userInvoices?.filter(i => i.status === 'paid' && (i as any).invoice_type === 'service_charge').reduce((sum, i) => sum + Number(i.amount), 0) || 0;
  const ownerRentedFlats = ownerFlats?.filter(f => f.status === 'tenant').length || 0;
  const ownerSelfOccupied = ownerFlats?.filter(f => f.status === 'owner-occupied').length || 0;
  const ownerVacant = ownerFlats?.filter(f => f.status === 'vacant').length || 0;

  // Tenant stats
  const tenantTotalPaid = userInvoices?.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.amount), 0) || 0;
  const tenantTotalPayable = userInvoices?.filter(i => i.status !== 'paid').reduce((sum, i) => sum + Number(i.amount), 0) || 0;

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

  // Financial waterfall data for each role
  const getFinancialData = () => {
    if (isAdmin) {
      const netBalance = totalIncome - totalExpenses;
      return [
        { name: 'Income', nameBn: 'আয়', value: totalIncome, fill: 'hsl(var(--success))', link: '/invoices?status=paid' },
        { name: 'Expenses', nameBn: 'খরচ', value: -totalExpenses, fill: 'hsl(var(--destructive))', link: '/expenses' },
        { name: 'Receivable', nameBn: 'বকেয়া', value: pendingAmount, fill: 'hsl(var(--warning))', link: '/invoices?status=unpaid' },
        { name: 'Net Balance', nameBn: 'নিট ব্যালেন্স', value: netBalance, fill: 'hsl(var(--primary))', link: '/invoices' },
      ];
    }
    if (isOwner) {
      const netBalance = ownerTotalReceived - ownerServiceChargePaid;
      return [
        { name: 'Received', nameBn: 'প্রাপ্ত', value: ownerTotalReceived, fill: 'hsl(var(--success))', link: '/invoices?status=paid' },
        { name: 'Service Charge', nameBn: 'সার্ভিস চার্জ', value: -ownerServiceChargePaid, fill: 'hsl(var(--destructive))', link: '/invoices?type=service_charge' },
        { name: 'Receivable', nameBn: 'প্রাপ্য', value: ownerTotalReceivable, fill: 'hsl(var(--warning))', link: '/invoices?status=unpaid' },
        { name: 'Net Balance', nameBn: 'নিট ব্যালেন্স', value: netBalance, fill: 'hsl(var(--primary))', link: '/invoices' },
      ];
    }
    // Tenant
    return [
      { name: 'Paid', nameBn: 'পরিশোধিত', value: tenantTotalPaid, fill: 'hsl(var(--success))', link: '/invoices?status=paid' },
      { name: 'Payable', nameBn: 'পরিশোধযোগ্য', value: tenantTotalPayable, fill: 'hsl(var(--warning))', link: '/invoices?status=unpaid' },
      { name: 'Pending Bills', nameBn: 'বকেয়া বিল', value: pendingPayments, fill: 'hsl(var(--destructive))', link: '/invoices?status=unpaid' },
      { name: 'Total Due', nameBn: 'মোট বকেয়া', value: tenantTotalPayable, fill: 'hsl(var(--primary))', link: '/invoices' },
    ];
  };

  // Build card content based on role
  const getCardContent = (card: DashboardCard): ReactNode => {
    const wrapWithLink = (content: ReactNode, link?: string) => {
      if (link) {
        return (
          <Link to={link} className="block h-full hover:scale-[1.02] transition-transform">
            {content}
          </Link>
        );
      }
      return content;
    };

    // Admin cards
    if (isAdmin) {
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
            card.link
          );
        case 'financial-summary':
          return (
            <FinancialWaterfallChart
              data={getFinancialData()}
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
            card.link
          );
        default:
          if (card.type === 'custom') {
            return <CustomStatCard card={card} />;
          }
          return null;
      }
    }

    // Owner cards
    if (isOwner) {
      switch (card.id) {
        case 'property-overview':
          return wrapWithLink(
            <OwnerPropertyCard
              totalFlats={ownerFlats?.length || 0}
              rentedFlats={ownerRentedFlats}
              selfOccupied={ownerSelfOccupied}
              vacant={ownerVacant}
              language={language}
            />,
            card.link
          );
        case 'financial-summary':
          return (
            <FinancialWaterfallChart
              data={getFinancialData()}
              language={language}
            />
          );
        case 'service-requests':
          return wrapWithLink(
            <Card className="stat-card border-0 bg-destructive/10 h-full cursor-pointer">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-destructive" />
                  {language === 'bn' ? 'সার্ভিস অনুরোধ' : 'Service Requests'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-destructive">{openRequests}</p>
                <p className="text-sm text-muted-foreground mt-1">{language === 'bn' ? 'চলমান অনুরোধ' : 'Open requests'}</p>
              </CardContent>
            </Card>,
            card.link
          );
        default:
          if (card.type === 'custom') {
            return <CustomStatCard card={card} />;
          }
          return null;
      }
    }

    // Tenant cards
    if (isTenant) {
      switch (card.id) {
        case 'property-overview':
          return (
            <TenantPropertyCard
              flatNumber={userFlat?.flat_number || '-'}
              floor={userFlat?.floor || 0}
              size={userFlat?.size || 0}
              language={language}
            />
          );
        case 'financial-summary':
          return (
            <FinancialWaterfallChart
              data={getFinancialData()}
              language={language}
            />
          );
        case 'service-requests':
          return wrapWithLink(
            <Card className="stat-card border-0 bg-destructive/10 h-full cursor-pointer">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-destructive" />
                  {language === 'bn' ? 'সার্ভিস অনুরোধ' : 'Service Requests'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-destructive">{openRequests}</p>
                <p className="text-sm text-muted-foreground mt-1">{language === 'bn' ? 'চলমান অনুরোধ' : 'Open requests'}</p>
              </CardContent>
            </Card>,
            card.link
          );
        default:
          if (card.type === 'custom') {
            return <CustomStatCard card={card} />;
          }
          return null;
      }
    }

    return null;
  };

  const draggableItems = dashboardCards.visibleCards
    .map(card => ({
      id: card.id,
      content: getCardContent(card),
    }))
    .filter(item => item.content !== null);

  return (
    <MainLayout>
      <Header 
        title={header.title}
        subtitle={header.subtitle}
        actions={
          <DashboardCustomizer
            cards={dashboardCards.cards}
            onToggleVisibility={dashboardCards.toggleCardVisibility}
            onAddCustomCard={dashboardCards.addCustomCard}
            onRemoveCard={dashboardCards.removeCard}
            onUpdateCard={dashboardCards.updateCard}
            onResetToDefaults={dashboardCards.resetToDefaults}
            onReorderCards={dashboardCards.reorderCards}
          />
        }
      />
      
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Draggable Stats Grid - Same for all roles */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
        ) : (
          <DraggableDashboardGrid
            items={draggableItems}
            onReorder={dashboardCards.reorderCards}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          />
        )}

        {/* Role-specific additional content */}
        {isAdmin && (
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
        )}

        {isOwner && userInvoices && userInvoices.length > 0 && (
          <OwnerPaymentChart invoices={userInvoices as any} language={language} />
        )}

        {/* Recent Service Requests for Owner/Tenant */}
        {(isOwner || isTenant) && (
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
        )}
      </div>
    </MainLayout>
  );
};

export default Dashboard;
