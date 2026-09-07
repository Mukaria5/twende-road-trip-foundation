export const TRIP_CATEGORIES = [
  "Weekend",
  "Scenic",
  "Adventure",
  "Nature",
  "Coast",
  "Photography",
  "Family",
  "Food & Culture",
] as const;

export type TripCategory = (typeof TRIP_CATEGORIES)[number];

export const DURATION_FILTERS = [
  { label: "Any duration", value: "any" },
  { label: "Under 2h", value: "short" },
  { label: "2–4h", value: "medium" },
  { label: "Over 4h", value: "long" },
] as const;

export const DISTANCE_FILTERS = [
  { label: "Any distance", value: "any" },
  { label: "Under 100 km", value: "near" },
  { label: "100–200 km", value: "mid" },
  { label: "Over 200 km", value: "far" },
] as const;

export function matchesDuration(minutes: number | null, filter: string): boolean {
  if (filter === "any") return true;
  if (minutes == null) return false;
  if (filter === "short") return minutes < 120;
  if (filter === "medium") return minutes >= 120 && minutes <= 240;
  return minutes > 240;
}

export function matchesDistance(km: number | null, filter: string): boolean {
  if (filter === "any") return true;
  if (km == null) return false;
  if (filter === "near") return km < 100;
  if (filter === "mid") return km >= 100 && km <= 200;
  return km > 200;
}
