import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCog,
  Receipt,
  Wallet,
  Wrench,
  Camera,
  Bot,
  Settings,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

export function Sidebar() {
  const { t } = useLanguage();
  const { isAdmin, isOwner, isTenant, userRole, user } = useAuth();

  // Full navigation for admin
  const adminNavigation = [
    { name: t.nav.dashboard, href: '/', icon: LayoutDashboard },
    { name: t.nav.flats, href: '/flats', icon: Building2 },
    { name: t.nav.residents, href: '/residents', icon: Users },
    { name: t.nav.employees, href: '/employees', icon: UserCog },
    { name: t.nav.invoices, href: '/invoices', icon: Receipt },
    { name: t.nav.expenses, href: '/expenses', icon: Wallet },
    { name: t.nav.serviceRequests, href: '/requests', icon: Wrench },
    { name: t.nav.cameras, href: '/cameras', icon: Camera },
    { name: t.nav.aiAssistant, href: '/assistant', icon: Bot },
  ];

  // Limited navigation for owners (can see building expenses + flats)
  const ownerNavigation = [
    { name: t.nav.dashboard, href: '/', icon: LayoutDashboard },
    { name: t.nav.flats, href: '/flats', icon: Building2 },
    { name: t.nav.invoices, href: '/invoices', icon: Receipt },
    { name: t.nav.expenses, href: '/expenses', icon: Wallet },
    { name: t.nav.serviceRequests, href: '/requests', icon: Wrench },
  ];

  // Minimal navigation for tenants (only their stuff)
  const tenantNavigation = [
    { name: t.nav.dashboard, href: '/', icon: LayoutDashboard },
    { name: t.nav.invoices, href: '/invoices', icon: Receipt },
    { name: t.nav.serviceRequests, href: '/requests', icon: Wrench },
  ];

  const navigation = isAdmin || userRole === 'user' 
    ? adminNavigation 
    : isOwner 
      ? ownerNavigation 
      : tenantNavigation;

  const getRoleLabel = () => {
    if (isAdmin) return 'Admin';
    if (isOwner) return 'Flat Owner';
    if (isTenant) return 'Tenant';
    return 'User';
  };

  const getUserInitials = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user?.email?.slice(0, 2).toUpperCase() || 'U';
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary">
            <Building2 className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-sidebar-foreground">BuildingMS</h1>
            <p className="text-xs text-sidebar-muted">Management System</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navigation.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'nav-item',
                  isActive && 'active'
                )
              }
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-sidebar-border p-3 space-y-1">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn('nav-item', isActive && 'active')
            }
          >
            <Settings className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-medium">{t.nav.settings}</span>
          </NavLink>
        </div>

        {/* User info */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center">
              <span className="text-sm font-medium text-sidebar-foreground">{getUserInitials()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.user_metadata?.full_name || user?.email || 'User'}
              </p>
              <p className="text-xs text-sidebar-muted truncate">{getRoleLabel()}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
