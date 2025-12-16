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
    mutationFn: async (owner: Omit<Owner, 'id' | 'created_at' | 'updated_at'> & { 
      flat_ids?: string[]; 
      flat_occupancy?: Record<string, 'owner-occupied' | 'for-rent'>;
      new_property?: {
        building_name: string;
        number_of_flats: number;
        from_flat_number: string;
        to_flat_number: string;
        start_floor: number;
      } | null;
    }) => {
      const { flat_ids, flat_occupancy, new_property, ...ownerData } = owner;
      
      let finalFlatIds = flat_ids || [];
      let finalFlatOccupancy = flat_occupancy || {};
      
      // If new property, create the flats first
      if (new_property) {
        const occupancy = flat_occupancy?.['new'] || 'owner-occupied';
        const status = occupancy === 'owner-occupied' ? 'owner-occupied' : 'vacant';
        
        // Create multiple flats based on the range
        const createdFlatIds: string[] = [];
        const numFlats = new_property.number_of_flats;
        
        // Generate flat numbers based on from-to pattern or simple numbering
        for (let i = 0; i < numFlats; i++) {
          const flatNumber = numFlats === 1 
            ? new_property.from_flat_number 
            : `${new_property.from_flat_number}-${i + 1}`;
          
          const floor = new_property.start_floor + Math.floor(i / 4); // 4 flats per floor
          
          const { data: newFlat, error: flatError } = await supabase
            .from('flats')
            .insert({
              flat_number: flatNumber,
              floor: floor,
              building_name: new_property.building_name,
              size: 1200,
              status: status as 'owner-occupied' | 'tenant' | 'vacant',
            })
            .select()
            .single();
          
          if (flatError) throw flatError;
          createdFlatIds.push(newFlat.id);
        }
        
        finalFlatIds = createdFlatIds;
        finalFlatOccupancy = Object.fromEntries(createdFlatIds.map(id => [id, occupancy]));
        ownerData.flat_id = createdFlatIds[0];
      }
      
      const { data, error } = await supabase
        .from('owners')
        .insert(ownerData)
        .select()
        .single();
      if (error) throw error;
      
      // Create owner_flats entries for multiple flats
      if (finalFlatIds.length > 0) {
        const ownerFlatsData = finalFlatIds.map(flatId => ({
          owner_id: data.id,
          flat_id: flatId,
        }));
        
        const { error: ownerFlatsError } = await supabase
          .from('owner_flats')
          .insert(ownerFlatsData);
        if (ownerFlatsError) throw ownerFlatsError;
        
        // Update flat status based on occupancy selection (for existing flats)
        if (!new_property) {
          for (const flatId of finalFlatIds) {
            const occupancy = finalFlatOccupancy[flatId] || 'owner-occupied';
            const status = occupancy === 'owner-occupied' ? 'owner-occupied' : 'vacant';
            await supabase
              .from('flats')
              .update({ status })
              .eq('id', flatId);
          }
        }
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
    mutationFn: async ({ id, flat_ids, flat_occupancy, new_property, ...updates }: Partial<Owner> & { 
      id: string; 
      flat_ids?: string[];
      flat_occupancy?: Record<string, 'owner-occupied' | 'for-rent'>;
      new_property?: {
        building_name: string;
        number_of_flats: number;
        from_flat_number: string;
        to_flat_number: string;
        start_floor: number;
      } | null;
    }) => {
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
          
          // Update flat status based on occupancy selection
          for (const flatId of flat_ids) {
            const occupancy = flat_occupancy?.[flatId] || 'owner-occupied';
            const status = occupancy === 'owner-occupied' ? 'owner-occupied' : 'vacant';
            await supabase
              .from('flats')
              .update({ status })
              .eq('id', flatId);
          }
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
