CREATE TABLE public.trip_track_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  accuracy numeric,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_track_points TO authenticated;
GRANT ALL ON public.trip_track_points TO service_role;
ALTER TABLE public.trip_track_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY trip_track_points_own_all ON public.trip_track_points FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX trip_track_points_trip_idx ON public.trip_track_points (trip_id, recorded_at);

CREATE TABLE public.trip_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  stop_type text,
  note text,
  latitude numeric,
  longitude numeric,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_stops TO authenticated;
GRANT ALL ON public.trip_stops TO service_role;
ALTER TABLE public.trip_stops ENABLE ROW LEVEL SECURITY;
CREATE POLICY trip_stops_own_all ON public.trip_stops FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX trip_stops_trip_idx ON public.trip_stops (trip_id, recorded_at);

CREATE TABLE public.trip_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  latitude numeric,
  longitude numeric,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_notes TO authenticated;
GRANT ALL ON public.trip_notes TO service_role;
ALTER TABLE public.trip_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY trip_notes_own_all ON public.trip_notes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX trip_notes_trip_idx ON public.trip_notes (trip_id, recorded_at);

CREATE TABLE public.trip_fuel_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  litres numeric NOT NULL CHECK (litres > 0),
  total_cost numeric,
  price_per_litre numeric,
  latitude numeric,
  longitude numeric,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_fuel_records TO authenticated;
GRANT ALL ON public.trip_fuel_records TO service_role;
ALTER TABLE public.trip_fuel_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY trip_fuel_records_own_all ON public.trip_fuel_records FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX trip_fuel_records_trip_idx ON public.trip_fuel_records (trip_id, recorded_at);