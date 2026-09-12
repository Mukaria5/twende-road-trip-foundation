import { useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Fuel, Loader2, MapPin, NotebookPen, X } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { STOP_TYPES } from "@/lib/twende/trip-types";
import type { TrackPoint } from "@/lib/twende/geo";

type ActionKind = "stop" | "note" | "fuel" | "photo";

interface RecorderActionsProps {
  tripId: string;
  userId: string;
  /** Last GPS fix, attached to the record when available. */
  lastFix: TrackPoint | null;
}

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary";
const labelClass = "mb-1.5 block text-xs font-medium text-muted-foreground";

export function TripRecorderActions({ tripId, userId, lastFix }: RecorderActionsProps) {
  const [open, setOpen] = useState<ActionKind | null>(null);

  const buttons: Array<{ kind: ActionKind; label: string; icon: typeof MapPin }> = [
    { kind: "stop", label: "Add stop", icon: MapPin },
    { kind: "photo", label: "Add photo", icon: Camera },
    { kind: "note", label: "Add note", icon: NotebookPen },
    { kind: "fuel", label: "Add fuel", icon: Fuel },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {buttons.map(({ kind, label, icon: Icon }) => (
          <button
            key={kind}
            type="button"
            onClick={() => setOpen(kind)}
            className="flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-card px-3 py-4 text-sm font-medium transition-colors hover:border-primary/40"
          >
            <Icon className="size-5 text-primary" strokeWidth={1.75} aria-hidden />
            {label}
          </button>
        ))}
      </div>

      {open && (
        <Panel title={titleFor(open)} onClose={() => setOpen(null)}>
          {open === "stop" && (
            <StopForm
              tripId={tripId}
              userId={userId}
              lastFix={lastFix}
              onDone={() => setOpen(null)}
            />
          )}
          {open === "note" && (
            <NoteForm
              tripId={tripId}
              userId={userId}
              lastFix={lastFix}
              onDone={() => setOpen(null)}
            />
          )}
          {open === "fuel" && (
            <FuelForm
              tripId={tripId}
              userId={userId}
              lastFix={lastFix}
              onDone={() => setOpen(null)}
            />
          )}
          {open === "photo" && (
            <PhotoForm
              tripId={tripId}
              userId={userId}
              lastFix={lastFix}
              onDone={() => setOpen(null)}
            />
          )}
        </Panel>
      )}
    </div>
  );
}

function titleFor(kind: ActionKind): string {
  if (kind === "stop") return "Record a stop";
  if (kind === "note") return "Write a note";
  if (kind === "fuel") return "Record fuel bought";
  return "Add a photo";
}

function Panel({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-border bg-card p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold">{title}</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" strokeWidth={1.75} />
        </button>
      </div>
      {children}
    </div>
  );
}

function coords(lastFix: TrackPoint | null) {
  return {
    latitude: lastFix?.latitude ?? null,
    longitude: lastFix?.longitude ?? null,
  };
}

function SubmitButton({ pending, label }: { pending: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-60"
    >
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {label}
    </button>
  );
}

interface FormProps {
  tripId: string;
  userId: string;
  lastFix: TrackPoint | null;
  onDone: () => void;
}

function useRecordMutation(keys: string[], onDone: () => void, successMessage: string) {
  const queryClient = useQueryClient();
  return {
    queryClient,
    onSuccess: async () => {
      await Promise.all(keys.map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
      toast.success(successMessage);
      onDone();
    },
  };
}

function StopForm({ tripId, userId, lastFix, onDone }: FormProps) {
  const [name, setName] = useState("");
  const [stopType, setStopType] = useState<string>(STOP_TYPES[0]);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { onSuccess } = useRecordMutation(["trip-stops"], onDone, "Stop recorded");

  const save = useMutation({
    mutationFn: async () => {
      const { error: insertError } = await supabase.from("trip_stops").insert({
        trip_id: tripId,
        user_id: userId,
        name: name.trim(),
        stop_type: stopType,
        note: note.trim() || null,
        ...coords(lastFix),
      });
      if (insertError) throw insertError;
    },
    onSuccess,
    onError: () => setError("Couldn't save that stop. Try again."),
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!name.trim()) {
          setError("Give the stop a name.");
          return;
        }
        setError(null);
        save.mutate();
      }}
    >
      <label className={labelClass} htmlFor="stop-name">
        Stop name
      </label>
      <input
        id="stop-name"
        className={inputClass}
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="e.g. Great Rift Valley viewpoint"
      />

      <label className={`${labelClass} mt-3`} htmlFor="stop-type">
        Type
      </label>
      <select
        id="stop-type"
        className={inputClass}
        value={stopType}
        onChange={(event) => setStopType(event.target.value)}
      >
        {STOP_TYPES.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>

      <label className={`${labelClass} mt-3`} htmlFor="stop-note">
        Note (optional)
      </label>
      <textarea
        id="stop-note"
        rows={2}
        className={inputClass}
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />

      {!lastFix && (
        <p className="mt-2 text-xs text-muted-foreground">
          No location fix yet, so this stop is saved without coordinates.
        </p>
      )}
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      <SubmitButton pending={save.isPending} label="Save stop" />
    </form>
  );
}

function NoteForm({ tripId, userId, lastFix, onDone }: FormProps) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { onSuccess } = useRecordMutation(["trip-notes"], onDone, "Note saved");

  const save = useMutation({
    mutationFn: async () => {
      const { error: insertError } = await supabase.from("trip_notes").insert({
        trip_id: tripId,
        user_id: userId,
        body: body.trim(),
        ...coords(lastFix),
      });
      if (insertError) throw insertError;
    },
    onSuccess,
    onError: () => setError("Couldn't save that note. Try again."),
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!body.trim()) {
          setError("Write something first.");
          return;
        }
        setError(null);
        save.mutate();
      }}
    >
      <label className={labelClass} htmlFor="note-body">
        Note
      </label>
      <textarea
        id="note-body"
        rows={3}
        className={inputClass}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Road conditions, what you saw, who you met…"
      />
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      <SubmitButton pending={save.isPending} label="Save note" />
    </form>
  );
}

function FuelForm({ tripId, userId, lastFix, onDone }: FormProps) {
  const [litres, setLitres] = useState("");
  const [cost, setCost] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { onSuccess } = useRecordMutation(["trip-fuel"], onDone, "Fuel recorded");

  const save = useMutation({
    mutationFn: async () => {
      const litresValue = Number(litres);
      const costValue = cost ? Number(cost) : null;
      const { error: insertError } = await supabase.from("trip_fuel_records").insert({
        trip_id: tripId,
        user_id: userId,
        litres: litresValue,
        total_cost: costValue,
        price_per_litre: costValue != null && litresValue > 0 ? costValue / litresValue : null,
        ...coords(lastFix),
      });
      if (insertError) throw insertError;
    },
    onSuccess,
    onError: () => setError("Couldn't save that fuel record. Try again."),
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const litresValue = Number(litres);
        if (!Number.isFinite(litresValue) || litresValue <= 0) {
          setError("Enter how many litres you bought.");
          return;
        }
        if (cost && (!Number.isFinite(Number(cost)) || Number(cost) < 0)) {
          setError("Enter a valid amount paid.");
          return;
        }
        setError(null);
        save.mutate();
      }}
    >
      <label className={labelClass} htmlFor="fuel-litres">
        Litres
      </label>
      <input
        id="fuel-litres"
        className={inputClass}
        inputMode="decimal"
        value={litres}
        onChange={(event) => setLitres(event.target.value)}
        placeholder="e.g. 35"
      />

      <label className={`${labelClass} mt-3`} htmlFor="fuel-cost">
        Amount paid, KES (optional)
      </label>
      <input
        id="fuel-cost"
        className={inputClass}
        inputMode="decimal"
        value={cost}
        onChange={(event) => setCost(event.target.value)}
        placeholder="e.g. 6300"
      />

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      <SubmitButton pending={save.isPending} label="Save fuel" />
    </form>
  );
}

function PhotoForm({ tripId, userId, lastFix, onDone }: FormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { onSuccess } = useRecordMutation(["trip-photos"], onDone, "Photo added");

  const save = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("no file");
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${userId}/${tripId}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("trip-photos")
        .upload(path, file, { contentType: file.type || "image/jpeg" });
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from("trip_photos").insert({
        trip_id: tripId,
        user_id: userId,
        image_url: path,
        caption: caption.trim() || null,
        captured_at: new Date().toISOString(),
        ...coords(lastFix),
      });
      if (insertError) throw insertError;
    },
    onSuccess,
    onError: () => setError("Couldn't upload that photo. Try again."),
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!file) {
          setError("Choose or take a photo first.");
          return;
        }
        if (file.size > 15 * 1024 * 1024) {
          setError("That photo is larger than 15 MB.");
          return;
        }
        setError(null);
        save.mutate();
      }}
    >
      <label className={labelClass} htmlFor="photo-file">
        Photo
      </label>
      <input
        id="photo-file"
        type="file"
        accept="image/*"
        capture="environment"
        className={inputClass}
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
      />

      <label className={`${labelClass} mt-3`} htmlFor="photo-caption">
        Caption (optional)
      </label>
      <input
        id="photo-caption"
        className={inputClass}
        value={caption}
        onChange={(event) => setCaption(event.target.value)}
      />

      <p className="mt-2 text-xs text-muted-foreground">
        Photos are private to your account and only visible to you.
      </p>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      <SubmitButton pending={save.isPending} label="Upload photo" />
    </form>
  );
}
