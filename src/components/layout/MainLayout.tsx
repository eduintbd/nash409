import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, isLoading, isRoleLoading, isAdmin, isApproved, userRole, buildingMemberships } = useAuth();

  // Show loading while checking auth or role (including building memberships)
  if (isLoading || isRoleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Admins bypass building membership requirements
  if (!isAdmin) {
    // Multi-building onboarding: a logged-in user with no approved membership is
    // routed to /onboarding so they can create a building or request to join one.
    const hasApprovedMembership = buildingMemberships.some((m) => m.isApproved);
    if (!hasApprovedMembership) {
      // Legacy pending-approval flow still applies if they have a pending user_roles row.
      if (userRole !== null && !isApproved) {
        return <Navigate to="/pending-approval" replace />;
      }
      return <Navigate to="/onboarding" replace />;
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pt-16 lg:pt-0 lg:pl-64">
        {children}
      </main>
    </div>
  );
}
