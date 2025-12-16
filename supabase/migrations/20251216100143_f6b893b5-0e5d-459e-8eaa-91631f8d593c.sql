-- Add ticket_number column with auto-generated sequential number
ALTER TABLE public.service_requests 
ADD COLUMN ticket_number serial NOT NULL;

-- Add resolution_notes for admin comments when closing
ALTER TABLE public.service_requests 
ADD COLUMN resolution_notes text;

-- Add invoice_id to link service requests to invoices
ALTER TABLE public.service_requests 
ADD COLUMN invoice_id uuid REFERENCES public.invoices(id);

-- Create unique index on ticket_number
CREATE UNIQUE INDEX idx_service_requests_ticket_number ON public.service_requests(ticket_number);