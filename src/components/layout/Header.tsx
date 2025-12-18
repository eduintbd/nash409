import { Bell, Search, LogOut, User, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const { t, language } = useLanguage();
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth', { replace: true });
    } catch (err: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: err?.message || (language === 'bn' ? 'লগআউট ব্যর্থ' : 'Logout failed'),
        variant: 'destructive',
      });
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 lg:h-16 items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 lg:px-6">
      {/* Left section - Title */}
      <div className="flex items-center gap-2 lg:gap-3 pl-10 lg:pl-0 min-w-0 flex-1 max-w-[50%] lg:max-w-none">
        <div className="min-w-0 flex-1">
          <h1 className="text-sm sm:text-base lg:text-xl font-semibold text-foreground truncate">{title}</h1>
          {subtitle && (
            <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground truncate hidden sm:block">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex-shrink-0 hidden lg:block">{actions}</div>}
      </div>

      {/* Right section - Controls */}
      <div className="flex items-center gap-1 sm:gap-2 lg:gap-3">
        {/* Search - hidden on mobile */}
        <div className="hidden lg:flex relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`${t.common.search}...`}
            className="w-48 xl:w-64 pl-9 bg-muted/50 border-0 focus-visible:ring-1"
          />
        </div>
        
        {/* Language Switcher */}
        <LanguageSwitcher />
        
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative h-8 w-8 lg:h-9 lg:w-9">
          <Bell className="h-4 w-4 lg:h-5 lg:w-5" />
          <span className="absolute top-1 right-1 lg:top-2 lg:right-2 h-2 w-2 rounded-full bg-destructive" />
        </Button>
        {/* User Menu */}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-8 w-8 lg:h-9 lg:w-9">
                <User className="h-4 w-4 lg:h-5 lg:w-5" />
                {isAdmin && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary flex items-center justify-center">
                    <Shield className="h-2 w-2 text-primary-foreground" />
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.email}</p>
                  <div className="flex items-center gap-2 pt-1">
                    {isAdmin && (
                      <Badge variant="secondary" className="text-xs">
                        {language === 'bn' ? 'অ্যাডমিন' : 'Admin'}
                      </Badge>
                    )}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => {
                  void handleSignOut();
                }}
                className="text-destructive cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {language === 'bn' ? 'লগআউট' : 'Logout'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="outline" size="sm" className="h-8 text-xs lg:text-sm" onClick={() => navigate('/auth')}>
            {language === 'bn' ? 'লগইন' : 'Login'}
          </Button>
        )}
      </div>
    </header>
  );
}
