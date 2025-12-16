import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'user' | 'owner' | 'tenant';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  isTenant: boolean;
  isApproved: boolean;
  userRole: AppRole | null;
  userFlatId: string | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshUserRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRoleLoading, setIsRoleLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isTenant, setIsTenant] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [userFlatId, setUserFlatId] = useState<string | null>(null);

  const checkUserRole = async (userId: string, email: string | undefined) => {
    setIsRoleLoading(true);
    try {
      // Check user_roles table first
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role, is_approved')
        .eq('user_id', userId)
        .maybeSingle();
      
      let role = roleData?.role as AppRole | null;
      const approved = (roleData as any)?.is_approved ?? false;
      setIsApproved(approved);
      let flatId: string | null = null;

      // If no explicit role or role is 'user', check if user is owner/tenant by user_id or email
      if (!role || role === 'user') {
        // Check owners table by user_id first, then by email
        const { data: ownerByUserId } = await supabase
          .from('owners')
          .select('flat_id')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (ownerByUserId?.flat_id) {
          role = 'owner';
          flatId = ownerByUserId.flat_id;
        } else if (email) {
          const { data: ownerByEmail } = await supabase
            .from('owners')
            .select('flat_id')
            .eq('email', email)
            .maybeSingle();
          
          if (ownerByEmail?.flat_id) {
            role = 'owner';
            flatId = ownerByEmail.flat_id;
          }
        }

        // If not owner, check tenants table
        if (!flatId) {
          const { data: tenantByUserId } = await supabase
            .from('tenants')
            .select('flat_id')
            .eq('user_id', userId)
            .maybeSingle();
          
          if (tenantByUserId?.flat_id) {
            role = 'tenant';
            flatId = tenantByUserId.flat_id;
          } else if (email) {
            const { data: tenantByEmail } = await supabase
              .from('tenants')
              .select('flat_id')
              .eq('email', email)
              .maybeSingle();
            
            if (tenantByEmail?.flat_id) {
              role = 'tenant';
              flatId = tenantByEmail.flat_id;
            }
          }
        }
      } else if (role === 'owner') {
        // Get flat_id for owner
        const { data: ownerData } = await supabase
          .from('owners')
          .select('flat_id')
          .or(`user_id.eq.${userId},email.eq.${email || ''}`)
          .maybeSingle();
        flatId = ownerData?.flat_id || null;
      } else if (role === 'tenant') {
        // Get flat_id for tenant
        const { data: tenantData } = await supabase
          .from('tenants')
          .select('flat_id')
          .or(`user_id.eq.${userId},email.eq.${email || ''}`)
          .maybeSingle();
        flatId = tenantData?.flat_id || null;
      }

      setUserRole(role);
      setIsAdmin(role === 'admin');
      setIsOwner(role === 'owner');
      setIsTenant(role === 'tenant');
      setUserFlatId(flatId);
    } finally {
      setIsRoleLoading(false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        if (session?.user) {
          setTimeout(() => {
            checkUserRole(session.user.id, session.user.email);
          }, 0);
        } else {
          setIsAdmin(false);
          setIsOwner(false);
          setIsTenant(false);
          setIsApproved(false);
          setUserRole(null);
          setUserFlatId(null);
          setIsRoleLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      if (session?.user) {
        checkUserRole(session.user.id, session.user.email);
      } else {
        setIsRoleLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: fullName }
      }
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    // Clear local auth state immediately (even if network signOut fails)
    setSession(null);
    setUser(null);
    setIsAdmin(false);
    setIsOwner(false);
    setIsTenant(false);
    setIsApproved(false);
    setUserRole(null);
    setUserFlatId(null);

    if (error) throw error;
  };

  const refreshUserRole = async () => {
    if (user) {
      await checkUserRole(user.id, user.email);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, session, isLoading, isAdmin, isOwner, isTenant, isApproved, userRole, userFlatId, 
      signIn, signUp, signOut, refreshUserRole 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
