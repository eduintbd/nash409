-- Create storage bucket for property documents
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES 
  ('property-documents', 'property-documents', false, 10485760),
  ('utility-bills', 'utility-bills', false, 10485760)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for property-documents bucket
CREATE POLICY "Authenticated users can upload property documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'property-documents');

CREATE POLICY "Authenticated users can view property documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'property-documents');

CREATE POLICY "Authenticated users can delete property documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'property-documents');

-- Create RLS policies for utility-bills bucket
CREATE POLICY "Authenticated users can upload utility bills"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'utility-bills');

CREATE POLICY "Authenticated users can view utility bills"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'utility-bills');

CREATE POLICY "Authenticated users can delete utility bills"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'utility-bills');

-- Create table for property documents metadata
CREATE TABLE public.property_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  building_name VARCHAR NOT NULL,
  document_name VARCHAR NOT NULL,
  document_type VARCHAR NOT NULL DEFAULT 'general',
  file_path TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on property_documents
ALTER TABLE public.property_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for property_documents
CREATE POLICY "Allow authenticated read property_documents"
ON public.property_documents
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated insert property_documents"
ON public.property_documents
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated delete property_documents"
ON public.property_documents
FOR DELETE
TO authenticated
USING (true);

-- Create table for utility bills metadata
CREATE TABLE public.utility_bills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flat_id UUID REFERENCES public.flats(id) ON DELETE CASCADE,
  bill_type VARCHAR NOT NULL DEFAULT 'electricity',
  bill_month VARCHAR NOT NULL,
  bill_year INTEGER NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  paid_by VARCHAR NOT NULL DEFAULT 'tenant',
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on utility_bills
ALTER TABLE public.utility_bills ENABLE ROW LEVEL SECURITY;

-- RLS policies for utility_bills
CREATE POLICY "Allow authenticated read utility_bills"
ON public.utility_bills
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated insert utility_bills"
ON public.utility_bills
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated update utility_bills"
ON public.utility_bills
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated delete utility_bills"
ON public.utility_bills
FOR DELETE
TO authenticated
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_property_documents_updated_at
BEFORE UPDATE ON public.property_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_utility_bills_updated_at
BEFORE UPDATE ON public.utility_bills
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();