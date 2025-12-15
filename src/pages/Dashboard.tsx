import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { FinancialSummary } from '@/components/dashboard/FinancialSummary';
import { OccupancyChart } from '@/components/dashboard/OccupancyChart';
import { mockFlats, mockInvoices, mockServiceRequests, mockEmployees } from '@/data/mockData';
import { Building2, Users, Receipt, Wrench } from 'lucide-react';

const Dashboard = () => {
  const occupiedFlats = mockFlats.filter(f => f.status !== 'vacant').length;
  const pendingPayments = mockInvoices.filter(inv => inv.status === 'unpaid' || inv.status === 'overdue').length;
  const openRequests = mockServiceRequests.filter(req => req.status === 'open' || req.status === 'in-progress').length;
  const activeEmployees = mockEmployees.length;

  return (
    <MainLayout>
      <Header 
        title="Dashboard" 
        subtitle="Welcome back! Here's what's happening in your building."
      />
      
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard
            title="Total Flats"
            value={mockFlats.length}
            icon={Building2}
            variant="primary"
          />
          <StatCard
            title="Occupied"
            value={occupiedFlats}
            icon={Users}
            variant="success"
            trend={{ value: 5, isPositive: true }}
          />
          <StatCard
            title="Pending Payments"
            value={pendingPayments}
            icon={Receipt}
            variant="warning"
          />
          <StatCard
            title="Open Requests"
            value={openRequests}
            icon={Wrench}
            variant="destructive"
          />
        </div>

        {/* Financial Summary */}
        <FinancialSummary />

        {/* Charts and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <OccupancyChart />
          <div className="lg:col-span-2">
            <RecentActivity />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
