import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Check, X, Loader2, UserCheck, Users, Home } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { z } from 'zod';

const approveTenantSchema = z.object({
  userId: z.string().uuid('Invalid user id'),
  flatId: z.string().uuid('Invalid flat selection'),
});

const rejectTenantSchema = z.object({
  userId: z.string().uuid('Invalid user id'),
});

interface PendingTenant {
  id: string;
  user_id: string;
  role: string;
  requested_role: string | null;
  is_approved: boolean;
  created_at: string;
  requested_flat_id: string | null;
  profiles: {
    full_name: string | null;
    email: string | null;
  } | null;
  requested_flat?: {
    flat_number: string;
  } | null;
}

const TenantApprovals = () => {
  const { language } = useLanguage();
  const { user, isOwner, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [selectedFlats, setSelectedFlats] = useState<Record<string, string>>({});

  // Get owner's flats
  const { data: ownerFlats } = useQuery({
    queryKey: ['owner-flats-for-approval', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Get owner record
      const { data: owner } = await supabase
        .from('owners')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (!owner) return [];

      // Get all flats for this owner
      const { data: ownerFlatsData, error } = await supabase
        .from('owner_flats')
        .select('flat_id, flats(id, flat_number, status)')
        .eq('owner_id', owner.id);
      
      if (error) throw error;
      return ownerFlatsData?.map(of => (of as any).flats) || [];
    },
    enabled: !!user?.id && isOwner,
  });

  const ownerFlatIds = ownerFlats?.map((f: any) => f.id) || [];

  // Fetch pending tenants for owner's flats
  const { data: pendingTenants, isLoading } = useQuery({
    queryKey: ['pending-tenants', ownerFlatIds],
    queryFn: async () => {
      if (ownerFlatIds.length === 0) return [];

      // Get pending user_roles with tenant requested_role
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('id, user_id, role, requested_role, is_approved, created_at')
        .eq('is_approved', false)
        .eq('requested_role', 'tenant')
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;
      if (!rolesData || rolesData.length === 0) return [];

      // Get user metadata to find requested flat_id
      const userIds = rolesData.map(r => r.user_id);
      
      // Get profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      // Filter to only tenants requesting owner's flats
      // We need to check auth.users metadata, but we can't access that directly
      // Instead, we'll show all pending tenants and let owner select flat
      const results: PendingTenant[] = rolesData.map(role => ({
        ...role,
        requested_flat_id: null, // Will be selected by owner
        profiles: profilesMap.get(role.user_id) || null,
        requested_flat: null,
      }));

      return results;
    },
    enabled: ownerFlatIds.length > 0,
  });

  // Approve tenant mutation
  const approveMutation = useMutation({
    mutationFn: async (input: { userId: string; flatId: string }) => {
      const { userId, flatId } = approveTenantSchema.parse(input);
      // Verify the owner owns this flat
      if (!ownerFlatIds.includes(flatId)) {
        throw new Error('You do not own this flat');
      }

      if (!user?.id) throw new Error('Not authenticated');

      // Get owner record for approved_by_owner_id
      const { data: owner } = await supabase
        .from('owners')
        .select('id')
        .eq('user_id', user.id)
        .single();

      // Get profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', userId)
        .single();

      // Update user_roles to approved
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ 
          is_approved: true, 
          role: 'tenant',
          approved_by_owner_id: owner?.id 
        })
        .eq('user_id', userId);

      if (roleError) throw roleError;

      // Create tenant record
      const { error: tenantError } = await supabase
        .from('tenants')
        .insert({
          user_id: userId,
          name: profile?.full_name || 'Unknown',
          email: profile?.email,
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

      return { userId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['flats'] });
      toast({
        title: language === 'bn' ? 'সফল' : 'Success',
        description: language === 'bn' ? 'ভাড়াটিয়া অনুমোদিত হয়েছে' : 'Tenant has been approved',
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

  // Reject tenant mutation
  const rejectMutation = useMutation({
    mutationFn: async (rawUserId: string) => {
      const { userId } = rejectTenantSchema.parse({ userId: rawUserId });
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
      if (error) throw error;

      await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      return userId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-tenants'] });
      toast({
        title: language === 'bn' ? 'প্রত্যাখ্যান' : 'Rejected',
        description: language === 'bn' ? 'ভাড়াটিয়া প্রত্যাখ্যাত হয়েছে' : 'Tenant has been rejected',
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

  const handleApprove = (userId: string) => {
    const flatId = selectedFlats[userId];
    if (!flatId) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' ? 'অনুগ্রহ করে একটি ফ্ল্যাট নির্বাচন করুন' : 'Please select a flat first',
        variant: 'destructive',
      });
      return;
    }
    approveMutation.mutate({ userId, flatId });
  };

  // Only owners (and admins) can access this page
  if (!isOwner && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <UserCheck className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">
            {language === 'bn' ? 'ভাড়াটিয়া অনুমোদন' : 'Tenant Approvals'}
          </h1>
        </div>

        {/* Owner's Flats Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Home className="h-5 w-5" />
              {language === 'bn' ? 'আপনার ফ্ল্যাটসমূহ' : 'Your Flats'}
            </CardTitle>
            <CardDescription>
              {language === 'bn' 
                ? 'আপনি এই ফ্ল্যাটগুলির জন্য ভাড়াটিয়া অনুমোদন করতে পারেন'
                : 'You can approve tenants for these flats'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {ownerFlats?.map((flat: any) => (
                <Badge key={flat.id} variant="secondary">
                  {language === 'bn' ? `ফ্ল্যাট ${flat.flat_number}` : `Flat ${flat.flat_number}`}
                  <span className="ml-1 text-xs opacity-70">({flat.status})</span>
                </Badge>
              ))}
              {(!ownerFlats || ownerFlats.length === 0) && (
                <span className="text-muted-foreground">
                  {language === 'bn' ? 'কোন ফ্ল্যাট নেই' : 'No flats assigned'}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Tenants */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {language === 'bn' ? 'অপেক্ষমাণ ভাড়াটিয়া' : 'Pending Tenants'}
              {pendingTenants && pendingTenants.length > 0 && (
                <Badge variant="secondary">{pendingTenants.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : pendingTenants && pendingTenants.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === 'bn' ? 'নাম' : 'Name'}</TableHead>
                    <TableHead>{language === 'bn' ? 'ইমেইল' : 'Email'}</TableHead>
                    <TableHead>{language === 'bn' ? 'ফ্ল্যাট নির্বাচন' : 'Assign to Flat'}</TableHead>
                    <TableHead>{language === 'bn' ? 'তারিখ' : 'Date'}</TableHead>
                    <TableHead className="text-right">{language === 'bn' ? 'কার্যক্রম' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingTenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell className="font-medium">
                        {tenant.profiles?.full_name || '-'}
                      </TableCell>
                      <TableCell>{tenant.profiles?.email || '-'}</TableCell>
                      <TableCell>
                        <Select
                          value={selectedFlats[tenant.user_id] || ''}
                          onValueChange={(value) => 
                            setSelectedFlats(prev => ({ ...prev, [tenant.user_id]: value }))
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder={language === 'bn' ? 'নির্বাচন' : 'Select'} />
                          </SelectTrigger>
                          <SelectContent>
                            {ownerFlats?.filter((f: any) => f.status !== 'tenant').map((flat: any) => (
                              <SelectItem key={flat.id} value={flat.id}>
                                {flat.flat_number}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(tenant.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(tenant.user_id)}
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
                            onClick={() => rejectMutation.mutate(tenant.user_id)}
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
                <p>{language === 'bn' ? 'কোন অপেক্ষমাণ ভাড়াটিয়া নেই' : 'No pending tenant requests'}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default TenantApprovals;
