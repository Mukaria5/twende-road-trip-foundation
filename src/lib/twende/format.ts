/**
 * Formatting helpers. Route distances and drive times are curated estimates
 * today and will be replaced by values from a mapping provider in a later
 * phase — so anything missing renders as "—" rather than a made-up number.
 */

export function formatDistance(km: number | null | undefined): string {
  if (km == null) return "—";
  return `${Math.round(km)} km`;
}

export function formatDuration(minutes: number | null | undefined): string {
  if (minutes == null) return "—";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  if (rest === 0) return `~${hours}h`;
  return `~${hours}h ${rest}m`;
}

export function formatRouteMeta(
  km: number | null | undefined,
  minutes: number | null | undefined,
): string {
  return [formatDistance(km), formatDuration(minutes)].filter(Boolean).join(" · ");
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
