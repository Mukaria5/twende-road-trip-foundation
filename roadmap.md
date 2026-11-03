# Roadmap

## In progress: Phase 2 — Route Calculation & Seamless Trip Planning (uploaded brief, Nov 2 2026)

Decisions confirmed with user: OSRM demo server as the routing provider (no key,
server-side proxy); a dedicated custom planner path reusing the existing planner;
curated routes keep their reviewed distance estimates.

- [ ] Migration: trip route fields (start/destination names + coords, waypoints,
  route distance/duration, selected route index) on `trips`
- [ ] OSRM routing server function (route + alternatives, typed errors)
- [ ] Map screen: start → destination selection flow, location cards, GPS start,
  intermediate stops, "Plan This Trip"
- [ ] Route polyline + alternatives on the map, bounds fitting, option selector
- [ ] `/plan` custom planner reusing the existing planner (real route distance)
- [ ] Trip persistence of route details; trip detail shows planned route
- [ ] Acceptance tests (selection flow, planner prefill, real route, budgets,
  layouts) + typecheck + production build

## Done: Phase 1 — Interactive OpenStreetMap (Oct 22 2026)

- [x] Leaflet map, provider config, server-side Nominatim geocoder
- [x] `/map`: debounced search, results sheet (outside-click/Escape dismissal),
  one-shot geolocation, dropped pins, tile loading/failure states, route links
- [x] Sonner `<Toaster />` mounted; mobile flow verified, no console errors;
  production build OK

