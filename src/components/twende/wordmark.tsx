import { cn } from "@/lib/utils";

interface WordmarkProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-4xl sm:text-5xl",
};

/** TWENDE wordmark — a dotted road marker replaces the crossbar of the E. */
export function Wordmark({ className, size = "md" }: WordmarkProps) {
  return (
    <span className={cn("wordmark inline-flex items-center gap-2", sizes[size], className)}>
      <span aria-hidden className="inline-flex h-1.5 w-6 items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        <span className="h-[3px] flex-1 rounded-full bg-primary/45" />
      </span>
      TWENDE
    </span>
  );
}
