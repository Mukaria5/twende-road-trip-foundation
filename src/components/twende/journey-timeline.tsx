import { Camera, Coffee, Fuel, Landmark, MapPin, Mountain, Utensils } from "lucide-react";

import type { RouteStopRecord } from "@/lib/twende/types";

const ICONS: Record<string, typeof MapPin> = {
  viewpoint: Mountain,
  scenic: Mountain,
  photo: Camera,
  photography: Camera,
  food: Utensils,
  restaurant: Utensils,
  cafe: Coffee,
  rest: Coffee,
  fuel: Fuel,
  landmark: Landmark,
  culture: Landmark,
};

function iconFor(stopType: string | null) {
  if (!stopType) return MapPin;
  return ICONS[stopType.toLowerCase()] ?? MapPin;
}

export function JourneyTimeline({ stops }: { stops: RouteStopRecord[] }) {
  return (
    <ol className="relative space-y-3 border-l border-border pl-6">
      {stops.map((stop) => {
        const Icon = iconFor(stop.stop_type);
        return (
          <li key={stop.id} className="relative">
            <span className="absolute -left-[2.1rem] top-3 flex size-7 items-center justify-center rounded-full border border-border bg-card">
              <Icon className="size-3.5 text-primary" strokeWidth={1.75} aria-hidden />
            </span>
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{stop.name}</p>
                {stop.stop_type && (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-accent-foreground">
                    {stop.stop_type}
                  </span>
                )}
              </div>
              {stop.recommended_duration && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Suggested stop: {stop.recommended_duration}
                </p>
              )}
              {stop.description && (
                <p className="mt-2 text-sm text-muted-foreground">{stop.description}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
