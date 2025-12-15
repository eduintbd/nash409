import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/dashboard/StatCard';
import { useFlats } from '@/hooks/useFlats';
import { useInvoices } from '@/hooks/useInvoices';
import { useServiceRequests } from '@/hooks/useServiceRequests';
import { useEmployees } from '@/hooks/useEmployees';
import { useExpenses } from '@/hooks/useExpenses';
import { Building2, Users, Receipt, Wrench, TrendingUp, TrendingDown } from 'lucide-react';
import { formatBDT } from '@/lib/currency';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Dashboard = () => {
  const { data: flats, isLoading: loadingFlats } = useFlats();
  const { data: invoices, isLoading: loadingInvoices } = useInvoices();
  const { data: requests, isLoading: loadingRequests } = useServiceRequests();
  const { data: employees, isLoading: loadingEmployees } = useEmployees();
  const { data: expenses, isLoading: loadingExpenses } = useExpenses();

  const occupiedFlats = flats?.filter(f => f.status !== 'vacant').length || 0;
  const pendingPayments = invoices?.filter(inv => inv.status === 'unpaid' || inv.status === 'overdue').length || 0;
  const openRequests = requests?.filter(req => req.status === 'open' || req.status === 'in-progress').length || 0;
  const activeEmployees = employees?.length || 0;

  const totalIncome = invoices?.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.amount), 0) || 0;
  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
  const pendingAmount = invoices?.filter(i => i.status !== 'paid').reduce((sum, i) => sum + Number(i.amount), 0) || 0;

  const isLoading = loadingFlats || loadingInvoices || loadingRequests || loadingEmployees || loadingExpenses;

  return (
    <MainLayout>
      <Header 
        title="ড্যাশবোর্ড" 
        subtitle="স্বাগতম! আপনার বিল্ডিংয়ের সারসংক্ষেপ"
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
              title="মোট ফ্ল্যাট"
              value={flats?.length || 0}
              icon={Building2}
              variant="primary"
            />
            <StatCard
              title="অকুপাইড"
              value={occupiedFlats}
              icon={Users}
              variant="success"
            />
            <StatCard
              title="বকেয়া বিল"
              value={pendingPayments}
              icon={Receipt}
              variant="warning"
            />
            <StatCard
              title="সার্ভিস অনুরোধ"
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
                মোট আয়
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-success">{formatBDT(totalIncome)}</p>
              <p className="text-sm text-muted-foreground mt-1">পরিশোধিত বিল থেকে</p>
            </CardContent>
          </Card>
          
          <Card className="stat-card border-0 bg-destructive/5">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-destructive" />
                মোট খরচ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-destructive">{formatBDT(totalExpenses)}</p>
              <p className="text-sm text-muted-foreground mt-1">সকল খরচ মিলিয়ে</p>
            </CardContent>
          </Card>
          
          <Card className="stat-card border-0 bg-warning/5">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-warning" />
                বকেয়া পরিমাণ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-warning">{formatBDT(pendingAmount)}</p>
              <p className="text-sm text-muted-foreground mt-1">{pendingPayments} টি বিল বাকি</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="stat-card border-0">
            <CardHeader>
              <CardTitle className="text-lg">ফ্ল্যাট অবস্থা</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">মালিক থাকেন</span>
                  <span className="font-semibold">{flats?.filter(f => f.status === 'owner-occupied').length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">ভাড়াটিয়া থাকেন</span>
                  <span className="font-semibold">{flats?.filter(f => f.status === 'tenant').length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">খালি</span>
                  <span className="font-semibold">{flats?.filter(f => f.status === 'vacant').length || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card border-0">
            <CardHeader>
              <CardTitle className="text-lg">কর্মচারী</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">গার্ড</span>
                  <span className="font-semibold">{employees?.filter(e => e.role === 'guard').length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">ক্লিনার</span>
                  <span className="font-semibold">{employees?.filter(e => e.role === 'cleaner').length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">কেয়ারটেকার</span>
                  <span className="font-semibold">{employees?.filter(e => e.role === 'caretaker').length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">মোট বেতন</span>
                  <span className="font-semibold">{formatBDT(employees?.reduce((sum, e) => sum + e.salary, 0) || 0)}/মাস</span>
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
