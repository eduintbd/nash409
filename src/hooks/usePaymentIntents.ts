import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBuilding } from '@/contexts/BuildingContext';

export type PaymentMethod = 'bkash' | 'nagad' | 'rocket' | 'bank' | 'cash' | 'cheque' | 'other';
export type PaymentIntentStatus = 'pending' | 'approved' | 'rejected';

export interface PaymentIntent {
  id: string;
  building_id: string;
  invoice_id: string;
  submitted_by: string | null;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  payer_phone: string | null;
  notes: string | null;
  status: PaymentIntentStatus;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  invoices?: {
    flat_id: string;
    month: string;
    year: number;
    amount: number;
    flats?: { flat_number: string | null } | null;
  } | null;
}

export const usePaymentIntents = (status?: PaymentIntentStatus) => {
  const { currentBuildingId } = useBuilding();
  return useQuery({
    queryKey: ['payment_intents', currentBuildingId, status ?? 'all'],
    enabled: !!currentBuildingId,
    queryFn: async () => {
      if (!currentBuildingId) return [];
      let q = supabase
        .from('payment_intents')
        .select(
          'id, building_id, invoice_id, submitted_by, amount, method, reference, payer_phone, notes, status, approved_by, approved_at, rejection_reason, created_at, invoices:invoice_id(flat_id, month, year, amount, flats:flat_id(flat_number))',
        )
        .eq('building_id', currentBuildingId)
        .order('created_at', { ascending: false });
      if (status) q = q.eq('status', status);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((r) => ({
        ...r,
        amount: Number(r.amount),
      })) as PaymentIntent[];
    },
  });
};

export interface SubmitPaymentIntentInput {
  invoice_id: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  payer_phone?: string;
  notes?: string;
}

export const useSubmitPaymentIntent = () => {
  const queryClient = useQueryClient();
  const { currentBuildingId } = useBuilding();

  return useMutation({
    mutationFn: async (input: SubmitPaymentIntentInput) => {
      if (!currentBuildingId) throw new Error('No building selected');
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('payment_intents')
        .insert({
          building_id: currentBuildingId,
          invoice_id: input.invoice_id,
          amount: input.amount,
          method: input.method,
          reference: input.reference || null,
          payer_phone: input.payer_phone || null,
          notes: input.notes || null,
          submitted_by: user.user?.id ?? null,
          status: 'pending' as const,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment_intents'] });
    },
  });
};

export const useApprovePaymentIntent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (intentId: string) => {
      const { data, error } = await supabase.rpc('approve_payment_intent', {
        _intent_id: intentId,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment_intents'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['flat-ledger'] });
    },
  });
};

export const useRejectPaymentIntent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ intentId, reason }: { intentId: string; reason: string }) => {
      const { error } = await supabase.rpc('reject_payment_intent', {
        _intent_id: intentId,
        _reason: reason,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment_intents'] });
    },
  });
};
