import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBuilding } from '@/contexts/BuildingContext';

export interface StaffShift {
  id: string;
  building_id: string;
  employee_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  notes: string | null;
  created_at: string;
  employees?: { name: string | null; role: string | null } | null;
}

export interface StaffAttendance {
  id: string;
  building_id: string;
  employee_id: string;
  shift_id: string | null;
  check_in_at: string;
  check_out_at: string | null;
  method: 'gate_qr' | 'manual' | 'whatsapp' | 'app';
  recorded_by: string | null;
  notes: string | null;
  created_at: string;
  employees?: { name: string | null } | null;
}

export interface PayrollPeriod {
  id: string;
  building_id: string;
  month: string;
  year: number;
  status: 'draft' | 'finalized' | 'paid';
  total_amount: number;
  created_by: string | null;
  finalized_at: string | null;
  created_at: string;
}

export interface PayrollEntry {
  id: string;
  payroll_period_id: string;
  employee_id: string;
  base_salary: number;
  bonuses: number;
  deductions: number;
  advance_adjustment: number;
  net_amount: number;
  notes: string | null;
  employees?: { name: string | null; role: string | null } | null;
}

export const useShifts = (params?: { from?: string; to?: string }) => {
  const { currentBuildingId } = useBuilding();
  return useQuery({
    queryKey: ['staff_shifts', currentBuildingId, params?.from, params?.to],
    enabled: !!currentBuildingId,
    queryFn: async () => {
      if (!currentBuildingId) return [];
      let q = supabase
        .from('staff_shifts')
        .select('*, employees:employee_id(name, role)')
        .eq('building_id', currentBuildingId)
        .order('shift_date', { ascending: false })
        .order('start_time', { ascending: true });
      if (params?.from) q = q.gte('shift_date', params.from);
      if (params?.to) q = q.lte('shift_date', params.to);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as StaffShift[];
    },
  });
};

export const useCreateShift = () => {
  const queryClient = useQueryClient();
  const { currentBuildingId } = useBuilding();
  return useMutation({
    mutationFn: async (input: Omit<StaffShift, 'id' | 'created_at' | 'building_id' | 'employees'>) => {
      if (!currentBuildingId) throw new Error('No building selected');
      const { data, error } = await supabase
        .from('staff_shifts')
        .insert({ ...input, building_id: currentBuildingId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff_shifts'] }),
  });
};

export const useDeleteShift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('staff_shifts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff_shifts'] }),
  });
};

export const useRecentAttendance = (limit = 50) => {
  const { currentBuildingId } = useBuilding();
  return useQuery({
    queryKey: ['staff_attendance', currentBuildingId, limit],
    enabled: !!currentBuildingId,
    queryFn: async () => {
      if (!currentBuildingId) return [];
      const { data, error } = await supabase
        .from('staff_attendance')
        .select('*, employees:employee_id(name)')
        .eq('building_id', currentBuildingId)
        .order('check_in_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as StaffAttendance[];
    },
  });
};

export const useRecordCheckIn = () => {
  const queryClient = useQueryClient();
  const { currentBuildingId } = useBuilding();
  return useMutation({
    mutationFn: async ({
      employee_id,
      shift_id,
      method = 'manual',
      notes,
    }: {
      employee_id: string;
      shift_id?: string | null;
      method?: 'gate_qr' | 'manual' | 'whatsapp' | 'app';
      notes?: string;
    }) => {
      if (!currentBuildingId) throw new Error('No building selected');
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('staff_attendance')
        .insert({
          building_id: currentBuildingId,
          employee_id,
          shift_id: shift_id ?? null,
          method,
          notes: notes ?? null,
          recorded_by: user.user?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff_attendance'] }),
  });
};

export const useRecordCheckOut = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (attendanceId: string) => {
      const { data, error } = await supabase
        .from('staff_attendance')
        .update({ check_out_at: new Date().toISOString() })
        .eq('id', attendanceId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff_attendance'] }),
  });
};

export const usePayrollPeriods = () => {
  const { currentBuildingId } = useBuilding();
  return useQuery({
    queryKey: ['payroll_periods', currentBuildingId],
    enabled: !!currentBuildingId,
    queryFn: async () => {
      if (!currentBuildingId) return [];
      const { data, error } = await supabase
        .from('payroll_periods')
        .select('*')
        .eq('building_id', currentBuildingId)
        .order('year', { ascending: false })
        .order('month', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((p) => ({ ...p, total_amount: Number(p.total_amount) })) as PayrollPeriod[];
    },
  });
};

export const usePayrollEntries = (periodId?: string) => {
  return useQuery({
    queryKey: ['payroll_entries', periodId],
    enabled: !!periodId,
    queryFn: async () => {
      if (!periodId) return [];
      const { data, error } = await supabase
        .from('payroll_entries')
        .select('*, employees:employee_id(name, role)')
        .eq('payroll_period_id', periodId);
      if (error) throw error;
      return (data ?? []).map((e) => ({
        ...e,
        base_salary: Number(e.base_salary),
        bonuses: Number(e.bonuses),
        deductions: Number(e.deductions),
        advance_adjustment: Number(e.advance_adjustment),
        net_amount: Number(e.net_amount),
      })) as PayrollEntry[];
    },
  });
};

export const useGeneratePayrollPeriod = () => {
  const queryClient = useQueryClient();
  const { currentBuildingId } = useBuilding();
  return useMutation({
    mutationFn: async ({ month, year }: { month: string; year: number }) => {
      if (!currentBuildingId) throw new Error('No building selected');
      const { data, error } = await supabase.rpc('generate_payroll_period', {
        _building_id: currentBuildingId,
        _month: month,
        _year: year,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll_periods'] });
      queryClient.invalidateQueries({ queryKey: ['payroll_entries'] });
    },
  });
};

export const useUpdatePayrollEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      bonuses,
      deductions,
      advance_adjustment,
      notes,
    }: {
      id: string;
      bonuses?: number;
      deductions?: number;
      advance_adjustment?: number;
      notes?: string | null;
    }) => {
      // Recompute net in the same update via a round-trip read.
      const { data: current } = await supabase
        .from('payroll_entries')
        .select('base_salary, bonuses, deductions, advance_adjustment, notes')
        .eq('id', id)
        .single();
      const base = Number(current?.base_salary ?? 0);
      const b = bonuses ?? Number(current?.bonuses ?? 0);
      const d = deductions ?? Number(current?.deductions ?? 0);
      const a = advance_adjustment ?? Number(current?.advance_adjustment ?? 0);

      const { data, error } = await supabase
        .from('payroll_entries')
        .update({
          bonuses: b,
          deductions: d,
          advance_adjustment: a,
          notes: notes ?? current?.notes ?? null,
          net_amount: base + b - d - a,
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll_entries'] });
    },
  });
};

export const useFinalizePayrollPeriod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (periodId: string) => {
      const { data: entries } = await supabase
        .from('payroll_entries')
        .select('net_amount')
        .eq('payroll_period_id', periodId);
      const total = (entries ?? []).reduce((s, e) => s + Number(e.net_amount), 0);
      const { error } = await supabase
        .from('payroll_periods')
        .update({
          status: 'finalized',
          finalized_at: new Date().toISOString(),
          total_amount: total,
        })
        .eq('id', periodId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll_periods'] });
    },
  });
};
