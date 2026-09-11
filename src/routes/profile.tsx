import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ChevronRight,
  Fuel,
  LogIn,
  Pencil,
  Plus,
  Settings,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/twende/app-shell";
import { EmptyState } from "@/components/twende/empty-state";
import { PageHeader } from "@/components/twende/page-header";
import { SectionHeader } from "@/components/twende/section-header";
import { StatCard } from "@/components/twende/stat-card";
import { CardSkeleton } from "@/components/twende/states";
import { VehicleCard } from "@/components/twende/vehicle-card";
import { VehicleForm } from "@/components/twende/vehicle-form";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { vehiclesQuery } from "@/lib/twende/queries";
import type { VehicleRecord } from "@/lib/twende/types";

const title = "Profile — TWENDE";
const description = "Your TWENDE profile, vehicle, fuel and travel preferences.";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, loading } = useSession();
  const { data: vehicles } = useQuery(vehiclesQuery(user?.id ?? null));

  if (loading) {
    return (
      <AppShell>
        <CardSkeleton />
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell>
        <PageHeader title="Profile" />
        <EmptyState
          icon={LogIn}
          title="Sign in to set up your profile"
          description="Your vehicle, fuel preferences and trip history are tied to your account."
          action={{ label: "Sign in", to: "/auth" }}
        />
      </AppShell>
    );
  }

  const initial = (user.email ?? "T").charAt(0).toUpperCase();

  return (
    <AppShell>
      <div className="flex items-center gap-4">
        <span className="flex size-16 items-center justify-center rounded-full bg-accent text-xl font-semibold text-accent-foreground">
          {initial}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-2xl">{user.email}</h1>
          <p className="text-sm text-muted-foreground">TWENDE traveller</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <StatCard label="Trips" value="0" />
        <StatCard label="Distance" value="0 km" />
        <StatCard label="Counties" value="0" />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Statistics start filling in once trip recording is available.
      </p>

      <section className="mt-10">
        <SectionHeader title="Vehicle" description="Used for future fuel estimates." />
        <VehicleCard vehicle={vehicles?.[0]} />
      </section>

      <section className="mt-10">
        <SectionHeader title="Preferences" />
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          <PreferenceRow
            icon={Fuel}
            label="Fuel preferences"
            hint="Fuel type and price per litre"
          />
          <PreferenceRow
            icon={SlidersHorizontal}
            label="Travel preferences"
            hint="Pace, stop types and trip length"
          />
          <PreferenceRow icon={Settings} label="Settings" hint="App and account" to="/settings" />
        </div>
      </section>
    </AppShell>
  );
}

function PreferenceRow({
  icon: Icon,
  label,
  hint,
  to,
}: {
  icon: typeof Fuel;
  label: string;
  hint: string;
  to?: "/settings";
}) {
  const content = (
    <>
      <span className="flex size-9 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Icon className="size-4" strokeWidth={1.75} aria-hidden />
      </span>
      <span className="flex-1">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
      <ChevronRight className="size-4 text-muted-foreground" strokeWidth={1.75} aria-hidden />
    </>
  );

  if (to) {
    return (
      <Link to={to} className="flex items-center gap-3 p-4 transition-colors hover:bg-muted">
        {content}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 p-4 opacity-70" aria-disabled>
      {content}
    </div>
  );
}
