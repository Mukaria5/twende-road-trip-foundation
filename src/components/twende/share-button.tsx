import { useState } from "react";
import { Check, Share2 } from "lucide-react";

export function ShareButton({ title, text }: { title: string; text?: string | undefined }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (!url) return;
    const shareData = { title, text: text ?? title, url };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // user dismissed the sheet — fall through to copying
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleShare()}
      className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
    >
      {copied ? (
        <Check className="size-4" strokeWidth={1.75} aria-hidden />
      ) : (
        <Share2 className="size-4" strokeWidth={1.75} aria-hidden />
      )}
      {copied ? "Link copied" : "Share"}
    </button>
  );
}
