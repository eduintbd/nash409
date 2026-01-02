import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TemperatureReading {
  id: string;
  flat_id: string | null;
  location: string;
  temperature: number;
  humidity: number | null;
  hvac_mode: 'cooling' | 'heating' | 'auto' | 'off';
  target_temperature: number | null;
  reading_time: string;
  created_at: string;
}

export const useTemperatureReadings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: readings = [], isLoading, error } = useQuery({
    queryKey: ['temperature_readings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('temperature_readings')
        .select('*')
        .order('reading_time', { ascending: false });
      
      if (error) throw error;
      return data as TemperatureReading[];
    },
  });

  const addReading = useMutation({
    mutationFn: async (reading: Omit<TemperatureReading, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('temperature_readings')
        .insert([reading])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['temperature_readings'] });
    },
  });

  const updateHvacMode = useMutation({
    mutationFn: async ({ location, hvac_mode, target_temperature }: { location: string; hvac_mode: string; target_temperature?: number }) => {
      const { data, error } = await supabase
        .from('temperature_readings')
        .insert([{
          location,
          hvac_mode,
          target_temperature: target_temperature || 24,
          temperature: 25, // Current reading
          humidity: 60,
          reading_time: new Date().toISOString(),
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['temperature_readings'] });
      toast({ title: 'HVAC settings updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating HVAC', description: error.message, variant: 'destructive' });
    },
  });

  return { readings, isLoading, error, addReading, updateHvacMode };
};
