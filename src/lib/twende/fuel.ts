/**
 * Deterministic fuel and budget maths for trip planning.
 * Every value here is derived from user-entered vehicle and cost inputs —
 * nothing is estimated by a model or fetched from an external service.
 */

export type TripType = "one-way" | "return";

export function plannedDistance(
  routeDistanceKm: number | null | undefined,
  tripType: TripType,
): number | null {
  if (routeDistanceKm == null) return null;
  return tripType === "return" ? routeDistanceKm * 2 : routeDistanceKm;
}

export function fuelLitres(
  distanceKm: number | null,
  kmPerLitre: number | null | undefined,
): number | null {
  if (distanceKm == null || !kmPerLitre || kmPerLitre <= 0) return null;
  return distanceKm / kmPerLitre;
}

export function fuelCost(litres: number | null, pricePerLitre: number | null): number | null {
  if (litres == null || pricePerLitre == null || pricePerLitre <= 0) return null;
  return litres * pricePerLitre;
}

/** Distance a full tank covers, used to warn about refuelling stops. */
export function tankRangeKm(
  tankCapacity: number | null | undefined,
  kmPerLitre: number | null | undefined,
): number | null {
  if (!tankCapacity || !kmPerLitre || tankCapacity <= 0 || kmPerLitre <= 0) return null;
  return tankCapacity * kmPerLitre;
}

export function refuelStops(distanceKm: number | null, rangeKm: number | null): number {
  if (distanceKm == null || rangeKm == null || rangeKm <= 0) return 0;
  return Math.max(0, Math.ceil(distanceKm / rangeKm) - 1);
}

export function sumCosts(values: Array<number | null>): number {
  return values.reduce<number>((total, value) => total + (value ?? 0), 0);
}

export function formatKes(value: number | null | undefined): string {
  if (value == null) return "—";
  return `KES ${Math.round(value).toLocaleString("en-KE")}`;
}

export function formatLitres(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${value.toFixed(1)} L`;
}
