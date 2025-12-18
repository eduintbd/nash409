import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Dashboard from "./pages/Dashboard";
import Flats from "./pages/Flats";
import Residents from "./pages/Residents";
import Employees from "./pages/Employees";
import Invoices from "./pages/Invoices";
import Expenses from "./pages/Expenses";
import ServiceRequests from "./pages/ServiceRequests";
import Cameras from "./pages/Cameras";
import AIAssistant from "./pages/AIAssistant";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import PendingApproval from "./pages/PendingApproval";
import UserApprovals from "./pages/UserApprovals";
import TenantApprovals from "./pages/TenantApprovals";
import MyTenant from "./pages/MyTenant";
import MyProperties from "./pages/MyProperties";
import TenantAgreement from "./pages/TenantAgreement";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/pending-approval" element={<PendingApproval />} />
              <Route path="/user-approvals" element={<UserApprovals />} />
              <Route path="/tenant-approvals" element={<TenantApprovals />} />
              <Route path="/flats" element={<Flats />} />
              <Route path="/my-tenant" element={<MyTenant />} />
              <Route path="/my-properties" element={<MyProperties />} />
              <Route path="/residents" element={<Residents />} />
              <Route path="/employees" element={<Employees />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/requests" element={<ServiceRequests />} />
              <Route path="/cameras" element={<Cameras />} />
              <Route path="/assistant" element={<AIAssistant />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/tenant-agreement/:token" element={<TenantAgreement />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
