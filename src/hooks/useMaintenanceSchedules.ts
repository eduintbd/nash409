import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MaintenanceSchedule {
  id: string;
  equipment_name: string;
  equipment_type: 'hvac' | 'elevator' | 'generator' | 'water_pump' | 'electrical' | 'plumbing' | 'other';
  location: string | null;
  last_maintenance_date: string | null;
  next_maintenance_date: string;
  frequency_days: number;
  assigned_to: string | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useMaintenanceSchedules = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: schedules = [], isLoading, error } = useQuery({
    queryKey: ['maintenance_schedules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_schedules')
        .select('*')
        .order('next_maintenance_date', { ascending: true });
      
      if (error) throw error;
      return data as MaintenanceSchedule[];
    },
  });

  const addSchedule = useMutation({
    mutationFn: async (schedule: Omit<MaintenanceSchedule, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('maintenance_schedules')
        .insert([schedule])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance_schedules'] });
      toast({ title: 'Maintenance scheduled successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error scheduling maintenance', description: error.message, variant: 'destructive' });
    },
  });

  const updateSchedule = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MaintenanceSchedule> & { id: string }) => {
      const { data, error } = await supabase
        .from('maintenance_schedules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance_schedules'] });
      toast({ title: 'Schedule updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating schedule', description: error.message, variant: 'destructive' });
    },
  });

  const deleteSchedule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('maintenance_schedules')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance_schedules'] });
      toast({ title: 'Schedule deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting schedule', description: error.message, variant: 'destructive' });
    },
  });

  return { schedules, isLoading, error, addSchedule, updateSchedule, deleteSchedule };
};
