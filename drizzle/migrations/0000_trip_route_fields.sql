ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS start_location_name TEXT,
  ADD COLUMN IF NOT EXISTS start_latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS start_longitude NUMERIC,
  ADD COLUMN IF NOT EXISTS destination_name TEXT,
  ADD COLUMN IF NOT EXISTS destination_latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS destination_longitude NUMERIC,
  ADD COLUMN IF NOT EXISTS waypoints JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS route_distance_km NUMERIC(7,1),
  ADD COLUMN IF NOT EXISTS route_duration_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS route_provider TEXT,
  ADD COLUMN IF NOT EXISTS route_index INTEGER;