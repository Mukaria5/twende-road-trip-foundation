# Roadmap

## In progress: Phase 1 — Interactive OpenStreetMap (uploaded brief, Oct 22 2026)

- [x] Install Leaflet / React Leaflet, add provider config (`map-providers.ts`) and
  replaceable server-side Nominatim geocoder (`geocode.functions.ts`)
- [x] Real `/map` screen: debounced place search, results sheet, one-shot opt-in
  geolocation, coordinate-only dropped pins, selected-place card, tile
  loading/failure notices, curated route links
- [x] Search results dismissal: click/tap outside and Escape both close the sheet;
  a new query reopens it (results can no longer cover the location control)
- [x] Mount app-wide Sonner `<Toaster />` in `src/routes/__root.tsx`
- [x] Verify: mobile (390px) flow — search → results → dismissal (outside + Escape)
  → place select → pin drop → 18/18 tiles loaded, no console errors
- [x] Production build check — build OK (Nov 2 2026)

## Done: App-style transformation (uploaded brief, Oct 22 2026)

- [x] New app shell: compact mobile header, 5-destination bottom nav, desktop icon sidebar
- [x] Bottom navigation: Explore, Map, Trips, Community, Profile
- [x] Honest `/map` placeholder (now superseded by the real map) and `/community` intro state
- [x] Compact PageHeader and Explore spacing (app-like density)
- [x] Route detail: live "Ready to drive?" planner CTA replacing the stale placeholder
- [x] Full trip-recorder E2E (tests/e2e_trip_flow.py): plan → start → GPS distance →
  stop/note/fuel/photo → finish → record page → My Trips. Passing.
- [x] Cleaned up test trips from repeated E2E runs (user's saved route untouched)
