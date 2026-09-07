
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  home_county TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own_select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_own_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_own_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_own_delete" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- vehicles
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT,
  make TEXT,
  model TEXT,
  year INTEGER,
  fuel_type TEXT,
  fuel_consumption_km_per_litre NUMERIC(6,2),
  fuel_tank_capacity NUMERIC(6,2),
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX vehicles_user_id_idx ON public.vehicles(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT ALL ON public.vehicles TO service_role;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vehicles_own_all" ON public.vehicles FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- routes (public curated content)
CREATE TABLE public.routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  starting_location TEXT NOT NULL,
  destination TEXT NOT NULL,
  description TEXT,
  distance_km NUMERIC(7,1),
  estimated_drive_minutes INTEGER,
  recommended_duration TEXT,
  category TEXT[] NOT NULL DEFAULT '{}',
  hero_image TEXT,
  region TEXT,
  difficulty TEXT,
  best_time_to_visit TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.routes TO anon;
GRANT SELECT ON public.routes TO authenticated;
GRANT ALL ON public.routes TO service_role;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "routes_public_read" ON public.routes FOR SELECT TO anon, authenticated USING (true);
CREATE TRIGGER routes_updated_at BEFORE UPDATE ON public.routes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.route_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  stop_type TEXT,
  recommended_duration TEXT,
  image TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX route_stops_route_id_idx ON public.route_stops(route_id);
GRANT SELECT ON public.route_stops TO anon;
GRANT SELECT ON public.route_stops TO authenticated;
GRANT ALL ON public.route_stops TO service_role;
ALTER TABLE public.route_stops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "route_stops_public_read" ON public.route_stops FOR SELECT TO anon, authenticated USING (true);
CREATE TRIGGER route_stops_updated_at BEFORE UPDATE ON public.route_stops FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- trips
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  route_id UUID REFERENCES public.routes(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  title TEXT,
  status TEXT NOT NULL DEFAULT 'planned',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  actual_distance_km NUMERIC(7,1),
  actual_duration_minutes INTEGER,
  estimated_fuel_litres NUMERIC(7,2),
  actual_fuel_litres NUMERIC(7,2),
  estimated_fuel_cost NUMERIC(10,2),
  actual_fuel_cost NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX trips_user_id_idx ON public.trips(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trips TO authenticated;
GRANT ALL ON public.trips TO service_role;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trips_own_all" ON public.trips FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trips_updated_at BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.trip_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  captured_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX trip_photos_trip_id_idx ON public.trip_photos(trip_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_photos TO authenticated;
GRANT ALL ON public.trip_photos TO service_role;
ALTER TABLE public.trip_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trip_photos_own_all" ON public.trip_photos FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- seed curated routes (approximate values, to be verified with a mapping provider later)
INSERT INTO public.routes (slug, name, starting_location, destination, description, distance_km, estimated_drive_minutes, recommended_duration, category, region, difficulty, best_time_to_visit, is_featured) VALUES
('nairobi-naivasha','Nairobi → Naivasha','Nairobi','Naivasha','A classic escape over the Rift Valley escarpment towards lake country.',95,120,'Weekend','{Scenic,Adventure}','Rift Valley','Easy','Year round',true),
('nairobi-nanyuki','Nairobi → Nanyuki','Nairobi','Nanyuki','Drive north across the equator towards the foothills of Mount Kenya.',200,210,'Weekend','{Nature,Adventure}','Mount Kenya','Easy','Dry season',true),
('nairobi-nakuru','Nairobi → Nakuru','Nairobi','Nakuru','A straightforward highway run into the heart of the Rift Valley.',160,180,'Day trip','{Scenic,Family}','Rift Valley','Easy','Year round',true),
('nairobi-amboseli','Nairobi → Amboseli','Nairobi','Amboseli','A long southern drive towards open plains and big-sky views.',240,270,'2–3 days','{Nature,Photography}','Southern Kenya','Moderate','Dry season',true),
('nairobi-nyeri','Nairobi → Nyeri','Nairobi','Nyeri','Central highlands roads through tea and coffee country.',150,165,'Weekend','{Nature,"Food & Culture"}','Central','Easy','Year round',false),
('nairobi-thika','Nairobi → Thika','Nairobi','Thika','A short outing on the superhighway, easy for a half day.',45,60,'Day trip','{Family,"Day trip"}','Central','Easy','Year round',false),
('nairobi-limuru','Nairobi → Limuru','Nairobi','Limuru','Cool, green highlands only a short drive from the city.',35,50,'Day trip','{Scenic,Photography}','Central','Easy','Year round',false),
('nairobi-maasai-mara','Nairobi → Maasai Mara','Nairobi','Maasai Mara','A demanding long-haul drive south-west into open savannah country.',270,330,'3–4 days','{Adventure,Nature,Photography}','South Rift','Challenging','Dry season',true),
('mombasa-diani','Mombasa → Diani','Mombasa','Diani','A coastal run south of Mombasa towards the beaches.',30,60,'Weekend','{Coast,Family}','Coast','Easy','Year round',true),
('mombasa-watamu','Mombasa → Watamu','Mombasa','Watamu','North along the coast road towards quieter shorelines.',105,150,'Weekend','{Coast,Scenic}','Coast','Easy','Year round',false);

INSERT INTO public.route_stops (route_id, name, description, stop_type, display_order)
SELECT id, 'Great Rift Valley Viewpoint', 'Common stopping point along the escarpment road.', 'viewpoint', 1 FROM public.routes WHERE slug = 'nairobi-naivasha';
INSERT INTO public.route_stops (route_id, name, description, stop_type, display_order)
SELECT id, 'Naivasha town', 'Fuel, food and supplies before continuing.', 'town', 2 FROM public.routes WHERE slug = 'nairobi-naivasha';
INSERT INTO public.route_stops (route_id, name, description, stop_type, display_order)
SELECT id, 'Equator crossing', 'Marked crossing point on the way north.', 'landmark', 1 FROM public.routes WHERE slug = 'nairobi-nanyuki';
