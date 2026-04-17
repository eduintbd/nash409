import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBuilding } from '@/contexts/BuildingContext';

export type ComplianceDocumentType =
  | 'rajuk_approval'
  | 'occupancy_cert'
  | 'fire_noc'
  | 'lift_safety'
  | 'extinguisher'
  | 'earthquake_drill'
  | 'boiler'
  | 'lightning_arrester'
  | 'electrical_safety'
  | 'other';

export interface ComplianceDocument {
  id: string;
  building_id: string;
  document_type: ComplianceDocumentType;
  title: string;
  issuing_authority: string | null;
  reference_number: string | null;
  issued_on: string | null;
  expires_on: string | null;
  file_path: string | null;
  notes: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export type ExpiryStatus = 'expired' | 'expiring_soon' | 'valid' | 'no_expiry';

export const getExpiryStatus = (expiresOn: string | null, days = 30): ExpiryStatus => {
  if (!expiresOn) return 'no_expiry';
  const expiry = new Date(expiresOn);
  if (Number.isNaN(expiry.getTime())) return 'no_expiry';
  const now = Date.now();
  const diffDays = (expiry.getTime() - now) / 86_400_000;
  if (diffDays < 0) return 'expired';
  if (diffDays <= days) return 'expiring_soon';
  return 'valid';
};

export const useComplianceDocuments = () => {
  const { currentBuildingId } = useBuilding();
  return useQuery({
    queryKey: ['compliance_documents', currentBuildingId],
    enabled: !!currentBuildingId,
    queryFn: async () => {
      if (!currentBuildingId) return [];
      const { data, error } = await supabase
        .from('compliance_documents')
        .select('*')
        .eq('building_id', currentBuildingId)
        .order('expires_on', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as ComplianceDocument[];
    },
  });
};

export interface CreateComplianceDocumentInput {
  document_type: ComplianceDocumentType;
  title: string;
  issuing_authority?: string;
  reference_number?: string;
  issued_on?: string;
  expires_on?: string;
  notes?: string;
}

export const useCreateComplianceDocument = () => {
  const queryClient = useQueryClient();
  const { currentBuildingId } = useBuilding();

  return useMutation({
    mutationFn: async (input: CreateComplianceDocumentInput) => {
      if (!currentBuildingId) throw new Error('No building selected');
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('compliance_documents')
        .insert({
          building_id: currentBuildingId,
          document_type: input.document_type,
          title: input.title,
          issuing_authority: input.issuing_authority || null,
          reference_number: input.reference_number || null,
          issued_on: input.issued_on || null,
          expires_on: input.expires_on || null,
          notes: input.notes || null,
          uploaded_by: user.user?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance_documents'] });
    },
  });
};

export const useDeleteComplianceDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('compliance_documents').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance_documents'] });
    },
  });
};
