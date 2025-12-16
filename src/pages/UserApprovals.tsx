import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Check, X, Loader2, UserCheck, Users } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useFlats } from '@/hooks/useFlats';

interface PendingUser {
  id: string;
  user_id: string;
  role: string;
  requested_role: string | null;
  is_approved: boolean;
  created_at: string;
  profiles: {
    full_name: string | null;
    email: string | null;
  } | null;
}

const UserApprovals = () => {
  const { language } = useLanguage();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { data: flats } = useFlats();
  const [selectedFlats, setSelectedFlats] = useState<Record<string, string>>({});

  // Fetch pending users
  const { data: pendingUsers, isLoading } = useQuery({
    queryKey: ['pending-users'],
    queryFn: async () => {
      // First get user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('id, user_id, role, requested_role, is_approved, created_at')
        .eq('is_approved', false)
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;
      if (!rolesData || rolesData.length === 0) return [];

      // Get profile data for all users
      const userIds = rolesData.map(r => r.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Merge the data
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      return rolesData.map(role => ({
        ...role,
        profiles: profilesMap.get(role.user_id) || null
      })) as PendingUser[];
    },
  });

  // Approve user mutation
  const approveMutation = useMutation({
    mutationFn: async ({ userId, requestedRole, flatId }: { userId: string; requestedRole: string; flatId?: string }) => {
      // Get the user's profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', userId)
        .single();

      // Determine the actual role to set
      let finalRole: 'owner' | 'tenant' | 'user' = 'user';
      if (requestedRole === 'owner') finalRole = 'owner';
      else if (requestedRole === 'tenant') finalRole = 'tenant';

      // Update user_roles to approved and set the role
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ 
          is_approved: true, 
          role: finalRole 
        })
        .eq('user_id', userId);

      if (roleError) throw roleError;

      // If owner or tenant, create the corresponding record
      if (finalRole === 'owner' && flatId && profile) {
        // Create owner record
        const { data: newOwner, error: ownerError } = await supabase
          .from('owners')
          .insert({
            user_id: userId,
            name: profile.full_name || 'Unknown',
            email: profile.email,
            phone: '',
            flat_id: flatId,
          })
          .select('id')
          .single();
        if (ownerError) throw ownerError;

        // Also add to owner_flats junction table
        if (newOwner) {
          await supabase
            .from('owner_flats')
            .insert({
              owner_id: newOwner.id,
              flat_id: flatId,
            });
        }

        // Update flat status
        await supabase
          .from('flats')
          .update({ status: 'owner-occupied' })
          .eq('id', flatId);
      } else if (finalRole === 'tenant' && flatId && profile) {
        const { error: tenantError } = await supabase
          .from('tenants')
          .insert({
            user_id: userId,
            name: profile.full_name || 'Unknown',
            email: profile.email,
            phone: '',
            flat_id: flatId,
            rent_amount: 0,
          });
        if (tenantError) throw tenantError;

        // Update flat status
        await supabase
          .from('flats')
          .update({ status: 'tenant' })
          .eq('id', flatId);
      }

      return { userId, finalRole };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
      queryClient.invalidateQueries({ queryKey: ['owners'] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['flats'] });
      toast({
        title: language === 'bn' ? 'সফল' : 'Success',
        description: language === 'bn' ? 'ব্যবহারকারী অনুমোদিত হয়েছে' : 'User has been approved',
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Reject user mutation
  const rejectMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Delete the user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (roleError) throw roleError;

      // Delete the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) throw profileError;

      // Delete the auth user (this requires admin API, so we'll just leave it for now)
      // The user won't be able to login since their profile is deleted

      return userId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
      toast({
        title: language === 'bn' ? 'প্রত্যাখ্যান' : 'Rejected',
        description: language === 'bn' ? 'ব্যবহারকারী প্রত্যাখ্যাত হয়েছে' : 'User has been rejected',
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleApprove = (userId: string, requestedRole: string) => {
    const flatId = selectedFlats[userId];
    if ((requestedRole === 'owner' || requestedRole === 'tenant') && !flatId) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' ? 'অনুগ্রহ করে একটি ফ্ল্যাট নির্বাচন করুন' : 'Please select a flat first',
        variant: 'destructive',
      });
      return;
    }
    approveMutation.mutate({ userId, requestedRole, flatId });
  };

  const getRoleLabel = (role: string | null) => {
    if (!role) return language === 'bn' ? 'ব্যবহারকারী' : 'User';
    const labels: Record<string, { en: string; bn: string }> = {
      owner: { en: 'Flat Owner', bn: 'ফ্ল্যাট মালিক' },
      tenant: { en: 'Tenant', bn: 'ভাড়াটিয়া' },
      employee: { en: 'Employee', bn: 'কর্মচারী' },
    };
    return labels[role]?.[language] || role;
  };

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <UserCheck className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">
            {language === 'bn' ? 'অপেক্ষমাণ অনুমোদন' : 'Pending Approvals'}
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {language === 'bn' ? 'অপেক্ষমাণ ব্যবহারকারী' : 'Pending Users'}
              {pendingUsers && pendingUsers.length > 0 && (
                <Badge variant="secondary">{pendingUsers.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : pendingUsers && pendingUsers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === 'bn' ? 'নাম' : 'Name'}</TableHead>
                    <TableHead>{language === 'bn' ? 'ইমেইল' : 'Email'}</TableHead>
                    <TableHead>{language === 'bn' ? 'অনুরোধিত ভূমিকা' : 'Requested Role'}</TableHead>
                    <TableHead>{language === 'bn' ? 'ফ্ল্যাট' : 'Flat'}</TableHead>
                    <TableHead>{language === 'bn' ? 'তারিখ' : 'Date'}</TableHead>
                    <TableHead className="text-right">{language === 'bn' ? 'কার্যক্রম' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.profiles?.full_name || '-'}
                      </TableCell>
                      <TableCell>{user.profiles?.email || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getRoleLabel(user.requested_role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(user.requested_role === 'owner' || user.requested_role === 'tenant') ? (
                          <Select
                            value={selectedFlats[user.user_id] || ''}
                            onValueChange={(value) => 
                              setSelectedFlats(prev => ({ ...prev, [user.user_id]: value }))
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder={language === 'bn' ? 'নির্বাচন' : 'Select'} />
                            </SelectTrigger>
                            <SelectContent>
                              {flats?.filter(f => 
                                user.requested_role === 'owner' 
                                  ? f.status === 'vacant' 
                                  : (f.status === 'vacant' || f.status === 'owner-occupied')
                              ).map((flat) => (
                                <SelectItem key={flat.id} value={flat.id}>
                                  {flat.flat_number}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(user.user_id, user.requested_role || 'user')}
                            disabled={approveMutation.isPending}
                          >
                            {approveMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                            <span className="ml-1">{language === 'bn' ? 'অনুমোদন' : 'Approve'}</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => rejectMutation.mutate(user.user_id)}
                            disabled={rejectMutation.isPending}
                          >
                            {rejectMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                            <span className="ml-1">{language === 'bn' ? 'প্রত্যাখ্যান' : 'Reject'}</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{language === 'bn' ? 'কোন অপেক্ষমাণ অনুমোদন নেই' : 'No pending approvals'}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default UserApprovals;