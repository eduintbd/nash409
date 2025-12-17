import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface OwnerFlat {
  id: string;
  owner_id: string;
  flat_id: string;
  created_at: string;
}

// Get all owner flats with owner and flat details (for admin view)
export const useAllOwnerFlats = () => {
  return useQuery({
    queryKey: ['all-owner-flats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('owner_flats')
        .select('*, flats(*), owners(id, name, phone, email, owner_number)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

// Get all flats for a specific owner
export const useOwnerFlats = (ownerId?: string) => {
  return useQuery({
    queryKey: ['owner-flats', ownerId],
    queryFn: async () => {
      if (!ownerId) return [];
      const { data, error } = await supabase
        .from('owner_flats')
        .select('*, flats(id, flat_number, floor, size, status, parking_spot, building_name)')
        .eq('owner_id', ownerId);
      if (error) throw error;
      return data;
    },
    enabled: !!ownerId,
  });
};

// Get owner flats by user_id (for logged-in owner)
export const useMyOwnerFlats = (userId?: string) => {
  return useQuery({
    queryKey: ['my-owner-flats', userId],
    queryFn: async () => {
      if (!userId) return [];
      // First get owner record
      const { data: owner, error: ownerError } = await supabase
        .from('owners')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (ownerError) throw ownerError;
      if (!owner) return [];

      // Then get all flats for this owner
      const { data, error } = await supabase
        .from('owner_flats')
        .select('*, flats(id, flat_number, floor, size, status, parking_spot, building_name)')
        .eq('owner_id', owner.id);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

// Add flat to owner
export const useAddOwnerFlat = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ownerId, flatId }: { ownerId: string; flatId: string }) => {
      const { data, error } = await supabase
        .from('owner_flats')
        .insert({ owner_id: ownerId, flat_id: flatId })
        .select()
        .single();
      if (error) throw error;
      
      // Update flat status to owner-occupied
      await supabase
        .from('flats')
        .update({ status: 'owner-occupied' })
        .eq('id', flatId);
      
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['owner-flats', variables.ownerId] });
      queryClient.invalidateQueries({ queryKey: ['my-owner-flats'] });
      queryClient.invalidateQueries({ queryKey: ['flats'] });
      toast({ title: 'Flat added to owner' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

// Remove flat from owner
export const useRemoveOwnerFlat = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ownerId, flatId }: { ownerId: string; flatId: string }) => {
      const { error } = await supabase
        .from('owner_flats')
        .delete()
        .eq('owner_id', ownerId)
        .eq('flat_id', flatId);
      if (error) throw error;
      
      // Update flat status back to vacant
      await supabase
        .from('flats')
        .update({ status: 'vacant' })
        .eq('id', flatId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['owner-flats', variables.ownerId] });
      queryClient.invalidateQueries({ queryKey: ['my-owner-flats'] });
      queryClient.invalidateQueries({ queryKey: ['all-owner-flats'] });
      queryClient.invalidateQueries({ queryKey: ['flats'] });
      toast({ title: 'Property removed from owner' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};
