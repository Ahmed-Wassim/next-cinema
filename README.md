# Cinema

Cinema is a multi-surface movie booking and tenant dashboard project built with Next.js, React, TypeScript, Tailwind CSS, and a Laravel-style backend API.

This repository is intentionally a vibe coded project.

That means the product was shaped quickly, iteratively, and visually, with a strong bias toward momentum, interface feel, and real user flows over ceremony-heavy architecture upfront. It is not a throwaway prototype, but it is also not pretending to be a rigid enterprise starter. The codebase favors shipping, polishing, and evolving in place.

## What This Project Includes

The app currently has two major product surfaces:

1. Public cinema experience
2. Tenant dashboard experience

The public side lets customers browse movies, inspect grouped showtimes, choose seats, create bookings, and continue into checkout.

The dashboard side gives cinema operators a back-office control panel for managing branches, halls, movies, showtimes, seats, price tiers, and payments.

## Core Product Features

### Public booking flow

- Browse now-playing or featured movies from the tenant API
- View individual movie detail pages
- Display grouped showtimes by branch and date
- Select a specific showtime
- Fetch the seat map for the selected showtime
- Reserve seats before checkout
- Create a booking with customer details
- Initiate checkout for a booking
- View booking confirmation / success screen
- Display ticket-style booking summaries
- Persist and restore booking context where helpful

### Tenant dashboard

- Dashboard shell with animated sidebar navigation
- Branch management
- Hall management
- Movie management
- Showtime management
- Price tier management
- Seat management
- Seat builder flow
- Seat layout flow
- Seat designer canvas flow
- Payments overview page
- Loading states, empty states, and inline feedback patterns across admin pages

### UX and visual features

- Motion-driven UI using Framer Motion
- Modern card/table/dashboard styling
- Custom dashboard transitions
- Interactive showtime picker
- Interactive seat map and designer canvas
- Responsive layouts for customer and admin experiences
- Reusable UI components built on Radix primitives and local design utilities

## Why It Is Described As "Vibe Coded"

This project deserves the label in a positive sense:

- Product direction is driven by shipping real screens quickly
- UI polish matters as much as raw CRUD completeness
- Features were layered in through active iteration instead of heavyweight upfront planning
- The codebase mixes practical structure with rapid evolution
- It prioritizes visible user value and momentum

If you open the repo, you will see that in practice:

- there are custom flows instead of starter-template pages
- the seat designer and booking journey received meaningful product attention
- admin pages are optimized for use, not just scaffolding
- there is room for more refactoring, but the product is already very tangible

## Tech Stack

- Next.js `16.2.1`
- React `19.2.4`
- TypeScript
- Tailwind CSS `v4`
- Framer Motion
- Axios
- Radix UI primitives
- Lucide icons
- Laravel-style JSON API backend

## App Structure

High-level route groups:

- `app/(home)` for the public cinema experience
- `app/(auth)` for login and registration
- `app/(dashboard)` for tenant/admin tooling

Important directories:

- `app/` application routes and layouts
- `components/` reusable UI and feature components
- `components/home/` public booking flow components
- `components/ui/` local UI primitives
- `services/` API integration layer
- `lib/` shared helpers and API clients
- `types/` shared TypeScript models
- `public/` static assets

## Implemented Pages and Modules

### Public routes

- `/`
- `/movies`
- `/movies/[id]`
- `/checkout`
- `/booking/[id]/success`
- `/login`
- `/register`

### Dashboard routes

- `/dashboard/branches`
- `/dashboard/halls`
- `/dashboard/price-tiers`
- `/dashboard/seats`
- `/dashboard/seats/builder`
- `/dashboard/seats/layout`
- `/dashboard/seats/designer`
- `/dashboard/movies`
- `/dashboard/movies/[id]`
- `/dashboard/showtimes`
- `/dashboard/payments`

## Feature Breakdown

### Movie browsing

- Fetches movie listings from the tenant API
- Renders movie cards and detail views
- Supports richer metadata such as poster, backdrop, overview, language, genres, and rating when available

### Showtime selection

- Uses grouped showtime data returned by the movie-details endpoint
- Organizes showtimes by branch and date
- Lets users pick a specific screening slot
- Validates persisted showtime selection against the active movie's real showtime IDs

### Seat selection

- Loads seats for a chosen showtime
- Shows availability status
- Supports max selection constraints
- Calculates live totals from seat pricing
- Carries selected seats into checkout

### Checkout and booking

- Reserves seats before redirecting to checkout
- Creates a booking payload with customer details
- Starts payment/checkout initiation
- Displays booking confirmation after success

### Admin operations

- CRUD-style data workflows for branches, halls, tiers, movies, and showtimes
- Payment ledger page for finance/ops visibility
- Seat layout tools for modeling cinema halls
- Dedicated seat designer canvas for more custom seating configurations

## API Integration

The project talks to two API surfaces:

### Dashboard API

Used for tenant management pages through Axios.

Configured in:

- `lib/api.ts`

Default base URL:

- `http://foo.cinema.test/api/dashboard`

Expected env override:

- `NEXT_PUBLIC_API_URL`

### Home / tenant storefront API

Used for the public movie and booking experience through a custom fetch wrapper.

Configured in:

- `lib/home-api.ts`

Default base URL:

- `http://foo.cinema.test/api`

Expected env override:

- `NEXT_PUBLIC_TENANT_URL`

## Environment Variables

Create a local environment file such as `.env.local` and define the API endpoints your backend exposes.

Recommended variables:

```env
NEXT_PUBLIC_API_URL=http://foo.cinema.test/api/dashboard
NEXT_PUBLIC_TENANT_URL=http://foo.cinema.test/api
```

Adjust those values to your local, staging, or production backend.

## Local Setup

### Requirements

- Node.js 20+ recommended
- npm
- A running backend that exposes the expected dashboard and tenant endpoints

### Install dependencies

```bash
npm install
```

### Configure environment variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://your-backend.test/api/dashboard
NEXT_PUBLIC_TENANT_URL=http://your-backend.test/api
```

### Start development server

```bash
npm run dev
```

Open:

- `http://localhost:3000`

## Production Commands

Build the app:

```bash
npm run build
```

Start the production server:

```bash
npm run start
```

Lint the code:

```bash
npm run lint
```

On some Windows PowerShell setups, `npm` may be blocked by execution policy. In that case, this works too:

```bash
npm.cmd run lint
```

## Development Notes

### Next.js warning

This repository includes an agent note that this is not the older Next.js behavior many tools assume.

The project uses:

- Next.js `16`
- App Router
- React `19`

So if you are extending the codebase, prefer reading local framework docs in:

- `node_modules/next/dist/docs/`

before making assumptions based on older App Router conventions.

### Frontend style

The codebase leans into:

- tactile dashboard surfaces
- strong gradients and motion
- richer booking interactions
- custom flows instead of plain templates

If you contribute new UI, keep it aligned with the existing visual direction instead of dropping in generic boilerplate screens.

## Important Components

Some particularly important files in the project:

- `components/dashboard-shell.tsx`
- `components/dashboard-nav.tsx`
- `components/home/MovieBookingFlow.tsx`
- `components/home/ShowtimePicker.tsx`
- `components/home/SeatMap.tsx`
- `components/seat-designer-canvas.tsx`
- `components/seat-designer-sidebar.tsx`
- `components/seat-designer-toolbar.tsx`

These are good starting points if you want to understand the product experience quickly.

## Services Layer

The `services/` directory is the application-facing API layer.

Current service modules:

- `authService.ts`
- `branchService.ts`
- `hallService.ts`
- `homeService.ts`
- `movieService.ts`
- `paymentService.ts`
- `priceTierService.ts`
- `seatService.ts`
- `showtimeService.ts`

This keeps route components thinner and makes backend integration easier to evolve.

## Data Modeling

Shared TypeScript models live in `types/`.

These include models for:

- movies
- halls
- branches
- seats
- showtimes
- pricing tiers
- home booking flows
- payments
- pagination

As the backend evolves, updating these shared types helps keep the UI changes predictable.

## Current Strengths

- Real end-to-end user journey exists
- Dashboard is not just placeholder admin CRUD
- Seat tooling is a meaningful differentiator
- Clear split between public and tenant surfaces
- Good visual identity and motion work
- Fast iteration path for adding new modules

## Current Tradeoffs

Because this is a vibe coded project, some tradeoffs are expected:

- some pages still have lint warnings unrelated to current features
- architecture can be tightened over time
- advanced testing coverage is not yet documented here
- backend contracts should continue to be normalized as the product grows

These are normal next steps, not signs that the project is weak.

## Suggested Next Improvements

- Add formal test coverage for booking and seat flows
- Add role/permission handling on dashboard modules
- Add filters and search to payment and admin tables
- Add richer analytics to dashboard landing pages
- Normalize all backend DTO typing for localized fields
- Improve empty/error state consistency further
- Add deployment documentation for staging and production

## Who This Repo Is For

This repo is a strong fit for:

- rapid product iteration
- internal cinema dashboard tooling
- movie booking UX experimentation
- teams that want to ship first and refine fast
- developers comfortable improving a live evolving codebase

## Contributing Mindset

If you extend the project:

- preserve the visual style
- keep momentum high
- prefer practical improvements over speculative abstraction
- refactor when it creates clarity, not just neatness
- document backend assumptions when adding new integrations

## Summary

Cinema is a modern booking-and-operations app with a public ticketing journey and a tenant dashboard in one codebase.

It is proudly vibe coded: fast-moving, visually expressive, product-focused, and already packed with real functionality. The structure is strong enough to keep building on, while still flexible enough to evolve quickly.
