import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Invoice {
  id: string;
  flat_id: string;
  month: string;
  year: number;
  amount: number;
  due_date: string;
  status: 'paid' | 'unpaid' | 'overdue';
  paid_date: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export const useInvoices = () => {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, flats(flat_number)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('invoices')
        .insert(invoice)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: 'Invoice created / বিল তৈরি হয়েছে' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Invoice> & { id: string }) => {
      const { data, error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: 'Invoice updated / বিল আপডেট হয়েছে' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

export const useGenerateBulkInvoices = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ month, year, amount, description }: { month: string; year: number; amount: number; description: string }) => {
      // Get all flats
      const { data: flats, error: flatsError } = await supabase
        .from('flats')
        .select('id')
        .neq('status', 'vacant');
      
      if (flatsError) throw flatsError;
      
      const dueDate = new Date(year, ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].indexOf(month) + 1, 10);
      
      const invoices = flats.map(flat => ({
        flat_id: flat.id,
        month,
        year,
        amount,
        due_date: dueDate.toISOString().split('T')[0],
        status: 'unpaid' as const,
        description,
      }));
      
      const { error } = await supabase.from('invoices').insert(invoices);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: 'Invoices generated / সকল ফ্ল্যাটের বিল তৈরি হয়েছে' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};
