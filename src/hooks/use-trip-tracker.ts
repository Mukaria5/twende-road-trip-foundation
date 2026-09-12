import { useCallback, useEffect, useRef, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { isPlausibleStep, type TrackPoint } from "@/lib/twende/geo";

export type TrackerStatus = "idle" | "requesting" | "tracking" | "denied" | "unavailable" | "error";

interface UseTripTrackerOptions {
  tripId: string;
  userId: string | null;
  /** Distance already recorded before this browser session (km). */
  initialDistanceKm?: number;
  /** Last known point from a previous session, so resuming doesn't jump. */
  initialLastPoint?: TrackPoint | null;
}

/** How often buffered points are written to the database. */
const FLUSH_MS = 20_000;

/**
 * Foreground-only GPS recording. Tracking runs while this screen is open and
 * stops when it is closed or paused — the browser cannot track in the
 * background, and we never pretend otherwise.
 */
export function useTripTracker({
  tripId,
  userId,
  initialDistanceKm = 0,
  initialLastPoint = null,
}: UseTripTrackerOptions) {
  const [status, setStatus] = useState<TrackerStatus>("idle");
  const [distanceKm, setDistanceKm] = useState(initialDistanceKm);
  const [lastFix, setLastFix] = useState<TrackPoint | null>(initialLastPoint);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const watchId = useRef<number | null>(null);
  const lastAccepted = useRef<TrackPoint | null>(initialLastPoint);
  const buffer = useRef<TrackPoint[]>([]);
  const flushTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const flush = useCallback(async () => {
    if (!userId || buffer.current.length === 0) return;
    const pending = buffer.current;
    buffer.current = [];
    const { error } = await supabase.from("trip_track_points").insert(
      pending.map((point) => ({
        trip_id: tripId,
        user_id: userId,
        latitude: point.latitude,
        longitude: point.longitude,
        accuracy: point.accuracy ?? null,
        recorded_at: new Date(point.recorded_at).toISOString(),
      })),
    );
    if (error) {
      // Keep the points so a later flush can retry them.
      buffer.current = [...pending, ...buffer.current];
    }
  }, [tripId, userId]);

  const stop = useCallback(() => {
    if (watchId.current != null && typeof navigator !== "undefined") {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    if (flushTimer.current) {
      clearInterval(flushTimer.current);
      flushTimer.current = null;
    }
    void flush();
    setStatus((prev) => (prev === "tracking" ? "idle" : prev));
  }, [flush]);

  const start = useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setStatus("unavailable");
      setMessage("This device or browser can't share its location.");
      return;
    }
    if (watchId.current != null) return;

    setStatus("requesting");
    setMessage(null);

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        setStatus("tracking");
        const point: TrackPoint = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          recorded_at: position.timestamp,
        };
        setAccuracy(position.coords.accuracy ?? null);
        setLastFix(point);

        const { accept, distanceKm: step } = isPlausibleStep(lastAccepted.current, point);
        if (!accept) return;
        lastAccepted.current = point;
        buffer.current.push(point);
        if (step > 0) setDistanceKm((prev) => prev + step);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setStatus("denied");
          setMessage("Location permission was refused, so distance can't be recorded.");
        } else {
          setStatus("error");
          setMessage("No GPS signal right now. Recording will resume when the signal returns.");
        }
      },
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 30_000 },
    );

    flushTimer.current = setInterval(() => void flush(), FLUSH_MS);
  }, [flush]);

  useEffect(() => () => stop(), [stop]);

  return { status, distanceKm, lastFix, accuracy, message, start, stop, flush };
}
