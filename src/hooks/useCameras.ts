import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useBuilding } from '@/contexts/BuildingContext';

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
  const { currentBuildingId } = useBuilding();
  return useQuery({
    queryKey: ['cameras', currentBuildingId],
    enabled: !!currentBuildingId,
    queryFn: async () => {
      if (!currentBuildingId) return [];
      const { data, error } = await supabase
        .from('cameras')
        .select('*')
        .eq('building_id', currentBuildingId)
        .order('name');
      if (error) throw error;
      return data as Camera[];
    },
  });
};

export const useCreateCamera = () => {
  const queryClient = useQueryClient();
  const { currentBuildingId } = useBuilding();

  return useMutation({
    mutationFn: async (camera: Omit<Camera, 'id' | 'created_at' | 'updated_at'>) => {
      if (!currentBuildingId) throw new Error('No building selected');
      const { data, error } = await supabase
        .from('cameras')
        .insert({ ...camera, building_id: currentBuildingId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
      toast({ title: 'Camera added / ক্যামেরা যুক্ত হয়েছে' });
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
      toast({ title: 'Camera updated / ক্যামেরা আপডেট হয়েছে' });
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
      toast({ title: 'Camera deleted / ক্যামেরা মুছে ফেলা হয়েছে' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};
