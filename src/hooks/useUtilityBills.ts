import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UtilityBill {
  id: string;
  flat_id: string;
  bill_type: string;
  bill_month: string;
  bill_year: number;
  amount: number;
  file_path: string;
  file_size: number | null;
  paid_by: string;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
  flats?: {
    flat_number: string;
    building_name: string | null;
  };
}

export const useUtilityBills = (flatId?: string) => {
  return useQuery({
    queryKey: ['utility-bills', flatId],
    queryFn: async () => {
      let query = supabase
        .from('utility_bills')
        .select('*, flats(flat_number, building_name)')
        .order('bill_year', { ascending: false })
        .order('bill_month', { ascending: false });
      
      if (flatId) {
        query = query.eq('flat_id', flatId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as UtilityBill[];
    },
  });
};

export const useUploadUtilityBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      flatId,
      billType,
      billMonth,
      billYear,
      amount,
      paidBy,
    }: {
      file: File;
      flatId: string;
      billType: string;
      billMonth: string;
      billYear: number;
      amount: number;
      paidBy: string;
    }) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${flatId}/${billYear}-${billMonth}-${billType}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('utility-bills')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get user
      const { data: { user } } = await supabase.auth.getUser();

      // Save metadata
      const { data, error } = await supabase
        .from('utility_bills')
        .insert({
          flat_id: flatId,
          bill_type: billType,
          bill_month: billMonth,
          bill_year: billYear,
          amount,
          file_path: fileName,
          file_size: file.size,
          paid_by: paidBy,
          uploaded_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utility-bills'] });
      toast.success('Utility bill uploaded successfully');
    },
    onError: (error) => {
      toast.error('Failed to upload utility bill');
      console.error(error);
    },
  });
};

export const useDeleteUtilityBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, filePath }: { id: string; filePath: string }) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('utility-bills')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete metadata
      const { error } = await supabase
        .from('utility_bills')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utility-bills'] });
      toast.success('Utility bill deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete utility bill');
      console.error(error);
    },
  });
};

export const getUtilityBillUrl = async (filePath: string) => {
  const { data } = await supabase.storage
    .from('utility-bills')
    .createSignedUrl(filePath, 3600);
  return data?.signedUrl;
};
