import { Link, type LinkProps } from "@tanstack/react-router";
import type { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: { label: string; to: NonNullable<LinkProps["to"]> };
  children?: ReactNode;
}

export function SectionHeader({ title, description, action, children }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold md:text-2xl">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && (
        <Link
          to={action.to}
          className="shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {action.label}
        </Link>
      )}
      {children}
    </div>
  );
}
