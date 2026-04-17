import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { useBuilding } from '@/contexts/BuildingContext';

interface PropertyDocument {
  id: string;
  building_name: string;
  document_name: string;
  document_type: string;
  file_path: string;
  file_size: number | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export const usePropertyDocuments = (buildingName?: string) => {
  const { currentBuildingId } = useBuilding();
  return useQuery({
    queryKey: ['property-documents', currentBuildingId, buildingName],
    enabled: !!currentBuildingId,
    queryFn: async () => {
      if (!currentBuildingId) return [];
      let query = supabase
        .from('property_documents')
        .select('*')
        .eq('building_id', currentBuildingId)
        .order('created_at', { ascending: false });

      if (buildingName) {
        query = query.eq('building_name', buildingName);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PropertyDocument[];
    },
  });
};

export const useUploadPropertyDocument = () => {
  const queryClient = useQueryClient();
  const { currentBuildingId } = useBuilding();

  return useMutation({
    mutationFn: async ({
      file,
      buildingName,
      documentName,
      documentType,
    }: {
      file: File;
      buildingName: string;
      documentName: string;
      documentType: string;
    }) => {
      if (!currentBuildingId) throw new Error('No building selected');
      const fileExt = file.name.split('.').pop();
      const fileName = `${buildingName}/${Date.now()}-${documentName}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('property-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get user
      const { data: { user } } = await supabase.auth.getUser();

      // Save metadata
      const { data, error } = await supabase
        .from('property_documents')
        .insert({
          building_name: buildingName,
          building_id: currentBuildingId,
          document_name: documentName,
          document_type: documentType,
          file_path: fileName,
          file_size: file.size,
          uploaded_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-documents'] });
      toast.success('Document uploaded successfully');
    },
    onError: (error) => {
      toast.error('Failed to upload document');
      logger.error(error);
    },
  });
};

export const useDeletePropertyDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, filePath }: { id: string; filePath: string }) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('property-documents')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete metadata
      const { error } = await supabase
        .from('property_documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-documents'] });
      toast.success('Document deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete document');
      logger.error(error);
    },
  });
};

export const getPropertyDocumentUrl = async (filePath: string) => {
  const { data } = await supabase.storage
    .from('property-documents')
    .createSignedUrl(filePath, 3600); // 1 hour expiry
  return data?.signedUrl;
};
