import { Link } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import type { ReactNode } from "react";

import { BottomNavigation } from "./bottom-navigation";
import { Wordmark } from "./wordmark";
import { cn } from "@/lib/utils";

const desktopLinks = [
  { to: "/explore", label: "Explore" },
  { to: "/routes", label: "Routes" },
  { to: "/trips", label: "Trips" },
  { to: "/profile", label: "Profile" },
] as const;

interface AppShellProps {
  children: ReactNode;
  /** Hides the top bar for immersive pages that render their own header. */
  bare?: boolean;
  className?: string;
}

export function AppShell({ children, bare = false, className }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      {!bare && (
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 md:h-16">
            <Link to="/explore" className="shrink-0">
              <Wordmark />
            </Link>
            <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
              {desktopLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  activeProps={{ className: "text-foreground" }}
                  inactiveProps={{ className: "text-muted-foreground" }}
                  className="text-sm font-medium transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <Link
              to="/settings"
              aria-label="Settings"
              className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Settings className="size-5" strokeWidth={1.75} />
            </Link>
          </div>
        </header>
      )}

      <main className={cn("mx-auto max-w-5xl px-4 pb-28 pt-6 md:pb-16 md:pt-10", className)}>
        {children}
      </main>

      <BottomNavigation />
    </div>
  );
}
