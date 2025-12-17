-- Add owner_number column with auto-increment sequence
CREATE SEQUENCE IF NOT EXISTS owner_number_seq START 1;

ALTER TABLE public.owners 
ADD COLUMN IF NOT EXISTS owner_number integer DEFAULT nextval('owner_number_seq');

-- Add tenant_number column with auto-increment sequence  
CREATE SEQUENCE IF NOT EXISTS tenant_number_seq START 1;

ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS tenant_number integer DEFAULT nextval('tenant_number_seq');

-- Update existing owners with sequential numbers
UPDATE public.owners SET owner_number = nextval('owner_number_seq') WHERE owner_number IS NULL;

-- Update existing tenants with sequential numbers
UPDATE public.tenants SET tenant_number = nextval('tenant_number_seq') WHERE tenant_number IS NULL;

-- Make columns NOT NULL after populating
ALTER TABLE public.owners ALTER COLUMN owner_number SET NOT NULL;
ALTER TABLE public.tenants ALTER COLUMN tenant_number SET NOT NULL;

-- Add unique constraints
ALTER TABLE public.owners ADD CONSTRAINT owners_owner_number_unique UNIQUE (owner_number);
ALTER TABLE public.tenants ADD CONSTRAINT tenants_tenant_number_unique UNIQUE (tenant_number);