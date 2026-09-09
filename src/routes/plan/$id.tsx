import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, Fuel, Route as RouteIcon, Wallet } from "lucide-react";

import { AppShell } from "@/components/twende/app-shell";
import { PageHeader } from "@/components/twende/page-header";

export const Route = createFileRoute("/plan/$id")({
  head: () => ({
    meta: [
      { title: "Plan your trip — TWENDE" },
      {
        name: "description",
        content: "Trip planning for Kenyan road trips: dates, vehicle, fuel and budget estimates.",
      },
      { property: "og:title", content: "Plan your trip — TWENDE" },
      {
        property: "og:description",
        content: "Trip planning for Kenyan road trips: dates, vehicle, fuel and budget estimates.",
      },
    ],
  }),
  component: PlanTripPage,
});

const ITEMS = [
  {
    icon: CalendarDays,
    title: "Dates & travellers",
    body: "Pick your travel dates and who's coming along.",
  },
  {
    icon: RouteIcon,
    title: "Stops & detours",
    body: "Reorder curated stops and add your own along the way.",
  },
  {
    icon: Fuel,
    title: "Fuel estimate",
    body: "Uses your saved vehicle's consumption to estimate litres needed.",
  },
  {
    icon: Wallet,
    title: "Trip budget",
    body: "Fuel, park fees and overnight stays combined into one estimate.",
  },
];

function PlanTripPage() {
  const { id } = Route.useParams();

  return (
    <AppShell>
      <Link
        to="/routes/$id"
        params={{ id }}
        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
        Back to route
      </Link>

      <PageHeader
        title="Plan this trip"
        description="Trip planning is coming in a later phase. Here's what it will cover."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {ITEMS.map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-dashed border-border bg-card p-5"
          >
            <item.icon className="size-5 text-muted-foreground" strokeWidth={1.5} aria-hidden />
            <p className="mt-3 font-medium">{item.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
          </div>
        ))}
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        In the meantime you can save this route to your profile and come back to it later.
      </p>
    </AppShell>
  );
}
