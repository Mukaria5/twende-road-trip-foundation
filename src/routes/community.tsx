import { createFileRoute } from "@tanstack/react-router";
import { Camera, MessageSquareHeart, Users } from "lucide-react";

import { AppShell } from "@/components/twende/app-shell";
import { EmptyState } from "@/components/twende/empty-state";
import { PageHeader } from "@/components/twende/page-header";

const title = "Community — TWENDE";
const description =
  "A place to discover road trips, stories and photos shared by fellow Kenyan travellers is on the way.";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: CommunityPage,
});

function CommunityPage() {
  return (
    <AppShell>
      <PageHeader
        title="Community"
        description="TWENDE is becoming a road-trip community, not just a route calculator."
      />

      <EmptyState
        icon={Users}
        title="Shared journeys are on the way"
        description="Soon you'll be able to discover road trips, experiences and photos shared by other travellers. Your own trips stay private in Trips until you choose to share."
        action={{ label: "Explore routes", to: "/routes" }}
      />

      <section className="mt-8">
        <h2 className="text-lg font-semibold">What's planned</h2>
        <ul className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card text-sm">
          <CommunityPlan icon={MessageSquareHeart} label="Shared road trips" hint="Publish a trip you've recorded, with your route and notes." />
          <CommunityPlan icon={Camera} label="Photo stories" hint="Turn your trip photos into stories other travellers can browse." />
          <CommunityPlan icon={Users} label="Traveller tips" hint="Real advice from people who have driven the route." />
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">
          Nothing is shared until this launches — your trips and photos are private to you.
        </p>
      </section>
    </AppShell>
  );
}

function CommunityPlan({
  icon: Icon,
  label,
  hint,
}: {
  icon: typeof Users;
  label: string;
  hint: string;
}) {
  return (
    <li className="flex items-center gap-3 p-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Icon className="size-4" strokeWidth={1.75} aria-hidden />
      </span>
      <span className="flex-1">
        <span className="block font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
    </li>
  );
}
