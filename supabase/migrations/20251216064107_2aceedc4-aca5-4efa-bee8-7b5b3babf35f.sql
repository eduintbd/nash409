-- Add 'owner' and 'tenant' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'owner';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'tenant';

-- Add user_id column to owners table to link auth users
ALTER TABLE public.owners ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add user_id column to tenants table to link auth users
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster lookup
CREATE INDEX IF NOT EXISTS idx_owners_user_id ON public.owners(user_id);
CREATE INDEX IF NOT EXISTS idx_tenants_user_id ON public.tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_owners_email ON public.owners(email);
CREATE INDEX IF NOT EXISTS idx_tenants_email ON public.tenants(email);

-- Update the handle_new_user function to handle owner/tenant roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role app_role;
  _owner_id uuid;
  _tenant_id uuid;
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  
  -- Check if user signed up as owner (by email match)
  SELECT id INTO _owner_id FROM public.owners WHERE email = NEW.email LIMIT 1;
  
  -- Check if user signed up as tenant (by email match)
  SELECT id INTO _tenant_id FROM public.tenants WHERE email = NEW.email LIMIT 1;
  
  -- Determine role based on email match or first user = admin
  IF _owner_id IS NOT NULL THEN
    _role := 'owner';
    -- Link the owner record to this user
    UPDATE public.owners SET user_id = NEW.id WHERE id = _owner_id;
  ELSIF _tenant_id IS NOT NULL THEN
    _role := 'tenant';
    -- Link the tenant record to this user
    UPDATE public.tenants SET user_id = NEW.id WHERE id = _tenant_id;
  ELSIF (SELECT COUNT(*) FROM public.user_roles) = 0 THEN
    _role := 'admin';
  ELSE
    _role := 'user';
  END IF;
  
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  
  RETURN NEW;
END;
$$;

-- Fix the flat 3A status to 'tenant' since it has a tenant assigned
UPDATE public.flats SET status = 'tenant' WHERE id = 'ce5376ca-ec1a-4a2d-8cfc-569f2a3d123c';