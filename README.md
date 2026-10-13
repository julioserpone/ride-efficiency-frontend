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

## Design system — "Harbor"

An easy-on-the-eyes analytics dashboard: cool, near-white surfaces, deep blue-green
text, a restrained teal brand accent and semantic colors reserved for data.

| Token                  | Value     | Use                                     |
| ---------------------- | --------- | --------------------------------------- |
| `--color-surface`      | `#ffffff` | Cards, header, sidebar                  |
| `--color-canvas`       | `#f4f7f7` | Low-glare app background                |
| `--color-ink`          | `#192c3a` | Primary text                            |
| `--color-ink-muted`    | `#5e7080` | Labels, secondary text                  |
| `--color-line`         | `#dce5e7` | Dividers and borders                    |
| `--color-brand`        | `#336b67` | Primary actions and selected navigation |
| `--color-brand-strong` | `#275753` | Hover and emphasis                      |
| `--color-brand-soft`   | `#e7f2f0` | Soft accent backgrounds                 |
| `--color-profit`       | `#1c7a65` | Positive performance                    |
| `--color-neutral`      | `#a56817` | Neutral / attention                     |
| `--color-loss`         | `#b8404d` | Negative performance                    |
| `--color-info`         | `#386f96` | Informational status                    |

Typography: Inter (or the platform sans-serif fallback) for UI, body copy and numeric
values. Tabular figures use lining/tabular numerals without switching to a visually
different monospaced font. Keep body text at 14–16px, labels at 12px or larger, and avoid
using color alone to communicate status.

Layout conventions: a 240px sidebar collapsing to 64px with a 3px teal bar marking the
active item; a 56px sticky header; KPI cards with a small muted label above a large
tabular number; 12px card radii; tables with a thin bottom border per row and no zebra
striping. Reserve semantic green, amber, red and blue for values/statuses, not decoration.
On viewports below 768px, the sidebar starts closed and opens as an overlay drawer from
the header menu button. Text, number, date, file and select form controls share a 44px
height, with a padded custom select indicator. Data-table body text is 13px and headers
are 11px, both using the interface font.

## Getting started

```bash
npm ci
cp .env.example .env     # set VITE_API_URL to the versioned API base URL
npm run dev              # http://localhost:5173
```

The API must be running and its `CORS_ALLOWED_ORIGINS` must include
`http://localhost:5173`. `VITE_*` values are bundled into browser code; never put
credentials or server-side secrets in them.

### With Docker

The repo ships a `Dockerfile` (stage `development`) and a `docker-compose.yml` that
run Vite with hot module replacement — edit a file on the host and the browser
updates, no rebuild:

```bash
npm run docker:dev       # docker compose up --build → http://localhost:5173
npm run docker:logs      # follow the Vite output
npm run docker:down      # stop and remove the container
```

Two things make it work:

- The project is bind-mounted at `/app`, while `/app/node_modules` is left to a
  named volume. The lockfile is installed with `npm ci` on Linux inside the image, so
  the host's macOS binaries never leak into the container.
- `VITE_API_URL` is passed as a process environment variable. Vite reads process values
  ahead of `.env`, so `docker-compose.yml` is the source of truth for the container
  and the local `.env` value is not used for the API URL.

Because the browser resolves `VITE_API_URL`, the default `http://localhost/api/v1` keeps
working as long as the API publishes port 80 — change `FRONTEND_PORT` in `.env` if 5173 is
taken. The container also joins the API's Docker network as
`ride-efficiency-api_sail`, so the two stacks can reach each other by name
(`laravel.test`) if you would rather call the API over the internal network. Both keys are
overridable: `API_NETWORK=<name> FRONTEND_PORT=<port> docker compose up --build`.

## Authentication

Signing in calls `POST /api/v1/auth/token` with email, password and a device name. The
returned bearer token is stored in `localStorage` and attached to every request by the
Axios interceptor. A `401` clears the token and the router guard redirects to `/login`.
Signing out calls `DELETE /api/v1/auth/token` so the token is revoked server-side.

## Screens

| Route       | Purpose                                                             |
| ----------- | ------------------------------------------------------------------- |
| `/login`    | Token issuance form                                                 |
| `/`         | Overview: KPI cards, weekly trend, km chart, recent shifts          |
| `/shifts`   | Start, complete and inspect shifts and per-platform earnings        |
| `/invoices` | Upload, review and manage fuel/electricity invoices and OCR results |
| `/fleet`    | Manage vehicle energy profiles and calculate trip profitability     |

## Scripts

```bash
npm run dev          # dev server
npm run docker:dev   # dev server in Docker (HMR)
npm run docker:logs  # follow the container's Vite output
npm run docker:down  # stop the container
npm run build        # type-check + production build
npm run test         # unit tests (Vitest)
npm run lint:check   # ESLint without modifying files
npm run format:check # Prettier without modifying files
npm run types:check  # vue-tsc
```

## Contributing and project guidance

Start with [`CONTRIBUTING.md`](CONTRIBUTING.md) for local setup, branch and
commit conventions, pull-request expectations and verification commands.
[`AGENTS.md`](AGENTS.md) provides repository-wide guidance for AI coding agents;
Vue component instructions are scoped in
[`.github/instructions/vue-frontend.instructions.md`](.github/instructions/vue-frontend.instructions.md).
Report vulnerabilities privately as described in [`SECURITY.md`](SECURITY.md).
