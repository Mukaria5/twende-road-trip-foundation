import { Link } from "@tanstack/react-router";

interface DestinationCardProps {
  name: string;
  image: string;
  caption?: string;
  to?: string;
}

export function DestinationCard({ name, image, caption, to = "/routes" }: DestinationCardProps) {
  return (
    <Link
      to={to}
      className="group relative block overflow-hidden rounded-2xl border border-border"
    >
      <div className="aspect-[4/5] bg-muted sm:aspect-[3/4]">
        <img
          src={image}
          alt={name}
          loading="lazy"
          width={1280}
          height={853}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-overlay p-3">
        <p className="text-sm font-semibold text-primary-foreground">{name}</p>
        {caption && <p className="text-xs text-primary-foreground/80">{caption}</p>}
      </div>
    </Link>
  );
}
