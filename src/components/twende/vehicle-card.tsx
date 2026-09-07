import { Car, Fuel } from "lucide-react";

import type { VehicleRecord } from "@/lib/twende/types";

interface VehicleCardProps {
  vehicle?: VehicleRecord;
}

/** Fuel estimation is a later phase, so an unset vehicle shows a clear prompt. */
export function VehicleCard({ vehicle }: VehicleCardProps) {
  if (!vehicle) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Car className="size-5" strokeWidth={1.5} aria-hidden />
          </span>
          <div>
            <p className="font-medium">No vehicle added yet</p>
            <p className="text-sm text-muted-foreground">
              Vehicle and fuel consumption details will power trip fuel estimates.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const title =
    vehicle.name ?? [vehicle.make, vehicle.model].filter(Boolean).join(" ") ?? "Your vehicle";

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">
            {[vehicle.year, vehicle.fuel_type].filter(Boolean).join(" · ") || "Details incomplete"}
          </p>
        </div>
        {vehicle.is_primary && (
          <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium text-accent-foreground">
            Primary
          </span>
        )}
      </div>
      <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Fuel className="size-4" strokeWidth={1.75} aria-hidden />
        {vehicle.fuel_consumption_km_per_litre
          ? `${vehicle.fuel_consumption_km_per_litre} km/L`
          : "Consumption not set"}
      </div>
    </div>
  );
}
