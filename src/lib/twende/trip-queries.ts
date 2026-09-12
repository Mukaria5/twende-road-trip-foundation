import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { TripRecord } from "./types";
import type {
  TripFuelRecord,
  TripNoteRecord,
  TripPhotoRecord,
  TripStopRecord,
  TripTrackPointRecord,
} from "./trip-types";

export const tripQuery = (tripId: string) =>
  queryOptions({
    queryKey: ["trip", tripId],
    queryFn: async (): Promise<TripRecord | null> => {
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .eq("id", tripId)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as TripRecord | null;
    },
  });

export const tripStopsQuery = (tripId: string) =>
  queryOptions({
    queryKey: ["trip-stops", tripId],
    queryFn: async (): Promise<TripStopRecord[]> => {
      const { data, error } = await supabase
        .from("trip_stops")
        .select("*")
        .eq("trip_id", tripId)
        .order("recorded_at");
      if (error) throw error;
      return (data ?? []) as unknown as TripStopRecord[];
    },
  });

export const tripNotesQuery = (tripId: string) =>
  queryOptions({
    queryKey: ["trip-notes", tripId],
    queryFn: async (): Promise<TripNoteRecord[]> => {
      const { data, error } = await supabase
        .from("trip_notes")
        .select("*")
        .eq("trip_id", tripId)
        .order("recorded_at");
      if (error) throw error;
      return (data ?? []) as unknown as TripNoteRecord[];
    },
  });

export const tripFuelQuery = (tripId: string) =>
  queryOptions({
    queryKey: ["trip-fuel", tripId],
    queryFn: async (): Promise<TripFuelRecord[]> => {
      const { data, error } = await supabase
        .from("trip_fuel_records")
        .select("*")
        .eq("trip_id", tripId)
        .order("recorded_at");
      if (error) throw error;
      return (data ?? []) as unknown as TripFuelRecord[];
    },
  });

export interface TripPhotoWithUrl extends TripPhotoRecord {
  /** Short-lived signed URL; the photo bucket is private. */
  signed_url: string | null;
}

export const tripPhotosQuery = (tripId: string) =>
  queryOptions({
    queryKey: ["trip-photos", tripId],
    queryFn: async (): Promise<TripPhotoWithUrl[]> => {
      const { data, error } = await supabase
        .from("trip_photos")
        .select("*")
        .eq("trip_id", tripId)
        .order("created_at");
      if (error) throw error;
      const photos = (data ?? []) as unknown as TripPhotoRecord[];
      if (photos.length === 0) return [];

      const { data: signed } = await supabase.storage
        .from("trip-photos")
        .createSignedUrls(
          photos.map((photo) => photo.image_url),
          60 * 60,
        );

      return photos.map((photo, index) => ({
        ...photo,
        signed_url: signed?.[index]?.signedUrl ?? null,
      }));
    },
  });

export const tripTrackQuery = (tripId: string) =>
  queryOptions({
    queryKey: ["trip-track", tripId],
    queryFn: async (): Promise<TripTrackPointRecord[]> => {
      const { data, error } = await supabase
        .from("trip_track_points")
        .select("*")
        .eq("trip_id", tripId)
        .order("recorded_at");
      if (error) throw error;
      return (data ?? []) as unknown as TripTrackPointRecord[];
    },
  });
