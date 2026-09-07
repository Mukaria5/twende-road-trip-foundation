interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
}

export function PageHeader({ title, description, eyebrow }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {eyebrow && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {eyebrow}
        </p>
      )}
      <h1 className="text-3xl md:text-4xl">{title}</h1>
      {description && (
        <p className="mt-2 max-w-xl text-sm text-muted-foreground md:text-base">{description}</p>
      )}
    </div>
  );
}
