import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import type { VehicleRecord } from "@/lib/twende/types";

const FUEL_TYPES = ["Petrol", "Diesel", "Hybrid", "Electric"] as const;

interface VehicleFormProps {
  userId: string;
  /** When provided, the form edits this vehicle instead of creating one. */
  vehicle?: VehicleRecord | undefined;
  onDone: () => void;
}

interface FormState {
  make: string;
  model: string;
  year: string;
  fuel_type: string;
  consumption: string;
  tank_capacity: string;
}

function toState(vehicle?: VehicleRecord): FormState {
  return {
    make: vehicle?.make ?? "",
    model: vehicle?.model ?? "",
    year: vehicle?.year ? String(vehicle.year) : "",
    fuel_type: vehicle?.fuel_type ?? "Petrol",
    consumption: vehicle?.fuel_consumption_km_per_litre
      ? String(vehicle.fuel_consumption_km_per_litre)
      : "",
    tank_capacity: vehicle?.fuel_tank_capacity ? String(vehicle.fuel_tank_capacity) : "",
  };
}

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary";
const labelClass = "mb-1.5 block text-xs font-medium text-muted-foreground";

export function VehicleForm({ userId, vehicle, onDone }: VehicleFormProps) {
  const [form, setForm] = useState<FormState>(() => toState(vehicle));
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const save = useMutation({
    mutationFn: async () => {
      const consumption = Number(form.consumption);
      const payload = {
        user_id: userId,
        make: form.make.trim(),
        model: form.model.trim(),
        year: form.year ? Number(form.year) : null,
        fuel_type: form.fuel_type,
        fuel_consumption_km_per_litre: consumption,
        fuel_tank_capacity: form.tank_capacity ? Number(form.tank_capacity) : null,
        name: [form.make.trim(), form.model.trim()].filter(Boolean).join(" "),
      };

      const query = vehicle
        ? await supabase.from("vehicles").update(payload).eq("id", vehicle.id)
        : await supabase.from("vehicles").insert(payload);
      if (query.error) throw query.error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success(vehicle ? "Vehicle updated" : "Vehicle added");
      onDone();
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Couldn't save your vehicle. Try again.");
    },
  });

  function set(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  function validate(): string | null {
    if (!form.make.trim()) return "Enter the vehicle make, e.g. Toyota.";
    if (!form.model.trim()) return "Enter the vehicle model, e.g. Fielder.";
    const consumption = Number(form.consumption);
    if (!form.consumption || !Number.isFinite(consumption) || consumption <= 0) {
      return "Fuel consumption must be a number above 0 km/L — it's needed for fuel estimates.";
    }
    if (form.year) {
      const year = Number(form.year);
      if (!Number.isInteger(year) || year < 1950 || year > new Date().getFullYear() + 1) {
        return "Enter a valid year.";
      }
    }
    if (form.tank_capacity) {
      const tank = Number(form.tank_capacity);
      if (!Number.isFinite(tank) || tank <= 0) return "Tank capacity must be above 0 litres.";
    }
    return null;
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    save.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="vehicle-make" className={labelClass}>
            Make
          </label>
          <input
            id="vehicle-make"
            value={form.make}
            onChange={(e) => set("make", e.target.value)}
            placeholder="Toyota"
            maxLength={60}
            className={inputClass}
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="vehicle-model" className={labelClass}>
            Model
          </label>
          <input
            id="vehicle-model"
            value={form.model}
            onChange={(e) => set("model", e.target.value)}
            placeholder="Fielder"
            maxLength={60}
            className={inputClass}
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="vehicle-year" className={labelClass}>
            Year <span className="font-normal">(optional)</span>
          </label>
          <input
            id="vehicle-year"
            value={form.year}
            onChange={(e) => set("year", e.target.value)}
            placeholder="2016"
            inputMode="numeric"
            maxLength={4}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="vehicle-fuel-type" className={labelClass}>
            Fuel type
          </label>
          <select
            id="vehicle-fuel-type"
            value={form.fuel_type}
            onChange={(e) => set("fuel_type", e.target.value)}
            className={inputClass}
          >
            {FUEL_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="vehicle-consumption" className={labelClass}>
            Fuel consumption (km/L)
          </label>
          <input
            id="vehicle-consumption"
            value={form.consumption}
            onChange={(e) => set("consumption", e.target.value)}
            placeholder="14"
            inputMode="decimal"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Required — it powers your trip fuel estimates.
          </p>
        </div>
        <div>
          <label htmlFor="vehicle-tank" className={labelClass}>
            Tank capacity in litres <span className="font-normal">(optional)</span>
          </label>
          <input
            id="vehicle-tank"
            value={form.tank_capacity}
            onChange={(e) => set("tank_capacity", e.target.value)}
            placeholder="50"
            inputMode="decimal"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Used to warn you when a trip exceeds one tank.
          </p>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={save.isPending}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {save.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {vehicle ? "Save changes" : "Add vehicle"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-full px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
