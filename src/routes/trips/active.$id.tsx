import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Camera, MapPin, NotebookPen, Timer } from "lucide-react";

import { AppShell } from "@/components/twende/app-shell";
import { MapPlaceholder } from "@/components/twende/map-placeholder";
import { SectionHeader } from "@/components/twende/section-header";

export const Route = createFileRoute("/trips/active/$id")({
  head: () => ({
    meta: [
      { title: "Active trip — TWENDE" },
      { name: "description", content: "Your trip is saved and ready for the road." },
      { property: "og:title", content: "Active trip — TWENDE" },
      { property: "og:description", content: "Your trip is saved and ready for the road." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ActiveTripPage,
});

const upcoming = [
  {
    icon: MapPin,
    title: "Live location",
    body: "Following your position along the route arrives in the driving phase.",
  },
  {
    icon: Timer,
    title: "Distance & time driven",
    body: "Actual distance and duration will be recorded once tracking is built.",
  },
  {
    icon: Camera,
    title: "Photos along the way",
    body: "Capturing photos at stops will attach them to this trip.",
  },
  {
    icon: NotebookPen,
    title: "Trip notes",
    body: "Notes written on the road will be saved to your trip record.",
  },
];

function ActiveTripPage() {
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

      <h1 className="text-3xl md:text-4xl">Trip saved</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Your plan is stored with its distance, fuel and budget estimates. Live trip recording is
        built in the next phase — nothing is being tracked yet.
      </p>

      <div className="mt-8 space-y-10">
        <section>
          <SectionHeader title="Trip map" description="Coming in the driving phase." />
          <MapPlaceholder label="Live route view" />
        </section>

        <section>
          <SectionHeader title="What comes next" />
          <div className="grid gap-3 sm:grid-cols-2">
            {upcoming.map(({ icon: Icon, title, body }) => (
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

        <Link
          to="/trips/$id"
          params={{ id }}
          className="inline-flex items-center justify-center rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
        >
          View trip record
        </Link>
      </div>
    </AppShell>
  );
}
