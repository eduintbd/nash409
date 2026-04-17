import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { safeStorage } from '@/lib/safeStorage';
import { useAuth, type BuildingRole } from '@/contexts/AuthContext';

const STORAGE_KEY = 'nash.currentBuildingId';

export interface BuildingSummary {
  id: string;
  name: string;
  address: string | null;
  orgId: string;
}

interface BuildingContextValue {
  currentBuildingId: string | null;
  currentBuilding: BuildingSummary | null;
  currentRoles: BuildingRole[];
  availableBuildings: BuildingSummary[];
  isLoading: boolean;
  setCurrentBuildingId: (id: string) => void;
}

const BuildingContext = createContext<BuildingContextValue | undefined>(undefined);

export const BuildingProvider = ({ children }: { children: ReactNode }) => {
  const { user, buildingMemberships, isAdmin } = useAuth();
  const [currentBuildingId, setCurrentBuildingIdState] = useState<string | null>(() =>
    safeStorage.getItem(STORAGE_KEY),
  );

  const memberBuildingIds = useMemo(
    () =>
      Array.from(
        new Set(
          buildingMemberships.filter((m) => m.isApproved).map((m) => m.buildingId),
        ),
      ),
    [buildingMemberships],
  );

  // Admins (global superadmin) can see every building; regular users only their memberships.
  const { data: availableBuildings = [], isLoading } = useQuery({
    queryKey: ['buildings', user?.id, isAdmin, memberBuildingIds],
    enabled: !!user,
    queryFn: async (): Promise<BuildingSummary[]> => {
      let query = supabase
        .from('buildings')
        .select('id, name, address, org_id')
        .order('name');

      if (!isAdmin && memberBuildingIds.length > 0) {
        query = query.in('id', memberBuildingIds);
      } else if (!isAdmin) {
        return [];
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map((b) => ({
        id: b.id,
        name: b.name,
        address: b.address,
        orgId: b.org_id,
      }));
    },
  });

  // Reconcile selection against available buildings when the list changes.
  useEffect(() => {
    if (availableBuildings.length === 0) return;
    const stillValid =
      currentBuildingId && availableBuildings.some((b) => b.id === currentBuildingId);
    if (!stillValid) {
      const fallback =
        buildingMemberships.find((m) => m.isPrimary && m.isApproved)?.buildingId ??
        availableBuildings[0]?.id ??
        null;
      if (fallback) {
        setCurrentBuildingIdState(fallback);
        safeStorage.setItem(STORAGE_KEY, fallback);
      }
    }
  }, [availableBuildings, currentBuildingId, buildingMemberships]);

  const setCurrentBuildingId = (id: string) => {
    setCurrentBuildingIdState(id);
    safeStorage.setItem(STORAGE_KEY, id);
  };

  const currentBuilding = useMemo(
    () => availableBuildings.find((b) => b.id === currentBuildingId) ?? null,
    [availableBuildings, currentBuildingId],
  );

  const currentRoles = useMemo<BuildingRole[]>(
    () =>
      buildingMemberships
        .filter((m) => m.buildingId === currentBuildingId && m.isApproved)
        .map((m) => m.role),
    [buildingMemberships, currentBuildingId],
  );

  const value: BuildingContextValue = {
    currentBuildingId,
    currentBuilding,
    currentRoles,
    availableBuildings,
    isLoading,
    setCurrentBuildingId,
  };

  return <BuildingContext.Provider value={value}>{children}</BuildingContext.Provider>;
};

export const useBuilding = (): BuildingContextValue => {
  const ctx = useContext(BuildingContext);
  if (!ctx) {
    throw new Error('useBuilding must be used within a BuildingProvider');
  }
  return ctx;
};

export const useHasBuildingRole = (role: BuildingRole) => {
  const { currentRoles } = useBuilding();
  return currentRoles.includes(role);
};
