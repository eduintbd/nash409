import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBuilding } from '@/contexts/BuildingContext';

export type GeneratorRunReason =
  | 'load_shedding'
  | 'scheduled_test'
  | 'maintenance'
  | 'outage'
  | 'other';

export interface GeneratorRun {
  id: string;
  building_id: string;
  started_at: string;
  ended_at: string;
  fuel_liters: number;
  fuel_price_per_liter: number;
  reason: GeneratorRunReason;
  notes: string | null;
  logged_by: string | null;
  is_allocated: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateGeneratorRunInput {
  started_at: string;
  ended_at: string;
  fuel_liters: number;
  fuel_price_per_liter: number;
  reason: GeneratorRunReason;
  notes?: string | null;
}

export const useGeneratorRuns = () => {
  const { currentBuildingId } = useBuilding();
  return useQuery({
    queryKey: ['generator_runs', currentBuildingId],
    enabled: !!currentBuildingId,
    queryFn: async () => {
      if (!currentBuildingId) return [];
      const { data, error } = await supabase
        .from('generator_runs')
        .select('*')
        .eq('building_id', currentBuildingId)
        .order('started_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        ...r,
        fuel_liters: Number(r.fuel_liters),
        fuel_price_per_liter: Number(r.fuel_price_per_liter),
      })) as GeneratorRun[];
    },
  });
};

export const useCreateGeneratorRun = () => {
  const queryClient = useQueryClient();
  const { currentBuildingId } = useBuilding();

  return useMutation({
    mutationFn: async (input: CreateGeneratorRunInput) => {
      if (!currentBuildingId) throw new Error('No building selected');
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('generator_runs')
        .insert({
          ...input,
          building_id: currentBuildingId,
          logged_by: user.user?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generator_runs'] });
    },
  });
};

export const useDeleteGeneratorRun = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('generator_runs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generator_runs'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
};

export const useAllocateGeneratorRun = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      runId,
      method,
      dueDate,
    }: {
      runId: string;
      method: 'equal' | 'size_weighted';
      dueDate?: string;
    }) => {
      const { data, error } = await supabase.rpc('allocate_generator_run', {
        _run_id: runId,
        _method: method,
        _due_date: dueDate ?? undefined,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generator_runs'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['flat-ledger'] });
    },
  });
};

export interface GeneratorRunAllocation {
  id: string;
  generator_run_id: string;
  flat_id: string;
  share_amount: number;
  invoice_id: string | null;
  created_at: string;
  flats?: { flat_number: string } | null;
}

export const useGeneratorRunAllocations = (runId?: string) => {
  return useQuery({
    queryKey: ['generator_run_allocations', runId],
    enabled: !!runId,
    queryFn: async () => {
      if (!runId) return [];
      const { data, error } = await supabase
        .from('generator_run_allocations')
        .select('*, flats:flat_id(flat_number)')
        .eq('generator_run_id', runId)
        .order('share_amount', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((a) => ({
        ...a,
        share_amount: Number(a.share_amount),
      })) as GeneratorRunAllocation[];
    },
  });
};
