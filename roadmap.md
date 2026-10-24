# Roadmap

## In progress: App-style transformation (uploaded brief, Oct 22 2026)

- [x] Inspect existing layout, navigation, routes, PWA config
- [x] New app shell: compact mobile header, 5-destination bottom nav, desktop icon sidebar
- [x] Bottom navigation: Explore, Map, Trips, Community, Profile
- [x] New `/map` route: honest map-ready state + real route content links
- [x] New `/community` route: honest introductory state, no fake posts
- [x] Compact PageHeader and Explore spacing (app-like density)
- [x] Verify: pages load, no console/build errors, no horizontal overflow, trip flow E2E still passes

## Done alongside

- [x] Route detail: replaced the stale "Trip planning — arriving in a later phase" placeholder
  section with a live "Ready to drive?" planner CTA.
- [x] Full trip-recorder E2E (tests/e2e_trip_flow.py): plan → start → GPS distance →
  stop/note/fuel/photo → finish → record page → My Trips. Passing; kept for future runs.
- [x] Cleaned up all trips created by repeated E2E test runs from the test account.
