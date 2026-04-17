import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useBuilding } from '@/contexts/BuildingContext';

export interface ServiceRequest {
  id: string;
  ticket_number: number;
  flat_id: string;
  title: string;
  category: 'plumbing' | 'electrical' | 'elevator' | 'common-area' | 'other';
  description: string | null;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to: string | null;
  cost: number | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  invoice_id: string | null;
  created_at: string;
  updated_at: string;
}

export const useServiceRequests = () => {
  const { currentBuildingId } = useBuilding();
  return useQuery({
    queryKey: ['service_requests', currentBuildingId],
    enabled: !!currentBuildingId,
    queryFn: async () => {
      if (!currentBuildingId) return [];
      const { data, error } = await supabase
        .from('service_requests')
        .select('*, flats(flat_number), employees(name)')
        .eq('building_id', currentBuildingId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateServiceRequest = () => {
  const queryClient = useQueryClient();
  const { currentBuildingId } = useBuilding();

  return useMutation({
    mutationFn: async (request: Omit<ServiceRequest, 'id' | 'created_at' | 'updated_at' | 'ticket_number' | 'resolution_notes' | 'invoice_id'>) => {
      if (!currentBuildingId) throw new Error('No building selected');
      const { data, error } = await supabase
        .from('service_requests')
        .insert({ ...request, building_id: currentBuildingId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_requests'] });
      toast({ title: 'Request added / অনুরোধ যুক্ত হয়েছে' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

export const useUpdateServiceRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ServiceRequest> & { id: string }) => {
      const { data, error } = await supabase
        .from('service_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_requests'] });
      toast({ title: 'Request updated / অনুরোধ আপডেট হয়েছে' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

export const useDeleteServiceRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('service_requests').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_requests'] });
      toast({ title: 'Request deleted / অনুরোধ মুছে ফেলা হয়েছে' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};
