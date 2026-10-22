interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
}

/** Compact, app-style page title block. */
export function PageHeader({ title, description, eyebrow }: PageHeaderProps) {
  return (
    <div className="mb-5">
      {eyebrow && (
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {eyebrow}
        </p>
      )}
      <h1 className="text-2xl md:text-3xl">{title}</h1>
      {description && (
        <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
