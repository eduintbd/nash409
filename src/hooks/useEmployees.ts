import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useBuilding } from '@/contexts/BuildingContext';

export interface Employee {
  id: string;
  name: string;
  role: 'guard' | 'cleaner' | 'caretaker' | 'other';
  phone: string;
  nid: string | null;
  salary: number;
  shift: string | null;
  join_date: string;
  created_at: string;
  updated_at: string;
}

export const useEmployees = () => {
  const { currentBuildingId } = useBuilding();
  return useQuery({
    queryKey: ['employees', currentBuildingId],
    enabled: !!currentBuildingId,
    queryFn: async () => {
      if (!currentBuildingId) return [];
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('building_id', currentBuildingId)
        .order('name');
      if (error) throw error;
      return data as Employee[];
    },
  });
};

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();
  const { currentBuildingId } = useBuilding();

  return useMutation({
    mutationFn: async (employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) => {
      if (!currentBuildingId) throw new Error('No building selected');
      const { data, error } = await supabase
        .from('employees')
        .insert({ ...employee, building_id: currentBuildingId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({ title: 'Employee added / কর্মচারী যুক্ত হয়েছে' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Employee> & { id: string }) => {
      const { data, error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({ title: 'Employee updated / কর্মচারী আপডেট হয়েছে' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({ title: 'Employee deleted / কর্মচারী মুছে ফেলা হয়েছে' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};
