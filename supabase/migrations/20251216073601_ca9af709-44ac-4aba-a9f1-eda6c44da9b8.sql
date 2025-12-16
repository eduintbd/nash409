-- Add is_approved column to user_roles for admin approval workflow
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT false;

-- Update existing admin roles to be approved by default
UPDATE public.user_roles SET is_approved = true WHERE role = 'admin';

-- Add requested_role column to store what role user requested during signup
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS requested_role text;

-- Update the handle_new_user function to NOT auto-approve new users (except first admin)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _role app_role;
  _is_approved boolean;
  _requested_role text;
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  
  -- Get the requested role from user metadata
  _requested_role := NEW.raw_user_meta_data ->> 'requested_role';
  
  -- First user becomes admin and is auto-approved
  IF (SELECT COUNT(*) FROM public.user_roles) = 0 THEN
    _role := 'admin';
    _is_approved := true;
  ELSE
    -- All other users start as 'user' role and need approval
    _role := 'user';
    _is_approved := false;
  END IF;
  
  INSERT INTO public.user_roles (user_id, role, is_approved, requested_role) 
  VALUES (NEW.id, _role, _is_approved, _requested_role);
  
  RETURN NEW;
END;
$$;