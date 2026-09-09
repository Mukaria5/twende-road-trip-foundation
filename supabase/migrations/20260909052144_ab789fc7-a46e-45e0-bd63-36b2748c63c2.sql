ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS trip_type text NOT NULL DEFAULT 'return',
  ADD COLUMN IF NOT EXISTS planned_distance_km numeric,
  ADD COLUMN IF NOT EXISTS travellers integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS estimated_accommodation_cost numeric,
  ADD COLUMN IF NOT EXISTS estimated_food_cost numeric,
  ADD COLUMN IF NOT EXISTS estimated_activity_cost numeric,
  ADD COLUMN IF NOT EXISTS estimated_other_cost numeric,
  ADD COLUMN IF NOT EXISTS estimated_total_cost numeric;

ALTER TABLE public.trips
  ADD CONSTRAINT trips_trip_type_check CHECK (trip_type IN ('one_way', 'return'));

ALTER TABLE public.trips
  ADD CONSTRAINT trips_travellers_check CHECK (travellers >= 1);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS fuel_price_per_litre numeric;