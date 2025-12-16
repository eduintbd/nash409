-- Add agreement fields to tenants table
ALTER TABLE public.tenants 
ADD COLUMN security_deposit numeric DEFAULT 0,
ADD COLUMN house_rules text,
ADD COLUMN maintenance_responsibilities text,
ADD COLUMN agreement_status text DEFAULT 'pending' CHECK (agreement_status IN ('pending', 'sent', 'agreed')),
ADD COLUMN agreement_token uuid DEFAULT gen_random_uuid(),
ADD COLUMN agreement_agreed_at timestamp with time zone,
ADD COLUMN invitation_sent_at timestamp with time zone;