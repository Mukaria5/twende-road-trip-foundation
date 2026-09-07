import { cn } from "@/lib/utils";

interface CategoryChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export function CategoryChip({ label, active = false, onClick }: CategoryChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent",
      )}
    >
      {label}
    </button>
  );
}
