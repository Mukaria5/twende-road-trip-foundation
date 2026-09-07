import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/twende/app-shell";
import { ExploreScreen } from "@/components/twende/explore-screen";

const title = "Explore Kenya by road — TWENDE";
const description =
  "Browse featured Kenyan road trips by category and region, from Rift Valley escarpments to the coast.";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: ExplorePage,
});

function ExplorePage() {
  return (
    <AppShell>
      <ExploreScreen />
    </AppShell>
  );
}
