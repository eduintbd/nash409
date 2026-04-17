import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useBuilding } from '@/contexts/BuildingContext';

export interface UtilityReading {
  id: string;
  flat_id: string | null;
  utility_type: 'electricity' | 'water' | 'gas';
  reading_value: number;
  unit: string;
  cost_per_unit: number;
  reading_date: string;
  is_building_wide: boolean;
  created_at: string;
}

export const useUtilityReadings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentBuildingId } = useBuilding();

  const { data: readings = [], isLoading, error } = useQuery({
    queryKey: ['utility_readings', currentBuildingId],
    enabled: !!currentBuildingId,
    queryFn: async () => {
      if (!currentBuildingId) return [];
      const { data, error } = await supabase
        .from('utility_readings')
        .select('*')
        .eq('building_id', currentBuildingId)
        .order('reading_date', { ascending: false });

      if (error) throw error;
      return data as UtilityReading[];
    },
  });

  const addReading = useMutation({
    mutationFn: async (reading: Omit<UtilityReading, 'id' | 'created_at'>) => {
      if (!currentBuildingId) throw new Error('No building selected');
      const { data, error } = await supabase
        .from('utility_readings')
        .insert([{ ...reading, building_id: currentBuildingId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utility_readings'] });
      toast({ title: 'Reading added successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error adding reading', description: error.message, variant: 'destructive' });
    },
  });

  return { readings, isLoading, error, addReading };
};
