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
  userRole: AppRole | null;
  userFlatId: string | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isTenant, setIsTenant] = useState(false);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [userFlatId, setUserFlatId] = useState<string | null>(null);

  const checkUserRole = async (userId: string, email: string | undefined) => {
    // Check user_roles table
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
    
    const role = roleData?.role as AppRole | null;
    setUserRole(role);
    setIsAdmin(role === 'admin');
    setIsOwner(role === 'owner');
    setIsTenant(role === 'tenant');

    // Get flat_id based on role
    if (role === 'owner' && email) {
      const { data: ownerData } = await supabase
        .from('owners')
        .select('flat_id')
        .eq('email', email)
        .maybeSingle();
      setUserFlatId(ownerData?.flat_id || null);
    } else if (role === 'tenant' && email) {
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('flat_id')
        .eq('email', email)
        .maybeSingle();
      setUserFlatId(tenantData?.flat_id || null);
    } else {
      setUserFlatId(null);
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
          setUserRole(null);
          setUserFlatId(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      if (session?.user) {
        checkUserRole(session.user.id, session.user.email);
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
    await supabase.auth.signOut();
    setIsAdmin(false);
    setIsOwner(false);
    setIsTenant(false);
    setUserRole(null);
    setUserFlatId(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, session, isLoading, isAdmin, isOwner, isTenant, userRole, userFlatId, 
      signIn, signUp, signOut 
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
