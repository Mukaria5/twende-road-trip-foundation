# Twende Road Trip Foundation

Build the foundation of a production-quality mobile-first PWA called TWENDE.

TWENDE is a Kenya-first road-trip discovery, planning and trip-recording application.

Its core purpose is:

DISCOVER → PLAN → DRIVE → RECORD → REMEMBER

The app helps people discover road trips around Kenya when they don't know where to go, understand the route, estimated travel time, recommended stops and scenic views, estimate fuel requirements and trip costs, record an actual road trip, and later revisit their road-trip history.

IMPORTANT DEVELOPMENT RULE:
This is the first foundation phase of a multi-phase build. Build a strong, scalable foundation and polished UI now, but DO NOT attempt to implement every future feature. Do not create fake functionality that pretends to work. Future functionality should have clearly defined placeholders where necessary.

==================================================

PRODUCT IDENTITY
==================================================

App name:

TWENDE

Suggested tagline:

Your next Kenyan road trip starts here.

The brand should feel distinctly Kenyan without relying on stereotypical safari imagery.

Visual personality:

Modern

Premium

Minimal

Warm

Adventurous

Clean

Human

Mobile-first

The design must NOT look like a generic AI-generated SaaS dashboard.

Avoid:

Excessive gradients

Excessive glassmorphism

Neon/glowing UI

Futuristic AI aesthetics

Excessive shadows

Overly complicated dashboards

Giant decorative illustrations

Unnecessary animations

Prioritize:

Beautiful photography

Strong typography

Clean cards

Maps

Generous spacing

Clear hierarchy

Subtle animations

Natural colors inspired by Kenya, road travel and landscapes

Excellent mobile usability

The application should feel closer to a premium travel/discovery product than an administration system.

==================================================
2. RESPONSIVE DESIGN

Design mobile-first.

The primary experience should be optimized for:

Smartphone

Tablet

Desktop

The mobile layout is the priority because this application will primarily be used during road trips.

Use a bottom navigation on mobile.

Primary navigation:

Explore

Routes

Trips

Profile

Use appropriate simple line icons.

The bottom navigation should feel native to a modern mobile application.

==================================================
3. APPLICATION STRUCTURE

Create the following application routes/pages:

/

/explore

/routes

/routes/:id

/trips

/trips/:id

/profile

/settings

/auth

The route detail and trip detail pages can initially contain well-designed structural placeholders where functionality belongs in later phases.

Do not build fake GPS tracking yet.

Do not build fake AI recommendations yet.

Do not build fake live navigation yet.

==================================================
4. EXPLORE SCREEN

Create the primary Explore/Home experience.

Top section:

TWENDE logo/wordmark.

A location-aware greeting area:

"Where will the road take you?"

Supporting text:

"Discover road trips, scenic drives and unforgettable places across Kenya."

Primary search field:

"Where do you want to go?"

Below the search:

Quick category chips/cards:

Weekend

Scenic

Adventure

Nature

Coast

Photography

Family

Food & Culture

Then:

Featured Road Trips

Create polished route cards.

Example routes:

Nairobi → Naivasha
Nairobi → Nanyuki
Nairobi → Amboseli
Nairobi → Nakuru

Each route card should display:

Hero image

Route name

Distance

Approximate driving time

Trip category

Short description

Example:

"Nairobi → Naivasha"

"236 km · ~4h 30m"

"Scenic · Adventure"

Do not hardcode misleading exact road distances if a mapping provider has not yet been integrated. Structure the data so these values can later come from the route database/mapping API.

Then create:

Explore Kenya

A visually engaging section showing different destinations/regions of Kenya.

Use realistic placeholder content/data structures rather than pretending these are live recommendations.

==================================================
5. ROUTES SCREEN

Create a dedicated route discovery page.

Header:

"Road Trips"

Supporting text:

"Find your next drive across Kenya."

Include:

Search

Category filtering

Duration filtering

Distance filtering

Featured routes

Route cards should be reusable components.

Design the cards so they can later support:

Distance

Driving time

Stops

Scenic locations

Fuel estimate

Estimated trip budget

Difficulty

Best time to visit

For this phase, only display information that is actually available in the seeded data.

==================================================
6. TRIPS SCREEN

Create the "My Trips" page.

This represents the user's personal road-trip history.

For a new user, create a beautiful empty state:

"Your road trips will live here."

Supporting text:

"Start exploring Kenya and your completed journeys will appear here."

Include a clear CTA:

"Explore Routes"

Also design the structure for future trip history cards.

A completed trip will eventually contain:

Route

Date

Distance

Duration

Stops

Photos

Fuel used

Notes

Do not pretend these functions work yet.

==================================================
7. PROFILE SCREEN

Create a clean personal profile page.

Show:

User profile section

Road-trip statistics placeholders:

Trips
Distance driven
Counties explored

Then sections:

Vehicle
Fuel preferences
Travel preferences
Settings

The vehicle/fuel area should be designed with future functionality in mind because fuel estimation will be a major feature of TWENDE.

==================================================
8. AUTHENTICATION

Create the authentication UI structure for:

Sign up

Sign in

Forgot password

Continue with email

Use the project's available authentication/database infrastructure where appropriate.

Do not build unnecessary social authentication providers unless they are already configured.

Users must eventually have their own:

Profile

Vehicle settings

Trip history

Saved routes

Photos

Notes

Structure the database with user ownership in mind.

==================================================
9. DATABASE FOUNDATION

Set up a scalable database structure.

At minimum prepare the following entities/tables:

profiles

Fields should include appropriate identifiers and profile information.

vehicles

Include fields such as:

user_id

make

model

year

fuel_type

fuel_consumption_km_per_litre

fuel_tank_capacity

created_at

updated_at

The consumption field is important because it will power future fuel calculations.

routes

Include:

id

name

starting_location

destination

description

distance_km

estimated_drive_minutes

recommended_duration

category

hero_image

region

created_at

updated_at

route_stops

Include:

route_id

name

description

latitude

longitude

stop_type

recommended_duration

image

display_order

trips

Prepare fields for:

user_id

route_id

started_at

completed_at

actual_distance_km

actual_duration_minutes

estimated_fuel_litres

actual_fuel_litres

estimated_fuel_cost

actual_fuel_cost

notes

created_at

updated_at

trip_photos

Prepare:

trip_id

image_url

caption

latitude

longitude

captured_at

created_at

Use proper relationships and user ownership.

Implement appropriate row-level security/access controls where supported so users cannot access another user's private trips, profile, vehicles or photos.

==================================================
10. SEEDED ROUTE DATA

Create a small initial curated dataset to make the application feel alive.

Seed approximately 8–10 Kenyan road-trip routes.

Examples:

Nairobi → Naivasha

Nairobi → Nanyuki

Nairobi → Nakuru

Nairobi → Amboseli

Nairobi → Nyeri

Nairobi → Thika

Nairobi → Limuru

Nairobi → Maasai Mara

Mombasa → Diani

Mombasa → Watamu

Use clearly structured placeholder/seed data.

Do not fabricate detailed claims about attractions, road conditions or exact travel times.

The architecture must allow this data to later be replaced/enriched with verified route and place data.

==================================================
11. COMPONENT ARCHITECTURE

Create reusable components instead of duplicating UI.

Examples:

RouteCard

CategoryChip

DestinationCard

SectionHeader

TripCard

StatCard

BottomNavigation

SearchBar

PageHeader

EmptyState

VehicleCard

Keep components modular and maintainable.

==================================================
12. MAP FOUNDATION

Prepare the application architecture for future map integration.

The route detail page should have a dedicated map area/component.

For now, if no map provider/API key is configured, show a polished map placeholder rather than a fake interactive map.

Do not hardcode a fake map screenshot and pretend it is live.

The architecture should make it straightforward to integrate a real mapping/routing provider in a later phase.

==================================================
13. BRANDING

Create a simple TWENDE wordmark treatment.

The logo should work in:

Header

Splash/loading screen

App icon

Favicon

PWA icon

Keep it simple and recognizable at small sizes.

Do not create an overly complicated logo.

Use the text "TWENDE" prominently.

==================================================
14. PWA FOUNDATION

Prepare the application to become an installable PWA.

Set up:

Web app manifest

App name: TWENDE

Short name: TWENDE

Theme configuration

Proper viewport/mobile configuration

Icon placeholders

Splash/loading experience

Do not claim offline functionality unless it is actually implemented.

==================================================
15. PERFORMANCE

Keep the application lightweight.

Use:

Lazy loading where appropriate

Optimized images

Reusable components

Efficient database queries

Responsive layouts

Proper loading states

Avoid unnecessary dependencies.

==================================================
16. ERROR / LOADING / EMPTY STATES

Every major page should have intentional:

Loading state

Empty state

Error state

Do not leave blank white screens.

==================================================
17. CODE QUALITY

Use a clean and scalable architecture.

Requirements:

Type-safe code where applicable

Reusable components

Clear naming

No unnecessary duplicated code

No dead code

No unused imports

No fake API integrations

No hardcoded user-specific data

No exposed secrets/API keys

Environment variables for future API credentials

Do not make unrelated changes to the project.

==================================================
18. IMPORTANT SCOPE LIMIT

DO NOT implement these yet:

Live GPS tracking

Turn-by-turn navigation

AI trip planner

Live traffic

Live weather

Payments

Social network

Reviews

Chat

Booking systems

Advanced gamification

Complex admin dashboard

Those will be implemented in later phases.

==================================================
19. ACCEPTANCE CRITERIA

When finished, verify that:

The application runs without compilation errors.

All primary routes/pages load.

Mobile layout is polished.

Desktop layout remains usable.

Bottom navigation works.

Route cards use reusable components.

Seeded route data renders correctly.

Authentication structure works with the configured backend.

Database relationships are correctly structured.

User-owned data is protected.

No API keys or secrets are exposed client-side.

There are no obvious console errors.

Loading and empty states exist.

The application feels like a real product rather than a prototype dashboard.

Future phases can build on the current architecture without requiring a rewrite.

Before finishing, inspect the existing project structure and preserve anything that is already working. Do not unnecessarily replace existing configuration.

Build this foundation carefully and stop at the defined scope.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1e3e5766-98dc-480b-8a8f-cbb316e0545c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
