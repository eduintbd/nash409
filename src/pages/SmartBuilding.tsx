import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Zap, Droplets, BarChart3, Bell, Wrench, Thermometer, Building2 } from 'lucide-react';

import { ElectricityMonitor } from '@/components/smart-building/ElectricityMonitor';
import { WaterMonitor } from '@/components/smart-building/WaterMonitor';
import { EnergyDashboard } from '@/components/smart-building/EnergyDashboard';
import { SmartAlerts } from '@/components/smart-building/SmartAlerts';
import { MaintenanceScheduling } from '@/components/smart-building/MaintenanceScheduling';
import { TemperatureControl } from '@/components/smart-building/TemperatureControl';

const SmartBuilding = () => {
  const { isAdmin, isLoading } = useAuth();

  // Only admins can access this page
  if (!isLoading && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <MainLayout>
      <Header
        title="Smart Building Management"
        subtitle="Monitor utilities, manage alerts, and control building systems"
      />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="electricity" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Electricity</span>
          </TabsTrigger>
          <TabsTrigger value="water" className="flex items-center gap-2">
            <Droplets className="h-4 w-4" />
            <span className="hidden sm:inline">Water</span>
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Alerts</span>
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            <span className="hidden sm:inline">Maintenance</span>
          </TabsTrigger>
          <TabsTrigger value="hvac" className="flex items-center gap-2">
            <Thermometer className="h-4 w-4" />
            <span className="hidden sm:inline">HVAC</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <EnergyDashboard />
        </TabsContent>

        <TabsContent value="electricity">
          <ElectricityMonitor />
        </TabsContent>

        <TabsContent value="water">
          <WaterMonitor />
        </TabsContent>

        <TabsContent value="alerts">
          <SmartAlerts />
        </TabsContent>

        <TabsContent value="maintenance">
          <MaintenanceScheduling />
        </TabsContent>

        <TabsContent value="hvac">
          <TemperatureControl />
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default SmartBuilding;
