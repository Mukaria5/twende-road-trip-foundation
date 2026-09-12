export interface RouteRecord {
  id: string;
  slug: string;
  name: string;
  starting_location: string;
  destination: string;
  description: string | null;
  distance_km: number | null;
  estimated_drive_minutes: number | null;
  recommended_duration: string | null;
  category: string[];
  hero_image: string | null;
  region: string | null;
  difficulty: string | null;
  best_time_to_visit: string | null;
  is_featured: boolean;
}

export interface RouteStopRecord {
  id: string;
  route_id: string;
  name: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  stop_type: string | null;
  recommended_duration: string | null;
  image: string | null;
  display_order: number;
}

export interface TripRecord {
  id: string;
  user_id: string;
  route_id: string | null;
  vehicle_id: string | null;
  title: string | null;
  status: string;
  trip_type: string;
  started_at: string | null;
  completed_at: string | null;
  planned_distance_km: number | null;
  travellers: number;
  actual_distance_km: number | null;
  actual_duration_minutes: number | null;
  estimated_fuel_litres: number | null;
  estimated_fuel_cost: number | null;
  estimated_total_cost: number | null;
  actual_fuel_litres: number | null;
  actual_fuel_cost: number | null;
  notes: string | null;
  created_at: string;
}

export interface VehicleRecord {
  id: string;
  name: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  fuel_type: string | null;
  fuel_consumption_km_per_litre: number | null;
  fuel_tank_capacity: number | null;
  is_primary: boolean;
}
