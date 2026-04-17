import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBuilding } from '@/contexts/BuildingContext';
import type { Database } from '@/integrations/supabase/types';

type BuildingRole = Database['public']['Enums']['building_role'];

export const useRequestBuildingMembership = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ joinCode, role }: { joinCode: string; role: BuildingRole }) => {
      const { data, error } = await supabase.rpc('request_building_membership', {
        _join_code: joinCode,
        _role: role,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['building_members'] });
    },
  });
};

export const useLookupBuildingByCode = () => {
  return useMutation({
    mutationFn: async (joinCode: string) => {
      const { data, error } = await supabase.rpc('lookup_building_by_code', {
        _join_code: joinCode,
      });
      if (error) throw error;
      return (data ?? [])[0] as
        | { id: string; name: string; address: string | null }
        | undefined;
    },
  });
};

export interface PendingMembership {
  id: string;
  user_id: string;
  role: BuildingRole;
  flat_id: string | null;
  is_approved: boolean;
  is_primary: boolean;
  created_at: string;
  profiles?: { full_name: string | null; email: string | null } | null;
}

export const usePendingBuildingMembers = () => {
  const { currentBuildingId } = useBuilding();
  return useQuery({
    queryKey: ['pending_building_members', currentBuildingId],
    enabled: !!currentBuildingId,
    queryFn: async () => {
      if (!currentBuildingId) return [];
      const { data: members, error: mErr } = await supabase
        .from('building_members')
        .select('id, user_id, role, flat_id, is_approved, is_primary, created_at')
        .eq('building_id', currentBuildingId)
        .eq('is_approved', false)
        .order('created_at', { ascending: false });
      if (mErr) throw mErr;
      if (!members || members.length === 0) return [];

      const userIds = Array.from(new Set(members.map((m) => m.user_id)));
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
      return members.map((m) => ({
        ...m,
        profiles: profileMap.get(m.user_id) ?? null,
      })) as PendingMembership[];
    },
  });
};

export const useApproveMembership = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, flatId }: { id: string; flatId?: string | null }) => {
      const { data: userRes } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('building_members')
        .update({
          is_approved: true,
          flat_id: flatId ?? null,
          approved_by: userRes.user?.id ?? null,
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending_building_members'] });
      queryClient.invalidateQueries({ queryKey: ['building_members'] });
    },
  });
};

export const useRejectMembership = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('building_members').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending_building_members'] });
    },
  });
};

export const useCurrentBuildingDetails = () => {
  const { currentBuildingId } = useBuilding();
  return useQuery({
    queryKey: ['building-details', currentBuildingId],
    enabled: !!currentBuildingId,
    queryFn: async () => {
      if (!currentBuildingId) return null;
      const { data, error } = await supabase
        .from('buildings')
        .select('id, name, address, join_code')
        .eq('id', currentBuildingId)
        .single();
      if (error) throw error;
      return data;
    },
  });
};
