import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Camera {
  id: string;
  name: string;
  location: string;
  camera_id: string | null;
  status: 'online' | 'offline';
  created_at: string;
  updated_at: string;
}

export const useCameras = () => {
  return useQuery({
    queryKey: ['cameras'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cameras')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Camera[];
    },
  });
};

export const useCreateCamera = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (camera: Omit<Camera, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('cameras')
        .insert(camera)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
      toast({ title: 'ক্যামেরা যুক্ত হয়েছে' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

export const useUpdateCamera = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Camera> & { id: string }) => {
      const { data, error } = await supabase
        .from('cameras')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
      toast({ title: 'ক্যামেরা আপডেট হয়েছে' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

export const useDeleteCamera = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cameras').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
      toast({ title: 'ক্যামেরা মুছে ফেলা হয়েছে' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};
