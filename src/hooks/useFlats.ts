import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Flat {
  id: string;
  flat_number: string;
  floor: number;
  size: number;
  status: 'owner-occupied' | 'tenant' | 'vacant';
  parking_spot: string | null;
  created_at: string;
  updated_at: string;
}

export const useFlats = () => {
  return useQuery({
    queryKey: ['flats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flats')
        .select('*')
        .order('flat_number');
      if (error) throw error;
      return data as Flat[];
    },
  });
};

export const useCreateFlat = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (flat: Omit<Flat, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('flats')
        .insert(flat)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flats'] });
      toast({ title: 'ফ্ল্যাট যোগ হয়েছে' });
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
      toast({ title: 'ফ্ল্যাট আপডেট হয়েছে' });
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
      toast({ title: 'ফ্ল্যাট মুছে ফেলা হয়েছে' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};
