import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SendTenantAgreementInput {
  tenantId: string;
  tenantEmail: string;
  tenantName: string;
  flatNumber: string;
  ownerName: string;
  rentAmount: number;
  securityDeposit: number;
  houseRules: string;
  maintenanceResponsibilities: string;
  startDate: string;
  endDate: string | null;
  agreementToken: string;
}

export const useSendTenantAgreement = () => {
  return useMutation({
    mutationFn: async (input: SendTenantAgreementInput) => {
      const { data, error } = await supabase.functions.invoke('send-tenant-agreement', {
        body: input,
      });
      if (error) throw error;
      return data;
    },
  });
};

export const useFetchAgreementToken = () => {
  return useMutation({
    mutationFn: async (tenantId: string) => {
      const { data, error } = await supabase
        .from('tenants')
        .select('agreement_token')
        .eq('id', tenantId)
        .single();
      if (error) throw error;
      return data?.agreement_token as string | null;
    },
  });
};
