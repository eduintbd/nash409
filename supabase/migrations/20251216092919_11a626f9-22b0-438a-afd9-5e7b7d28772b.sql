-- Create junction table for owner-flat relationships (one owner, many flats)
CREATE TABLE public.owner_flats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.owners(id) ON DELETE CASCADE,
  flat_id uuid NOT NULL REFERENCES public.flats(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(owner_id, flat_id)
);

-- Enable RLS
ALTER TABLE public.owner_flats ENABLE ROW LEVEL SECURITY;

-- RLS policies for owner_flats
CREATE POLICY "Allow public read owner_flats" ON public.owner_flats FOR SELECT USING (true);
CREATE POLICY "Allow public insert owner_flats" ON public.owner_flats FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update owner_flats" ON public.owner_flats FOR UPDATE USING (true);
CREATE POLICY "Allow public delete owner_flats" ON public.owner_flats FOR DELETE USING (true);

-- Add approved_by_owner_id to user_roles to track who approved a tenant
ALTER TABLE public.user_roles ADD COLUMN approved_by_owner_id uuid REFERENCES public.owners(id);

-- Migrate existing owner flat_id data to the junction table
INSERT INTO public.owner_flats (owner_id, flat_id)
SELECT id, flat_id FROM public.owners WHERE flat_id IS NOT NULL;

-- Create function to check if user is owner of a flat
CREATE OR REPLACE FUNCTION public.is_owner_of_flat(_user_id uuid, _flat_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.owners o
    JOIN public.owner_flats of ON o.id = of.owner_id
    WHERE o.user_id = _user_id AND of.flat_id = _flat_id
  )
$$;