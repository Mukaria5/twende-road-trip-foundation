CREATE TABLE public.saved_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  route_id uuid NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, route_id)
);

GRANT SELECT, INSERT, DELETE ON public.saved_routes TO authenticated;
GRANT ALL ON public.saved_routes TO service_role;

ALTER TABLE public.saved_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY saved_routes_own_select ON public.saved_routes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY saved_routes_own_insert ON public.saved_routes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY saved_routes_own_delete ON public.saved_routes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX saved_routes_user_idx ON public.saved_routes (user_id);
