-- Create utility_readings table for tracking electricity, water, gas consumption
CREATE TABLE public.utility_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flat_id UUID REFERENCES public.flats(id) ON DELETE CASCADE,
  utility_type VARCHAR NOT NULL CHECK (utility_type IN ('electricity', 'water', 'gas')),
  reading_value NUMERIC NOT NULL DEFAULT 0,
  unit VARCHAR NOT NULL DEFAULT 'kWh',
  cost_per_unit NUMERIC NOT NULL DEFAULT 0,
  reading_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_building_wide BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create smart_alerts table for high consumption and anomaly alerts
CREATE TABLE public.smart_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flat_id UUID REFERENCES public.flats(id) ON DELETE CASCADE,
  alert_type VARCHAR NOT NULL CHECK (alert_type IN ('high_consumption', 'leak_detection', 'anomaly', 'maintenance_due')),
  utility_type VARCHAR CHECK (utility_type IN ('electricity', 'water', 'gas', 'hvac')),
  title VARCHAR NOT NULL,
  description TEXT,
  severity VARCHAR NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create maintenance_schedules table for preventive maintenance tracking
CREATE TABLE public.maintenance_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_name VARCHAR NOT NULL,
  equipment_type VARCHAR NOT NULL CHECK (equipment_type IN ('hvac', 'elevator', 'generator', 'water_pump', 'electrical', 'plumbing', 'other')),
  location VARCHAR,
  last_maintenance_date DATE,
  next_maintenance_date DATE NOT NULL,
  frequency_days INTEGER NOT NULL DEFAULT 30,
  assigned_to UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  status VARCHAR NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'overdue')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create temperature_readings table for room temperature monitoring
CREATE TABLE public.temperature_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flat_id UUID REFERENCES public.flats(id) ON DELETE CASCADE,
  location VARCHAR NOT NULL DEFAULT 'common_area',
  temperature NUMERIC NOT NULL,
  humidity NUMERIC,
  hvac_mode VARCHAR DEFAULT 'auto' CHECK (hvac_mode IN ('cooling', 'heating', 'auto', 'off')),
  target_temperature NUMERIC DEFAULT 24,
  reading_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.utility_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temperature_readings ENABLE ROW LEVEL SECURITY;

-- RLS policies for utility_readings (admin full access, owners/tenants read their flat)
CREATE POLICY "Admins can manage utility_readings" ON public.utility_readings FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view building-wide readings" ON public.utility_readings FOR SELECT USING (is_building_wide = true);
CREATE POLICY "Owners can view their flat readings" ON public.utility_readings FOR SELECT USING (is_owner_of_flat(auth.uid(), flat_id));

-- RLS policies for smart_alerts
CREATE POLICY "Admins can manage smart_alerts" ON public.smart_alerts FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view their flat alerts" ON public.smart_alerts FOR SELECT USING (is_owner_of_flat(auth.uid(), flat_id) OR flat_id IS NULL);

-- RLS policies for maintenance_schedules (admin only)
CREATE POLICY "Admins can manage maintenance_schedules" ON public.maintenance_schedules FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can view maintenance_schedules" ON public.maintenance_schedules FOR SELECT USING (true);

-- RLS policies for temperature_readings
CREATE POLICY "Admins can manage temperature_readings" ON public.temperature_readings FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view temperature readings" ON public.temperature_readings FOR SELECT USING (true);

-- Create trigger for maintenance_schedules updated_at
CREATE TRIGGER update_maintenance_schedules_updated_at
BEFORE UPDATE ON public.maintenance_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();