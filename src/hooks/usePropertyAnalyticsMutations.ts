import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBuilding } from '@/contexts/BuildingContext';

export interface UpdatePropertyInput {
  existingFlatIds: string[];
  existingFlatNumbers: string[];
  existingBuildingName: string;
  newBuildingName: string;
  currentTotalUnits: number;
  newTotalUnits: number;
}

export const useUpdateProperty = () => {
  const queryClient = useQueryClient();
  const { currentBuildingId } = useBuilding();

  return useMutation({
    mutationFn: async (input: UpdatePropertyInput) => {
      if (!currentBuildingId) throw new Error('No building selected');
      const {
        existingFlatIds,
        existingFlatNumbers,
        existingBuildingName,
        newBuildingName,
        currentTotalUnits,
        newTotalUnits,
      } = input;

      const trimmedName = newBuildingName.trim();
      if (!trimmedName) throw new Error('Property name is required');

      const { error: renameError } = await supabase
        .from('flats')
        .update({ building_name: trimmedName })
        .in('id', existingFlatIds);
      if (renameError) throw renameError;

      if (newTotalUnits > currentTotalUnits) {
        const flatsToAdd = newTotalUnits - currentTotalUnits;
        const existingNumbers = existingFlatNumbers.map(
          (n) => parseInt(n.replace(/\D/g, ''), 10) || 0,
        );
        const maxNumber = Math.max(...existingNumbers, 0);

        const newFlats = Array.from({ length: flatsToAdd }, (_, i) => {
          const nextNumber = maxNumber + i + 1;
          return {
            flat_number: `${nextNumber}`,
            building_name: trimmedName,
            building_id: currentBuildingId,
            floor: Math.ceil(nextNumber / 4),
            size: 1200,
            status: 'vacant' as const,
          };
        });

        const { error: insertError } = await supabase.from('flats').insert(newFlats);
        if (insertError) throw insertError;
      }

      if (newTotalUnits < currentTotalUnits) {
        const flatsToRemove = currentTotalUnits - newTotalUnits;
        const { data: vacantFlats, error: vacantError } = await supabase
          .from('flats')
          .select('id')
          .eq('building_name', existingBuildingName)
          .eq('status', 'vacant')
          .limit(flatsToRemove);
        if (vacantError) throw vacantError;

        if (vacantFlats && vacantFlats.length > 0) {
          const { error: deleteError } = await supabase
            .from('flats')
            .delete()
            .in('id', vacantFlats.map((f) => f.id));
          if (deleteError) throw deleteError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flats'] });
    },
  });
};

export const useDeleteProperty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (flatIds: string[]) => {
      const { error } = await supabase.from('flats').delete().in('id', flatIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flats'] });
    },
  });
};
