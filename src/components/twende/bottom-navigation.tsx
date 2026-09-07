import { Link } from "@tanstack/react-router";
import { Compass, Route as RouteIcon, MapPinned, User } from "lucide-react";

const items = [
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/routes", label: "Routes", icon: RouteIcon },
  { to: "/trips", label: "Trips", icon: MapPinned },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNavigation() {
  return (
    <nav
      aria-label="Primary"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              activeProps={{ className: "text-primary" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors"
            >
              <Icon className="size-5" strokeWidth={1.75} aria-hidden />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
