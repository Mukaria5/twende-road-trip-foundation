import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { Wordmark } from "@/components/twende/wordmark";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";

const title = "Sign in — TWENDE";
const description = "Sign in to TWENDE to save routes, record trips and keep your travel memories.";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

const copy: Record<Mode, { heading: string; sub: string; cta: string }> = {
  signin: {
    heading: "Welcome back",
    sub: "Sign in to pick up where the road left off.",
    cta: "Sign in",
  },
  signup: {
    heading: "Create your account",
    sub: "Your next Kenyan road trip starts here.",
    cta: "Create account",
  },
  forgot: {
    heading: "Reset your password",
    sub: "We'll email you a link to set a new password.",
    cta: "Send reset link",
  },
};

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useSession();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) void navigate({ to: "/explore", replace: true });
  }, [loading, user, navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      if (mode === "signin") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        void navigate({ to: "/explore", replace: true });
      } else if (mode === "signup") {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (err) throw err;
        if (!data.session) {
          setNotice("Check your email to confirm your account, then sign in.");
        }
      } else {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (err) throw err;
        setNotice("If that email is registered, a reset link is on its way.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const text = copy[mode];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="px-5 pt-8">
        <Link to="/explore" className="inline-block">
          <Wordmark />
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-10">
        <h1 className="text-3xl text-foreground">{text.heading}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{text.sub}</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-12 w-full rounded-xl border border-input bg-card px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring"
            />
          </div>

          {mode !== "forgot" && (
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-12 w-full rounded-xl border border-input bg-card px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring"
              />
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
          {notice && <p className="text-sm text-forest">{notice}</p>}

          <button
            type="submit"
            disabled={busy}
            className={cn(
              "inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-opacity",
              busy && "opacity-70",
            )}
          >
            {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {text.cta}
          </button>
        </form>

        <div className="mt-6 space-y-2 text-sm">
          {mode === "signin" && (
            <>
              <button
                type="button"
                className="text-muted-foreground underline-offset-4 hover:underline"
                onClick={() => setMode("forgot")}
              >
                Forgot your password?
              </button>
              <p className="text-muted-foreground">
                New to TWENDE?{" "}
                <button
                  type="button"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                  onClick={() => setMode("signup")}
                >
                  Create an account
                </button>
              </p>
            </>
          )}
          {mode !== "signin" && (
            <button
              type="button"
              className="text-muted-foreground underline-offset-4 hover:underline"
              onClick={() => setMode("signin")}
            >
              Back to sign in
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
