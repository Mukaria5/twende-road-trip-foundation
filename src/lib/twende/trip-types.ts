export const STOP_TYPES = [
  "Scenic View",
  "Food",
  "Fuel",
  "Rest",
  "Activity",
  "Attraction",
  "Photography",
  "Other",
] as const;

export type StopType = (typeof STOP_TYPES)[number];

export interface TripStopRecord {
  id: string;
  trip_id: string;
  name: string;
  stop_type: string | null;
  note: string | null;
  latitude: number | null;
  longitude: number | null;
  recorded_at: string;
}

export interface TripNoteRecord {
  id: string;
  trip_id: string;
  body: string;
  latitude: number | null;
  longitude: number | null;
  recorded_at: string;
}

export interface TripFuelRecord {
  id: string;
  trip_id: string;
  litres: number;
  total_cost: number | null;
  price_per_litre: number | null;
  latitude: number | null;
  longitude: number | null;
  recorded_at: string;
}

export interface TripPhotoRecord {
  id: string;
  trip_id: string;
  image_url: string;
  caption: string | null;
  latitude: number | null;
  longitude: number | null;
  captured_at: string | null;
  created_at: string;
}

export interface TripTrackPointRecord {
  id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  recorded_at: string;
}
