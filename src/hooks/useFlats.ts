import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useBuilding } from '@/contexts/BuildingContext';

export interface Flat {
  id: string;
  flat_number: string;
  building_name: string | null;
  floor: number;
  size: number;
  status: 'owner-occupied' | 'tenant' | 'vacant';
  parking_spot: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export const useFlats = () => {
  const { currentBuildingId } = useBuilding();
  return useQuery({
    queryKey: ['flats', currentBuildingId],
    enabled: !!currentBuildingId,
    queryFn: async () => {
      if (!currentBuildingId) return [];
      const { data, error } = await supabase
        .from('flats')
        .select('*')
        .eq('building_id', currentBuildingId)
        .order('display_order')
        .order('building_name')
        .order('flat_number');
      if (error) throw error;
      return data as Flat[];
    },
  });
};

export const useCreateFlat = () => {
  const queryClient = useQueryClient();
  const { currentBuildingId } = useBuilding();

  return useMutation({
    mutationFn: async (flat: Omit<Flat, 'id' | 'created_at' | 'updated_at' | 'display_order'>) => {
      if (!currentBuildingId) throw new Error('No building selected');
      const { data, error } = await supabase
        .from('flats')
        .insert({ ...flat, building_id: currentBuildingId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flats'] });
      toast({ title: 'Flat added / ফ্ল্যাট যোগ হয়েছে' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

export const useUpdateFlat = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Flat> & { id: string }) => {
      const { data, error } = await supabase
        .from('flats')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flats'] });
      toast({ title: 'Flat updated / ফ্ল্যাট আপডেট হয়েছে' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

export const useDeleteFlat = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('flats')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flats'] });
      toast({ title: 'Flat deleted / ফ্ল্যাট মুছে ফেলা হয়েছে' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

export const useReorderFlats = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (orderedFlats: { id: string; display_order: number }[]) => {
      // Update each flat's display_order
      const updates = orderedFlats.map(({ id, display_order }) =>
        supabase
          .from('flats')
          .update({ display_order })
          .eq('id', id)
      );
      
      const results = await Promise.all(updates);
      const errors = results.filter(r => r.error);
      if (errors.length > 0) throw errors[0].error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flats'] });
      toast({ title: 'Order saved / ক্রম সংরক্ষিত হয়েছে' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};
