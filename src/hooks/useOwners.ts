import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Owner {
  id: string;
  flat_id: string | null;
  name: string;
  email: string | null;
  phone: string;
  nid: string | null;
  emergency_contact: string | null;
  ownership_start: string;
  created_at: string;
  updated_at: string;
}

export const useOwners = () => {
  return useQuery({
    queryKey: ['owners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('owners')
        .select('*, flats(flat_number)')
        .order('name');
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateOwner = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (owner: Omit<Owner, 'id' | 'created_at' | 'updated_at'> & { flat_ids?: string[] }) => {
      const { flat_ids, ...ownerData } = owner;
      
      const { data, error } = await supabase
        .from('owners')
        .insert(ownerData)
        .select()
        .single();
      if (error) throw error;
      
      // Create owner_flats entries for multiple flats
      if (flat_ids && flat_ids.length > 0) {
        const ownerFlatsData = flat_ids.map(flatId => ({
          owner_id: data.id,
          flat_id: flatId,
        }));
        
        const { error: ownerFlatsError } = await supabase
          .from('owner_flats')
          .insert(ownerFlatsData);
        if (ownerFlatsError) throw ownerFlatsError;
        
        // Update all flats status to 'owner-occupied'
        await supabase
          .from('flats')
          .update({ status: 'owner-occupied' })
          .in('id', flat_ids);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owners'] });
      queryClient.invalidateQueries({ queryKey: ['flats'] });
      queryClient.invalidateQueries({ queryKey: ['owner_flats'] });
      queryClient.invalidateQueries({ queryKey: ['all_owner_flats'] });
      toast({ title: 'Owner added / মালিক যুক্ত হয়েছে' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

export const useUpdateOwner = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, flat_ids, ...updates }: Partial<Owner> & { id: string; flat_ids?: string[] }) => {
      const { data, error } = await supabase
        .from('owners')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      
      // Update owner_flats if flat_ids is provided
      if (flat_ids !== undefined) {
        // Delete existing owner_flats
        await supabase
          .from('owner_flats')
          .delete()
          .eq('owner_id', id);
        
        // Insert new owner_flats
        if (flat_ids.length > 0) {
          const ownerFlatsData = flat_ids.map(flatId => ({
            owner_id: id,
            flat_id: flatId,
          }));
          
          await supabase
            .from('owner_flats')
            .insert(ownerFlatsData);
          
          // Update all new flats status to 'owner-occupied'
          await supabase
            .from('flats')
            .update({ status: 'owner-occupied' })
            .in('id', flat_ids);
        }
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owners'] });
      queryClient.invalidateQueries({ queryKey: ['flats'] });
      queryClient.invalidateQueries({ queryKey: ['owner_flats'] });
      queryClient.invalidateQueries({ queryKey: ['all_owner_flats'] });
      toast({ title: 'Owner updated / মালিক আপডেট হয়েছে' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

export const useDeleteOwner = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('owners').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owners'] });
      queryClient.invalidateQueries({ queryKey: ['flats'] });
      queryClient.invalidateQueries({ queryKey: ['owner_flats'] });
      queryClient.invalidateQueries({ queryKey: ['all_owner_flats'] });
      toast({ title: 'Owner deleted / মালিক মুছে ফেলা হয়েছে' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};
