import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

import type { RouteRecord, RouteStopRecord, TripRecord, VehicleRecord } from "./types";

const ROUTE_FIELDS =
  "id, slug, name, starting_location, destination, description, distance_km, estimated_drive_minutes, recommended_duration, category, hero_image, region, difficulty, best_time_to_visit, is_featured";

export const routesQuery = queryOptions({
  queryKey: ["routes"],
  queryFn: async (): Promise<RouteRecord[]> => {
    const { data, error } = await supabase
      .from("routes")
      .select(ROUTE_FIELDS)
      .order("is_featured", { ascending: false })
      .order("name");
    if (error) throw error;
    return (data ?? []) as unknown as RouteRecord[];
  },
});

export const routeBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["route", slug],
    queryFn: async (): Promise<{ route: RouteRecord; stops: RouteStopRecord[] } | null> => {
      const { data, error } = await supabase
        .from("routes")
        .select(ROUTE_FIELDS)
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      const route = data as unknown as RouteRecord;
      const { data: stops, error: stopsError } = await supabase
        .from("route_stops")
        .select("*")
        .eq("route_id", route.id)
        .order("display_order");
      if (stopsError) throw stopsError;

      return { route, stops: (stops ?? []) as unknown as RouteStopRecord[] };
    },
  });

export const savedRouteQuery = (userId: string | null, routeId: string) =>
  queryOptions({
    queryKey: ["saved-route", userId, routeId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from("saved_routes")
        .select("id")
        .eq("route_id", routeId)
        .maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },
  });

export const tripsQuery = (userId: string | null) =>

  queryOptions({
    queryKey: ["trips", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<TripRecord[]> => {
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as TripRecord[];
    },
  });

export const vehiclesQuery = (userId: string | null) =>
  queryOptions({
    queryKey: ["vehicles", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<VehicleRecord[]> => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .order("is_primary", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as VehicleRecord[];
    },
  });
