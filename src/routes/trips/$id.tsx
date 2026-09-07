import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Camera, Fuel, NotebookPen, Route as RouteIcon } from "lucide-react";

import { AppShell } from "@/components/twende/app-shell";
import { MapPlaceholder } from "@/components/twende/map-placeholder";
import { SectionHeader } from "@/components/twende/section-header";

export const Route = createFileRoute("/trips/$id")({
  head: () => ({
    meta: [
      { title: "Trip record — TWENDE" },
      { name: "description", content: "A recorded Kenyan road trip and its details." },
      { property: "og:title", content: "Trip record — TWENDE" },
      {
        property: "og:description",
        content: "A recorded Kenyan road trip and its details.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TripDetailPage,
});

const sections = [
  {
    icon: RouteIcon,
    title: "Route & distance",
    body: "The route driven, actual distance and duration will be summarised here.",
  },
  {
    icon: Fuel,
    title: "Fuel used",
    body: "Estimated and actual fuel, plus cost, once vehicle fuel data is recorded.",
  },
  {
    icon: Camera,
    title: "Photos",
    body: "Photos captured along the way will be attached to the trip.",
  },
  {
    icon: NotebookPen,
    title: "Notes",
    body: "Your own notes about the drive, the stops and the conditions.",
  },
];

function TripDetailPage() {
  const { id } = Route.useParams();

  return (
    <AppShell>
      <Link
        to="/trips"
        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
        My trips
      </Link>

      <h1 className="text-3xl md:text-4xl">Trip record</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Trip <span className="font-mono text-xs">{id}</span> — recording and playback are built in
        a later phase.
      </p>

      <div className="mt-8 space-y-10">
        <section>
          <SectionHeader title="Trip map" description="Coming in a later phase." />
          <MapPlaceholder label="Recorded route" />
        </section>

        <section>
          <SectionHeader title="Trip details" />
          <div className="grid gap-3 sm:grid-cols-2">
            {sections.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-2xl border border-dashed border-border bg-card p-5"
              >
                <Icon className="size-5 text-muted-foreground" strokeWidth={1.5} aria-hidden />
                <p className="mt-3 font-medium">{title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
