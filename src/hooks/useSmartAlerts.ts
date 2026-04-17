import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useBuilding } from '@/contexts/BuildingContext';

export interface SmartAlert {
  id: string;
  flat_id: string | null;
  alert_type: 'high_consumption' | 'leak_detection' | 'anomaly' | 'maintenance_due';
  utility_type: 'electricity' | 'water' | 'gas' | 'hvac' | null;
  title: string;
  description: string | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  is_resolved: boolean;
  resolved_at: string | null;
  created_at: string;
}

export const useSmartAlerts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentBuildingId } = useBuilding();

  const { data: alerts = [], isLoading, error } = useQuery({
    queryKey: ['smart_alerts', currentBuildingId],
    enabled: !!currentBuildingId,
    queryFn: async () => {
      if (!currentBuildingId) return [];
      const { data, error } = await supabase
        .from('smart_alerts')
        .select('*')
        .eq('building_id', currentBuildingId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SmartAlert[];
    },
  });

  const resolveAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { data, error } = await supabase
        .from('smart_alerts')
        .update({ is_resolved: true, resolved_at: new Date().toISOString() })
        .eq('id', alertId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart_alerts'] });
      toast({ title: 'Alert resolved' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error resolving alert', description: error.message, variant: 'destructive' });
    },
  });

  const addAlert = useMutation({
    mutationFn: async (alert: Omit<SmartAlert, 'id' | 'created_at' | 'resolved_at' | 'is_resolved'>) => {
      if (!currentBuildingId) throw new Error('No building selected');
      const { data, error } = await supabase
        .from('smart_alerts')
        .insert([{ ...alert, building_id: currentBuildingId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart_alerts'] });
    },
  });

  return { alerts, isLoading, error, resolveAlert, addAlert };
};
