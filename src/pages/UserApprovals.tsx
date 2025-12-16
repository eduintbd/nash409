import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Check, X, Loader2, UserCheck, Users, Edit, Key, Search } from 'lucide-react';
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

interface UserWithProfile {
  id: string;
  user_id: string;
  role: string;
  is_approved: boolean;
  created_at: string;
  profiles: {
    id: string;
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
  const [activeTab, setActiveTab] = useState('pending');
  const [userSearch, setUserSearch] = useState('');
  
  // Edit profile dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithProfile | null>(null);
  const [editForm, setEditForm] = useState({ full_name: '', email: '' });
  
  // Reset password dialog state
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<UserWithProfile | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Fetch pending users
  const { data: pendingUsers, isLoading: pendingLoading } = useQuery({
    queryKey: ['pending-users'],
    queryFn: async () => {
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('id, user_id, role, requested_role, is_approved, created_at')
        .eq('is_approved', false)
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;
      if (!rolesData || rolesData.length === 0) return [];

      const userIds = rolesData.map(r => r.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      return rolesData.map(role => ({
        ...role,
        profiles: profilesMap.get(role.user_id) || null
      })) as PendingUser[];
    },
  });

  // Fetch all users
  const { data: allUsers, isLoading: allUsersLoading } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('id, user_id, role, is_approved, created_at')
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;
      if (!rolesData || rolesData.length === 0) return [];

      const userIds = rolesData.map(r => r.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      return rolesData.map(role => ({
        ...role,
        profiles: profilesMap.get(role.user_id) || null
      })) as UserWithProfile[];
    },
  });

  // Filter users by search
  const filteredUsers = allUsers?.filter(user => {
    const search = userSearch.toLowerCase();
    return (
      user.profiles?.full_name?.toLowerCase().includes(search) ||
      user.profiles?.email?.toLowerCase().includes(search) ||
      user.role.toLowerCase().includes(search)
    );
  });

  // Approve user mutation
  const approveMutation = useMutation({
    mutationFn: async ({ userId, requestedRole, flatId }: { userId: string; requestedRole: string; flatId?: string }) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', userId)
        .single();

      let finalRole: 'owner' | 'tenant' | 'user' = 'user';
      if (requestedRole === 'owner') finalRole = 'owner';
      else if (requestedRole === 'tenant') finalRole = 'tenant';

      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ is_approved: true, role: finalRole })
        .eq('user_id', userId);

      if (roleError) throw roleError;

      if (finalRole === 'owner' && flatId && profile) {
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

        if (newOwner) {
          await supabase.from('owner_flats').insert({
            owner_id: newOwner.id,
            flat_id: flatId,
          });
        }

        await supabase.from('flats').update({ status: 'owner-occupied' }).eq('id', flatId);
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

        await supabase.from('flats').update({ status: 'tenant' }).eq('id', flatId);
      }

      return { userId, finalRole };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
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
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (roleError) throw roleError;

      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) throw profileError;

      return userId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
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

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async ({ userId, full_name, email }: { userId: string; full_name: string; email: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name, email })
        .eq('id', userId);

      if (error) throw error;
      return { userId, full_name, email };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      setEditDialogOpen(false);
      setEditingUser(null);
      toast({
        title: language === 'bn' ? 'সফল' : 'Success',
        description: language === 'bn' ? 'প্রোফাইল আপডেট হয়েছে' : 'Profile updated successfully',
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

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('admin-reset-password', {
        body: { userId, newPassword },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);
      
      return response.data;
    },
    onSuccess: () => {
      setResetPasswordDialogOpen(false);
      setResetPasswordUser(null);
      setNewPassword('');
      toast({
        title: language === 'bn' ? 'সফল' : 'Success',
        description: language === 'bn' ? 'পাসওয়ার্ড রিসেট হয়েছে' : 'Password reset successfully',
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

  const handleEditProfile = (user: UserWithProfile) => {
    setEditingUser(user);
    setEditForm({
      full_name: user.profiles?.full_name || '',
      email: user.profiles?.email || '',
    });
    setEditDialogOpen(true);
  };

  const handleResetPassword = (user: UserWithProfile) => {
    setResetPasswordUser(user);
    setNewPassword('');
    setResetPasswordDialogOpen(true);
  };

  const getRoleLabel = (role: string | null) => {
    if (!role) return language === 'bn' ? 'ব্যবহারকারী' : 'User';
    const labels: Record<string, { en: string; bn: string }> = {
      admin: { en: 'Admin', bn: 'অ্যাডমিন' },
      owner: { en: 'Flat Owner', bn: 'ফ্ল্যাট মালিক' },
      tenant: { en: 'Tenant', bn: 'ভাড়াটিয়া' },
      employee: { en: 'Employee', bn: 'কর্মচারী' },
      user: { en: 'User', bn: 'ব্যবহারকারী' },
    };
    return labels[role]?.[language] || role;
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'owner': return 'default';
      case 'tenant': return 'secondary';
      default: return 'outline';
    }
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
            {language === 'bn' ? 'ব্যবহারকারী ব্যবস্থাপনা' : 'User Management'}
          </h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <UserCheck className="h-4 w-4" />
              {language === 'bn' ? 'অপেক্ষমাণ অনুমোদন' : 'Pending Approvals'}
              {pendingUsers && pendingUsers.length > 0 && (
                <Badge variant="secondary" className="ml-1">{pendingUsers.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-2">
              <Users className="h-4 w-4" />
              {language === 'bn' ? 'সব ব্যবহারকারী' : 'All Users'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {language === 'bn' ? 'অপেক্ষমাণ ব্যবহারকারী' : 'Pending Users'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingLoading ? (
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
          </TabsContent>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {language === 'bn' ? 'সব ব্যবহারকারী' : 'All Users'}
                    {allUsers && <Badge variant="secondary">{allUsers.length}</Badge>}
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={language === 'bn' ? 'অনুসন্ধান...' : 'Search...'}
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {allUsersLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredUsers && filteredUsers.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{language === 'bn' ? 'নাম' : 'Name'}</TableHead>
                        <TableHead>{language === 'bn' ? 'ইমেইল' : 'Email'}</TableHead>
                        <TableHead>{language === 'bn' ? 'ভূমিকা' : 'Role'}</TableHead>
                        <TableHead>{language === 'bn' ? 'স্থিতি' : 'Status'}</TableHead>
                        <TableHead>{language === 'bn' ? 'যোগদান' : 'Joined'}</TableHead>
                        <TableHead className="text-right">{language === 'bn' ? 'কার্যক্রম' : 'Actions'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.profiles?.full_name || '-'}
                          </TableCell>
                          <TableCell>{user.profiles?.email || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(user.role) as any}>
                              {getRoleLabel(user.role)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.is_approved ? 'default' : 'secondary'}>
                              {user.is_approved 
                                ? (language === 'bn' ? 'অনুমোদিত' : 'Approved')
                                : (language === 'bn' ? 'অপেক্ষমাণ' : 'Pending')
                              }
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditProfile(user)}
                              >
                                <Edit className="h-4 w-4" />
                                <span className="ml-1 hidden sm:inline">
                                  {language === 'bn' ? 'সম্পাদনা' : 'Edit'}
                                </span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResetPassword(user)}
                              >
                                <Key className="h-4 w-4" />
                                <span className="ml-1 hidden sm:inline">
                                  {language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
                                </span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{language === 'bn' ? 'কোন ব্যবহারকারী পাওয়া যায়নি' : 'No users found'}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'bn' ? 'প্রোফাইল সম্পাদনা' : 'Edit Profile'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{language === 'bn' ? 'পুরো নাম' : 'Full Name'}</Label>
              <Input
                value={editForm.full_name}
                onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{language === 'bn' ? 'ইমেইল' : 'Email'}</Label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button
              onClick={() => editingUser && updateProfileMutation.mutate({
                userId: editingUser.user_id,
                full_name: editForm.full_name,
                email: editForm.email,
              })}
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {language === 'bn' ? 'সংরক্ষণ' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'bn' ? 'পাসওয়ার্ড রিসেট করুন' : 'Reset Password'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {language === 'bn' 
                ? `${resetPasswordUser?.profiles?.full_name || resetPasswordUser?.profiles?.email} এর জন্য নতুন পাসওয়ার্ড সেট করুন`
                : `Set a new password for ${resetPasswordUser?.profiles?.full_name || resetPasswordUser?.profiles?.email}`
              }
            </p>
            <div className="space-y-2">
              <Label>{language === 'bn' ? 'নতুন পাসওয়ার্ড' : 'New Password'}</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={language === 'bn' ? 'কমপক্ষে ৬ অক্ষর' : 'At least 6 characters'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPasswordDialogOpen(false)}>
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button
              onClick={() => resetPasswordUser && resetPasswordMutation.mutate({
                userId: resetPasswordUser.user_id,
                newPassword,
              })}
              disabled={resetPasswordMutation.isPending || newPassword.length < 6}
            >
              {resetPasswordMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {language === 'bn' ? 'রিসেট করুন' : 'Reset Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default UserApprovals;
