-- Add building_name column to flats table for multi-location property management
ALTER TABLE public.flats 
ADD COLUMN building_name VARCHAR DEFAULT NULL;