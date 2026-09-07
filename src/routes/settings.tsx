import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";

import { AppShell } from "@/components/twende/app-shell";
import { PageHeader } from "@/components/twende/page-header";
import { SectionHeader } from "@/components/twende/section-header";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";

const title = "Settings — TWENDE";
const description = "Manage your TWENDE account and app preferences.";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  }

  return (
    <AppShell>
      <PageHeader title="Settings" description="Account and app preferences." />

      <section>
        <SectionHeader title="Account" />
        <div className="rounded-2xl border border-border bg-card p-5">
          {user ? (
            <>
              <p className="text-sm text-muted-foreground">Signed in as</p>
              <p className="font-medium">{user.email}</p>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="mt-4 rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                Sign out
              </button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">You are not signed in.</p>
          )}
        </div>
      </section>

      <section className="mt-10">
        <SectionHeader title="App" />
        <dl className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card text-sm">
          <div className="flex items-center justify-between p-4">
            <dt>Units</dt>
            <dd className="text-muted-foreground">Kilometres</dd>
          </div>
          <div className="flex items-center justify-between p-4">
            <dt>Currency</dt>
            <dd className="text-muted-foreground">KES</dd>
          </div>
          <div className="flex items-center justify-between p-4">
            <dt>Version</dt>
            <dd className="text-muted-foreground">Foundation phase</dd>
          </div>
        </dl>
        <p className="mt-2 text-xs text-muted-foreground">
          Editable preferences, notifications and offline support come in later phases.
        </p>
      </section>
    </AppShell>
  );
}
