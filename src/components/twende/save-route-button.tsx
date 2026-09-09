import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Bookmark, BookmarkCheck } from "lucide-react";

import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { savedRouteQuery } from "@/lib/twende/queries";
import { cn } from "@/lib/utils";

export function SaveRouteButton({ routeId }: { routeId: string }) {
  const { user, loading } = useSession();
  const queryClient = useQueryClient();
  const { data: saved } = useQuery(savedRouteQuery(user?.id ?? null, routeId));

  const toggle = useMutation({
    mutationFn: async () => {
      if (!user) return;
      if (saved) {
        const { error } = await supabase
          .from("saved_routes")
          .delete()
          .eq("user_id", user.id)
          .eq("route_id", routeId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("saved_routes")
          .insert({ user_id: user.id, route_id: routeId });
        if (error) throw error;
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["saved-route", user?.id ?? null, routeId] }),
  });

  if (loading) return null;

  if (!user) {
    return (
      <Link
        to="/auth"
        className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
      >
        <Bookmark className="size-4" strokeWidth={1.75} aria-hidden />
        Sign in to save
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => toggle.mutate()}
      disabled={toggle.isPending}
      aria-pressed={Boolean(saved)}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60",
        saved ? "border-primary bg-accent text-foreground" : "border-border hover:bg-muted",
      )}
    >
      {saved ? (
        <BookmarkCheck className="size-4" strokeWidth={1.75} aria-hidden />
      ) : (
        <Bookmark className="size-4" strokeWidth={1.75} aria-hidden />
      )}
      {saved ? "Saved" : "Save route"}
    </button>
  );
}
