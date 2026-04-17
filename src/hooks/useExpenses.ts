import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useBuilding } from '@/contexts/BuildingContext';

export interface Expense {
  id: string;
  category_id: string | null;
  description: string;
  amount: number;
  date: string;
  vendor: string | null;
  payment_method: 'cash' | 'bank' | 'bkash' | 'nagad' | 'rocket' | 'cheque';
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  created_at: string;
}

export const useExpenses = () => {
  const { currentBuildingId } = useBuilding();
  return useQuery({
    queryKey: ['expenses', currentBuildingId],
    enabled: !!currentBuildingId,
    queryFn: async () => {
      if (!currentBuildingId) return [];
      const { data, error } = await supabase
        .from('expenses')
        .select('*, expense_categories(name)')
        .eq('building_id', currentBuildingId)
        .order('date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useExpenseCategories = () => {
  const { currentBuildingId } = useBuilding();
  return useQuery({
    queryKey: ['expense_categories', currentBuildingId],
    enabled: !!currentBuildingId,
    queryFn: async () => {
      if (!currentBuildingId) return [];
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('building_id', currentBuildingId)
        .order('name');
      if (error) throw error;
      return data as ExpenseCategory[];
    },
  });
};

export const useCreateExpense = () => {
  const queryClient = useQueryClient();
  const { currentBuildingId } = useBuilding();

  return useMutation({
    mutationFn: async (expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) => {
      if (!currentBuildingId) throw new Error('No building selected');
      const { data, error } = await supabase
        .from('expenses')
        .insert({ ...expense, building_id: currentBuildingId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: 'Expense added / খরচ যুক্ত হয়েছে' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Expense> & { id: string }) => {
      const { data, error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: 'Expense updated / খরচ আপডেট হয়েছে' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: 'Expense deleted / খরচ মুছে ফেলা হয়েছে' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};
