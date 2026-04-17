import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { BuildingProvider } from "@/contexts/BuildingContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Flats = lazy(() => import("./pages/Flats"));
const FlatLedger = lazy(() => import("./pages/FlatLedger"));
const Residents = lazy(() => import("./pages/Residents"));
const Employees = lazy(() => import("./pages/Employees"));
const Invoices = lazy(() => import("./pages/Invoices"));
const Expenses = lazy(() => import("./pages/Expenses"));
const ServiceRequests = lazy(() => import("./pages/ServiceRequests"));
const Cameras = lazy(() => import("./pages/Cameras"));
const AIAssistant = lazy(() => import("./pages/AIAssistant"));
const Settings = lazy(() => import("./pages/Settings"));
const Auth = lazy(() => import("./pages/Auth"));
const PendingApproval = lazy(() => import("./pages/PendingApproval"));
const UserApprovals = lazy(() => import("./pages/UserApprovals"));
const TenantApprovals = lazy(() => import("./pages/TenantApprovals"));
const MyTenant = lazy(() => import("./pages/MyTenant"));
const MyProperties = lazy(() => import("./pages/MyProperties"));
const TenantAgreement = lazy(() => import("./pages/TenantAgreement"));
const Landing = lazy(() => import("./pages/Landing"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const SmartBuilding = lazy(() => import("./pages/SmartBuilding"));
const GeneratorRuns = lazy(() => import("./pages/GeneratorRuns"));
const PendingMemberRequests = lazy(() => import("./pages/PendingMemberRequests"));
const PaymentApprovals = lazy(() => import("./pages/PaymentApprovals"));
const Compliance = lazy(() => import("./pages/Compliance"));
const StaffSchedule = lazy(() => import("./pages/StaffSchedule"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const PageFallback = () => (
  <div className="flex h-screen items-center justify-center" role="status" aria-live="polite">
    <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BuildingProvider>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ErrorBoundary scope="app-root">
                <Suspense fallback={<PageFallback />}>
                  <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route
                      path="/dashboard"
                      element={
                        <ErrorBoundary scope="dashboard">
                          <Dashboard />
                        </ErrorBoundary>
                      }
                    />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/onboarding" element={<Onboarding />} />
                    <Route path="/pending-approval" element={<PendingApproval />} />
                    <Route path="/user-approvals" element={<UserApprovals />} />
                    <Route path="/tenant-approvals" element={<TenantApprovals />} />
                    <Route path="/flats" element={<Flats />} />
                    <Route path="/flats/:flatId/ledger" element={<FlatLedger />} />
                    <Route path="/my-tenant" element={<MyTenant />} />
                    <Route path="/my-properties" element={<MyProperties />} />
                    <Route path="/residents" element={<Residents />} />
                    <Route path="/employees" element={<Employees />} />
                    <Route path="/invoices" element={<Invoices />} />
                    <Route path="/expenses" element={<Expenses />} />
                    <Route path="/requests" element={<ServiceRequests />} />
                    <Route path="/service-requests" element={<ServiceRequests />} />
                    <Route path="/cameras" element={<Cameras />} />
                    <Route
                      path="/smart-building"
                      element={
                        <ErrorBoundary scope="smart-building">
                          <SmartBuilding />
                        </ErrorBoundary>
                      }
                    />
                    <Route path="/generator-runs" element={<GeneratorRuns />} />
                    <Route path="/member-requests" element={<PendingMemberRequests />} />
                    <Route path="/payment-approvals" element={<PaymentApprovals />} />
                    <Route path="/compliance" element={<Compliance />} />
                    <Route path="/staff-schedule" element={<StaffSchedule />} />
                    <Route
                      path="/assistant"
                      element={
                        <ErrorBoundary scope="ai-assistant">
                          <AIAssistant />
                        </ErrorBoundary>
                      }
                    />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/tenant-agreement/:token" element={<TenantAgreement />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </BrowserRouter>
          </TooltipProvider>
        </LanguageProvider>
      </BuildingProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
