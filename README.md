# Ride Efficiency — Frontend

Vue 3 + Vite web dashboard for the Ride Efficiency platform. It consumes the JSON API
exposed by [`ride-efficiency-api`](https://github.com/julioserpone/ride-efficiency-api)
and renders shift profitability, kilometres, fuel cost and net earnings for gig-economy
drivers.

> The mobile app lives in a separate repository, `ride-efficiency-mobile` (React Native),
> and consumes the same API.

## Stack

- Vue 3 (script setup, TypeScript) + Vite
- PrimeVue 4 (Aura theme) + Tailwind CSS 4
- ApexCharts for trends, Pinia for auth state, Vue Router with token guards
- Axios client with a bearer-token interceptor
- Vitest for unit tests, ESLint + Prettier for style

## Design system — "Slate Focus"

A minimalist dashboard: generous whitespace, flat cards, 8px radii and a single accent
colour. Colour is reserved for data, never decoration.

| Token | Value | Use |
| --- | --- | --- |
| `--color-surface` | `#ffffff` | Cards, header, sidebar |
| `--color-canvas` | `#f8fafc` | App background |
| `--color-ink` | `#0f172a` | Primary text |
| `--color-ink-muted` | `#64748b` | Labels, secondary text |
| `--color-line` | `#e2e8f0` | 1px borders |
| `--color-profit` | `#10b981` | Profitable, accent |
| `--color-neutral` | `#f59e0b` | Neutral, fuel cost |
| `--color-loss` | `#ef4444` | Loss |

Layout conventions: a 240px sidebar collapsing to 64px with a 3px emerald bar marking
the active item; a 56px sticky header; KPI cards with a small muted label above a large
tabular number; tables with a thin bottom border per row and no zebra striping.

## Getting started

```bash
npm install
cp .env.example .env     # point VITE_API_URL at your API
npm run dev              # http://localhost:5173
```

The API must be running and its `CORS_ALLOWED_ORIGINS` must include
`http://localhost:5173`.

## Authentication

Signing in calls `POST /api/v1/auth/token` with email, password and a device name. The
returned bearer token is stored in `localStorage` and attached to every request by the
Axios interceptor. A `401` clears the token and the router guard redirects to `/login`.
Signing out calls `DELETE /api/v1/auth/token` so the token is revoked server-side.

## Screens

| Route | Purpose |
| --- | --- |
| `/login` | Token issuance form |
| `/` | Overview: KPI cards, weekly trend, km chart, recent shifts |
| `/shifts` | Full shift history with per-platform earnings |
| `/invoices` | Fuel invoices and their OCR processing state |

## Scripts

```bash
npm run dev          # dev server
npm run build        # type-check + production build
npm run test         # unit tests (Vitest)
npm run lint         # ESLint --fix
npm run format       # Prettier
npm run types:check  # vue-tsc
```
