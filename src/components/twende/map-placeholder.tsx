import { Map } from "lucide-react";

/**
 * Placeholder for the route map. A real routing/mapping provider is wired up in
 * a later phase; until an API key is configured we deliberately show a static
 * panel instead of a fake interactive map.
 */
export function MapPlaceholder({ label = "Route map" }: { label?: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-muted">
      <div
        aria-hidden
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--color-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="relative flex aspect-[16/10] flex-col items-center justify-center gap-2 px-6 text-center sm:aspect-[21/9]">
        <Map className="size-6 text-muted-foreground" strokeWidth={1.5} aria-hidden />
        <p className="text-sm font-medium">{label}</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          Maps and turn-by-turn route previews arrive in a later phase, once a mapping provider is
          connected.
        </p>
      </div>
    </div>
  );
}
