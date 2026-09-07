import amboseli from "@/assets/route-amboseli.jpg";
import coast from "@/assets/route-coast.jpg";
import highlands from "@/assets/route-highlands.jpg";
import naivasha from "@/assets/route-naivasha.jpg";
import nakuru from "@/assets/route-nakuru.jpg";
import nanyuki from "@/assets/route-nanyuki.jpg";

/**
 * Curated imagery per region. Once routes carry their own `hero_image` from
 * the database/CMS, that value wins and this map becomes the fallback.
 */
const byRegion: Record<string, string> = {
  "Rift Valley": naivasha,
  "Mount Kenya": nanyuki,
  "Southern Kenya": amboseli,
  "South Rift": amboseli,
  Coast: coast,
  Central: highlands,
};

const bySlug: Record<string, string> = {
  "nairobi-naivasha": naivasha,
  "nairobi-nanyuki": nanyuki,
  "nairobi-nakuru": nakuru,
  "nairobi-amboseli": amboseli,
  "mombasa-diani": coast,
  "mombasa-watamu": coast,
};

export function routeImage(route: {
  slug?: string | null;
  region?: string | null;
  hero_image?: string | null;
}): string {
  if (route.hero_image) return route.hero_image;
  if (route.slug && bySlug[route.slug]) return bySlug[route.slug];
  if (route.region && byRegion[route.region]) return byRegion[route.region];
  return naivasha;
}

export const regionImages = { naivasha, nanyuki, nakuru, amboseli, coast, highlands };
