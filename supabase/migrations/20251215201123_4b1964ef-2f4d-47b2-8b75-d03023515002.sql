-- Create enum types
CREATE TYPE flat_status AS ENUM ('owner-occupied', 'tenant', 'vacant');
CREATE TYPE employee_role AS ENUM ('guard', 'cleaner', 'caretaker', 'other');
CREATE TYPE invoice_status AS ENUM ('paid', 'unpaid', 'overdue');
CREATE TYPE payment_method AS ENUM ('cash', 'bank', 'bkash', 'nagad', 'rocket', 'cheque');
CREATE TYPE request_category AS ENUM ('plumbing', 'electrical', 'elevator', 'common-area', 'other');
CREATE TYPE request_status AS ENUM ('open', 'in-progress', 'resolved', 'closed');
CREATE TYPE request_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE camera_status AS ENUM ('online', 'offline');

-- Flats table (20 flats: 2A-2D through 6A-6D)
CREATE TABLE public.flats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flat_number VARCHAR(10) NOT NULL UNIQUE,
  floor INTEGER NOT NULL CHECK (floor >= 2 AND floor <= 6),
  size NUMERIC(10,2) NOT NULL DEFAULT 1200,
  status flat_status NOT NULL DEFAULT 'vacant',
  parking_spot VARCHAR(20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Owners table
CREATE TABLE public.owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flat_id UUID REFERENCES public.flats(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20) NOT NULL,
  nid VARCHAR(20),
  emergency_contact VARCHAR(20),
  ownership_start DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tenants table
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flat_id UUID REFERENCES public.flats(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20) NOT NULL,
  nid VARCHAR(20),
  rent_amount NUMERIC(10,2) NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Employees table
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  role employee_role NOT NULL,
  phone VARCHAR(20) NOT NULL,
  nid VARCHAR(20),
  salary NUMERIC(10,2) NOT NULL,
  shift VARCHAR(50),
  join_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flat_id UUID REFERENCES public.flats(id) ON DELETE CASCADE NOT NULL,
  month VARCHAR(20) NOT NULL,
  year INTEGER NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  due_date DATE NOT NULL,
  status invoice_status NOT NULL DEFAULT 'unpaid',
  paid_date DATE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  flat_id UUID REFERENCES public.flats(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  method payment_method NOT NULL DEFAULT 'cash',
  reference VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Expense categories
CREATE TABLE public.expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Expenses table
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  vendor VARCHAR(255),
  payment_method payment_method NOT NULL DEFAULT 'cash',
  attachment_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Service requests table
CREATE TABLE public.service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flat_id UUID REFERENCES public.flats(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  category request_category NOT NULL DEFAULT 'other',
  description TEXT,
  status request_status NOT NULL DEFAULT 'open',
  priority request_priority NOT NULL DEFAULT 'medium',
  assigned_to UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  cost NUMERIC(10,2),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cameras table
CREATE TABLE public.cameras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  location VARCHAR(255) NOT NULL,
  camera_id VARCHAR(100),
  status camera_status NOT NULL DEFAULT 'offline',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.flats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cameras ENABLE ROW LEVEL SECURITY;

-- For now, allow public read access (we'll add auth later)
CREATE POLICY "Allow public read flats" ON public.flats FOR SELECT USING (true);
CREATE POLICY "Allow public insert flats" ON public.flats FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update flats" ON public.flats FOR UPDATE USING (true);
CREATE POLICY "Allow public delete flats" ON public.flats FOR DELETE USING (true);

CREATE POLICY "Allow public read owners" ON public.owners FOR SELECT USING (true);
CREATE POLICY "Allow public insert owners" ON public.owners FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update owners" ON public.owners FOR UPDATE USING (true);
CREATE POLICY "Allow public delete owners" ON public.owners FOR DELETE USING (true);

CREATE POLICY "Allow public read tenants" ON public.tenants FOR SELECT USING (true);
CREATE POLICY "Allow public insert tenants" ON public.tenants FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update tenants" ON public.tenants FOR UPDATE USING (true);
CREATE POLICY "Allow public delete tenants" ON public.tenants FOR DELETE USING (true);

CREATE POLICY "Allow public read employees" ON public.employees FOR SELECT USING (true);
CREATE POLICY "Allow public insert employees" ON public.employees FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update employees" ON public.employees FOR UPDATE USING (true);
CREATE POLICY "Allow public delete employees" ON public.employees FOR DELETE USING (true);

CREATE POLICY "Allow public read invoices" ON public.invoices FOR SELECT USING (true);
CREATE POLICY "Allow public insert invoices" ON public.invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update invoices" ON public.invoices FOR UPDATE USING (true);
CREATE POLICY "Allow public delete invoices" ON public.invoices FOR DELETE USING (true);

CREATE POLICY "Allow public read payments" ON public.payments FOR SELECT USING (true);
CREATE POLICY "Allow public insert payments" ON public.payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update payments" ON public.payments FOR UPDATE USING (true);
CREATE POLICY "Allow public delete payments" ON public.payments FOR DELETE USING (true);

CREATE POLICY "Allow public read expense_categories" ON public.expense_categories FOR SELECT USING (true);
CREATE POLICY "Allow public insert expense_categories" ON public.expense_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update expense_categories" ON public.expense_categories FOR UPDATE USING (true);
CREATE POLICY "Allow public delete expense_categories" ON public.expense_categories FOR DELETE USING (true);

CREATE POLICY "Allow public read expenses" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Allow public insert expenses" ON public.expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update expenses" ON public.expenses FOR UPDATE USING (true);
CREATE POLICY "Allow public delete expenses" ON public.expenses FOR DELETE USING (true);

CREATE POLICY "Allow public read service_requests" ON public.service_requests FOR SELECT USING (true);
CREATE POLICY "Allow public insert service_requests" ON public.service_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update service_requests" ON public.service_requests FOR UPDATE USING (true);
CREATE POLICY "Allow public delete service_requests" ON public.service_requests FOR DELETE USING (true);

CREATE POLICY "Allow public read cameras" ON public.cameras FOR SELECT USING (true);
CREATE POLICY "Allow public insert cameras" ON public.cameras FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update cameras" ON public.cameras FOR UPDATE USING (true);
CREATE POLICY "Allow public delete cameras" ON public.cameras FOR DELETE USING (true);

-- Insert the 20 flats (2A-2D through 6A-6D)
INSERT INTO public.flats (flat_number, floor, size, status, parking_spot) VALUES
  ('2A', 2, 1200, 'vacant', 'P-01'),
  ('2B', 2, 1200, 'vacant', 'P-02'),
  ('2C', 2, 1100, 'vacant', 'P-03'),
  ('2D', 2, 1100, 'vacant', 'P-04'),
  ('3A', 3, 1200, 'vacant', 'P-05'),
  ('3B', 3, 1200, 'vacant', 'P-06'),
  ('3C', 3, 1100, 'vacant', 'P-07'),
  ('3D', 3, 1100, 'vacant', 'P-08'),
  ('4A', 4, 1200, 'vacant', 'P-09'),
  ('4B', 4, 1200, 'vacant', 'P-10'),
  ('4C', 4, 1100, 'vacant', 'P-11'),
  ('4D', 4, 1100, 'vacant', 'P-12'),
  ('5A', 5, 1200, 'vacant', 'P-13'),
  ('5B', 5, 1200, 'vacant', 'P-14'),
  ('5C', 5, 1100, 'vacant', 'P-15'),
  ('5D', 5, 1100, 'vacant', 'P-16'),
  ('6A', 6, 1200, 'vacant', 'P-17'),
  ('6B', 6, 1200, 'vacant', 'P-18'),
  ('6C', 6, 1100, 'vacant', 'P-19'),
  ('6D', 6, 1100, 'vacant', 'P-20');

-- Insert expense categories
INSERT INTO public.expense_categories (name) VALUES
  ('বিদ্যুৎ (Electricity)'),
  ('পানি (Water)'),
  ('লিফট রক্ষণাবেক্ষণ (Elevator)'),
  ('নিরাপত্তা (Security)'),
  ('পরিচ্ছন্নতা (Cleaning)'),
  ('মেরামত (Repairs)'),
  ('ইন্টারনেট (Internet)'),
  ('রিজার্ভ ফান্ড (Reserve Fund)'),
  ('অন্যান্য (Other)');

-- Insert default cameras
INSERT INTO public.cameras (name, location, camera_id, status) VALUES
  ('গেট ক্যামেরা', 'মূল প্রবেশদ্বার', 'CAM-001', 'offline'),
  ('লিফট ক্যামেরা', 'লিফট লবি', 'CAM-002', 'offline'),
  ('পার্কিং ক্যামেরা', 'পার্কিং এলাকা', 'CAM-003', 'offline'),
  ('ছাদ ক্যামেরা', 'ছাদ', 'CAM-004', 'offline');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_flats_updated_at BEFORE UPDATE ON public.flats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_owners_updated_at BEFORE UPDATE ON public.owners FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_service_requests_updated_at BEFORE UPDATE ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cameras_updated_at BEFORE UPDATE ON public.cameras FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();