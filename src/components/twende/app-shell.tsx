import { Link } from "@tanstack/react-router";
import { Compass, Map as MapIcon, MapPinned, Route as RouteIcon, Settings, Users, User } from "lucide-react";
import type { ReactNode } from "react";

import { BottomNavigation } from "./bottom-navigation";
import { cn } from "@/lib/utils";

const primaryItems = [
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/map", label: "Map", icon: MapIcon },
  { to: "/trips", label: "Trips", icon: MapPinned },
  { to: "/community", label: "Community", icon: Users },
  { to: "/profile", label: "Profile", icon: User },
] as const;

/** Secondary destinations live in the desktop sidebar only — not in the mobile bottom bar. */
const sidebarSecondaryItems = [
  { to: "/routes", label: "Road trips", icon: RouteIcon },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

interface AppShellProps {
  children: ReactNode;
  /** Hides all chrome for immersive screens that render their own header, like the active-trip recorder. */
  bare?: boolean;
  className?: string;
}

/**
 * App-style shell: a compact mobile header with persistent bottom navigation,
 * and a desktop icon sidebar. Secondary screens keep their in-page back links.
 */
export function AppShell({ children, bare = false, className }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background md:flex">
      {!bare && <DesktopSidebar />}

      <div className="min-w-0 flex-1">
        {!bare && (
          <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur md:hidden">
            <div className="flex h-13 items-center justify-between px-4 py-3">
              <Link to="/explore" className="shrink-0" aria-label="TWENDE home">
                <Wordmark size="sm" />
              </Link>
              <Link
                to="/settings"
                aria-label="Settings"
                className="flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Settings className="size-5" strokeWidth={1.75} />
              </Link>
            </div>
          </header>
        )}

        <main className={cn("mx-auto max-w-5xl px-4 pb-28 pt-5 md:pb-16 md:pt-10", className)}>
          {children}
        </main>

        {!bare && <BottomNavigation />}
      </div>
    </div>
  );
}

/** TWENDE road-marker glyph, used as the sidebar home mark. */
function SidebarMark() {
  return (
    <Link
      to="/explore"
      aria-label="TWENDE home"
      className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl transition-colors hover:bg-muted"
    >
      <span aria-hidden className="flex h-4 w-7 items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        <span className="h-[3px] flex-1 rounded-full bg-primary/45" />
      </span>
    </Link>
  );
}

function DesktopSidebar() {
  return (
    <aside
      aria-label="Primary"
      className="sticky top-0 z-30 hidden h-screen w-[76px] shrink-0 flex-col items-center border-r border-border bg-sidebar py-4 md:flex"
    >
      <SidebarMark />
      <nav className="flex w-full flex-col items-stretch gap-1 px-2">
        {primaryItems.map(({ to, label, icon: Icon }) => (
          <SidebarItem key={to} to={to} label={label} icon={Icon} />
        ))}
        <div className="my-2 h-px w-full bg-border" aria-hidden />
        {sidebarSecondaryItems.map(({ to, label, icon: Icon }) => (
          <SidebarItem key={to} to={to} label={label} icon={Icon} />
        ))}
      </nav>
    </aside>
  );
}

function SidebarItem({
  to,
  label,
  icon: Icon,
}: {
  to: (typeof primaryItems)[number]["to"] | (typeof sidebarSecondaryItems)[number]["to"];
  label: string;
  icon: typeof Compass;
}) {
  return (
    <Link
      to={to}
      activeProps={{ className: "bg-accent text-accent-foreground" }}
      inactiveProps={{ className: "text-muted-foreground hover:bg-muted hover:text-foreground" }}
      className="flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium transition-colors"
    >
      <Icon className="size-5" strokeWidth={1.75} aria-hidden />
      {label}
    </Link>
  );
}

// Imported late to keep the import list tidy for the mobile header.
import { Wordmark } from "./wordmark";
