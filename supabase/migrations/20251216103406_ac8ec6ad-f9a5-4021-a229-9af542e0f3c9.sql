-- Add invoice_type column to invoices table
-- 'rent' and 'service_charge' count as community income
-- 'service_request' is personal settlement (not community income)
ALTER TABLE public.invoices 
ADD COLUMN invoice_type text NOT NULL DEFAULT 'rent';

-- Add check constraint for valid types
ALTER TABLE public.invoices 
ADD CONSTRAINT invoices_invoice_type_check 
CHECK (invoice_type IN ('rent', 'service_charge', 'service_request'));