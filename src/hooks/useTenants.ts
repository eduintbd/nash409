import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Tenant {
  id: string;
  flat_id: string | null;
  name: string;
  email: string | null;
  phone: string;
  nid: string | null;
  rent_amount: number;
  start_date: string;
  end_date: string | null;
  security_deposit: number | null;
  house_rules: string | null;
  maintenance_responsibilities: string | null;
  agreement_status: string | null;
  agreement_token: string | null;
  agreement_agreed_at: string | null;
  invitation_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useTenants = () => {
  return useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('*, flats(flat_number)')
        .order('name');
      if (error) throw error;
      return data;
    },
  });
};

export type CreateTenantInput = Omit<Tenant, 'id' | 'created_at' | 'updated_at' | 'agreement_status' | 'agreement_token' | 'agreement_agreed_at' | 'invitation_sent_at'>;

export const useCreateTenant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (tenant: CreateTenantInput) => {
      const { data, error } = await supabase
        .from('tenants')
        .insert(tenant)
        .select()
        .single();
      if (error) throw error;
      
      // Auto-update flat status to 'tenant' when tenant is assigned
      if (tenant.flat_id) {
        await supabase
          .from('flats')
          .update({ status: 'tenant' })
          .eq('id', tenant.flat_id);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['flats'] });
      toast({ title: 'Tenant added / ভাড়াটিয়া যুক্ত হয়েছে' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

export const useUpdateTenant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Tenant> & { id: string }) => {
      const { data, error } = await supabase
        .from('tenants')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast({ title: 'Tenant updated / ভাড়াটিয়া আপডেট হয়েছে' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

export const useDeleteTenant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tenants').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['flats'] });
      toast({ title: 'Tenant deleted / ভাড়াটিয়া মুছে ফেলা হয়েছে' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};
