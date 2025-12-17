-- Add display_order column to flats table for reordering
ALTER TABLE public.flats ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

-- Update existing flats with sequential order based on building and flat number
WITH ordered_flats AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY building_name, flat_number) as new_order
  FROM public.flats
)
UPDATE public.flats f
SET display_order = of.new_order
FROM ordered_flats of
WHERE f.id = of.id;