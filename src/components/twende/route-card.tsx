import { Link } from "@tanstack/react-router";

import { formatRouteMeta } from "@/lib/twende/format";
import { routeImage } from "@/lib/twende/images";
import type { RouteRecord } from "@/lib/twende/types";
import { cn } from "@/lib/utils";

interface RouteCardProps {
  route: RouteRecord;
  /** Wide layout used inside horizontal carousels. */
  variant?: "default" | "compact";
}

export function RouteCard({ route, variant = "default" }: RouteCardProps) {
  return (
    <Link
      to="/routes/$id"
      params={{ id: route.slug }}
      className={cn(
        "group block overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/40",
        variant === "compact" && "w-[17rem] shrink-0",
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <img
          src={routeImage(route)}
          alt={route.name}
          loading="lazy"
          width={1280}
          height={853}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {route.region && (
          <span className="absolute left-3 top-3 rounded-full bg-card/90 px-2.5 py-1 text-[11px] font-medium text-foreground">
            {route.region}
          </span>
        )}
      </div>

      <div className="space-y-2 p-4">
        <h3 className="text-lg leading-snug">{route.name}</h3>
        <p className="text-sm font-medium text-muted-foreground">
          {formatRouteMeta(route.distance_km, route.estimated_drive_minutes)}
        </p>
        {route.category.length > 0 && (
          <p className="text-xs font-medium uppercase tracking-wide text-primary">
            {route.category.join(" · ")}
          </p>
        )}
        {route.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{route.description}</p>
        )}
      </div>
    </Link>
  );
}
