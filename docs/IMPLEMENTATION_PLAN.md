# Ride Efficiency Frontend — Implementation Plan

> **Repo:** `ride-efficiency-frontend` (Vue 3, Vite, TypeScript, PrimeVue, Pinia, Vue Router, ApexCharts)
>
> **Purpose:** Web dashboard for profitability, offers, 2FA, circles/safety, chat, traffic and identity-verification backoffice.
>
> **Tracking:** `[ ]` pending · `[-]` in progress · `[x]` done · `[!]` blocked. Sizes: S = 1, M = 2, L = 3.

---

## 1. Current state (baseline)

### Implemented
- [x] Vue 3 + Vite + TypeScript SPA.
- [x] Pinia auth store; token in `localStorage`; Axios interceptor with 401 handling.
- [x] Router with token guard and blank/app layouts.
- [x] Views: Login, Overview, Shifts, Invoices, Fleet.
- [x] PrimeVue DataTable/dialogs/forms; ApexCharts trends; “Harbor” design tokens.
- [x] Vitest tests for client, formatting, invoice review.
- [x] Docker dev setup; Dockerfile; env example.

### Gaps relevant to the vision
- No offers dashboard/funnel.
- No 2FA setup/verification UI.
- No session/device management.
- No circles/members/roles/invites.
- No live map/location, panic alerts, family-lite view.
- No chat (text/audio/image).
- No traffic reports map.
- No driving-risk dashboard.
- No KYC/backoffice.
- No generated OpenAPI client; types are hand-maintained.
- No E2E tests.
- No staging hosting pipeline.

---

## 2. Architecture decisions

1. **OpenAPI-first client.** Generate or validate types from the API spec; avoid hand-maintained drift.
2. **Feature-flagged routes.** Offers first; safety/community/KYC behind flags.
3. **2FA is web-first.** TOTP setup with QR + recovery codes; backend uses `pragmarx/google2fa`; password remains fallback.
4. **Maps are lightweight.** MapLibre/Leaflet with free OpenStreetMap tiles; no paid map SDK.
5. **Chat media uses presigned direct uploads.** Web requests a short-lived presigned PUT, uploads straight to the private S3 bucket, then confirms the object key. Audio is recorded with MediaRecorder; images come from a file input. Playback/preview uses short-lived presigned GET URLs.
6. **Admin separation.** KYC/moderation routes require an admin role; never expose PII to regular users. KYC documents are viewed only through short-lived presigned GET URLs.
7. **Staging hosting (decided).** EC2 free-tier instance (dynamic public IP) serves the built SPA through nginx and reverse-proxies `/api` to Laravel on the same origin. **DuckDNS** (updated every 5 minutes and on boot) provides the hostname; **Let's Encrypt HTTP-01** provides TLS. No Elastic IP, no custom domain, no CloudFront.
8. **Production hosting.** Move to Laravel Cloud or a CDN/static host when leaving the free tier.
9. **Cost guardrails.** No paid services in staging; AWS Budget alert at `$1`; S3 private with size limits, lifecycle rules and client-side compression.

---

## 3. Release plan

| Release | Scope | Demo outcome |
| :--- | :--- | :--- |
| **W0** | Foundations: OpenAPI client, auth refactor, layouts, flags, test setup | Stable shell for new features |
| **W1** | Offers dashboard: history, filters, funnel, detail | Web analytics for offers |
| **W2** | Auth: 2FA QR, recovery codes, sessions, password-change reminder | Secure web login |
| **W3** | Safety: circles, members, live map, panic alerts, family-lite | Safety dashboard |
| **W4** | Community: chat, traffic reports, driving risk | Circle operations |
| **W5** | Admin/KYC: document review, background status | Backoffice |
| **W6** | Production hosting & observability | Production web |

> The web can lag mobile by one release; R1/W1 is not a blocker for the mobile MVP.

---

## 4. Epics and tasks

### 4.1 EPIC WEB-FOUND — Foundations

- [ ] **WEB-FOUND-01 (M)** Generate typed API client from OpenAPI (openapi-typescript / orval); replace hand-written `src/api/types.ts` gradually.
- [ ] **WEB-FOUND-02 (S)** Central API error normalization (validation, 401, 403, 422, network).
- [ ] **WEB-FOUND-03 (S)** Auth store refactor: token + user + 2FA challenge state; secure logout.
- [ ] **WEB-FOUND-04 (S)** Router guards for auth/role/feature flags; 403 page.
- [ ] **WEB-FOUND-05 (S)** App layout navigation slots for Offers, Safety, Community, Admin.
- [ ] **WEB-FOUND-06 (S)** Feature flag composable from `/sync/config`.
- [ ] **WEB-FOUND-07 (S)** Env config for staging/production; no secrets in `VITE_*`.
- [ ] **WEB-FOUND-08 (S)** Test setup: Vitest component tests + Playwright E2E (free).

**Acceptance:** typed client compiles; 401/403 handled consistently; new routes hidden when flags off.

---

### 4.2 EPIC WEB-OFFER — Offers dashboard

- [x] **WEB-OFFER-01 (M)** Offers list: pagination, filters (platform, status, date), sorting.
- [-] **WEB-OFFER-02 (S)** Offer detail: fare, distance, duration, costs, client/server verdict, drift indicator.
- [ ] **WEB-OFFER-03 (M)** Daily funnel: received/evaluated/accepted/rejected/expired/completed/cancelled.
- [ ] **WEB-OFFER-04 (S)** Acceptance/completion rates, avg offered fare, avg net profit.
- [ ] **WEB-OFFER-05 (M)** Charts: offers per day, acceptance rate, estimated vs actual profit (ApexCharts).
- [ ] **WEB-OFFER-06 (S)** Compare platforms (Uber/DiDi/InDrive).
- [ ] **WEB-OFFER-07 (S)** Empty/loading/error states; export CSV (optional).

**Acceptance:** user can audit offers and understand why a verdict was given; funnel matches API summary.

---

### 4.3 EPIC WEB-AUTH — 2FA and account security

- [ ] **WEB-AUTH-01 (M)** 2FA setup: QR render (qrcode lib), secret copy, confirm code (backend uses `pragmarx/google2fa`).
- [ ] **WEB-AUTH-02 (M)** Recovery codes display/download; regenerate.
- [ ] **WEB-AUTH-03 (M)** Login flow with TOTP challenge when enabled; recovery code path.
- [ ] **WEB-AUTH-04 (S)** Disable 2FA with password + code confirmation.
- [ ] **WEB-AUTH-05 (S)** Sessions/devices list and revoke.
- [ ] **WEB-AUTH-06 (M)** Change password + rotation reminder (6 months, reminder only, configurable).
- [ ] **WEB-AUTH-07 (S)** Optional passkey/WebAuthn UI if the API enables it.
- [ ] **WEB-AUTH-08 (S)** Logout all devices.

**Acceptance:** user can enable/disable 2FA, recover access, revoke sessions; password fallback always works; rotation is a reminder.

---

### 4.4 EPIC WEB-SAFETY — Circles and live safety

- [ ] **WEB-SAFE-01 (M)** Circles list/create/join by invite code or link.
- [ ] **WEB-SAFE-02 (M)** Members and roles: family_lite, driver_peer, admin; invite/remove.
- [ ] **WEB-SAFE-03 (M)** Live map with member positions (MapLibre/Leaflet + OSM).
- [ ] **WEB-SAFE-04 (S)** Family-lite view: position + shift state only; no financial data.
- [ ] **WEB-SAFE-05 (S)** Panic alerts panel: active, acknowledge, resolve.
- [ ] **WEB-SAFE-06 (S)** Nearby driver alerts on map (PostGIS-backed API).
- [ ] **WEB-SAFE-07 (S)** Privacy settings: location sharing on/off, retention info.
- [ ] **WEB-SAFE-08 (S)** Realtime updates via Reverb client.

**Acceptance:** lite view never exposes earnings; panic alerts visible in realtime; roles enforced.

---

### 4.5 EPIC WEB-CHAT — Circle communication

- [ ] **WEB-CHAT-01 (M)** Chat list + conversation view with pagination.
- [ ] **WEB-CHAT-02 (M)** Text messages with realtime updates.
- [ ] **WEB-CHAT-03 (M)** Audio recording/playback (MediaRecorder): compress, request presigned PUT, upload directly to private S3, confirm key, play via presigned GET.
- [ ] **WEB-CHAT-04 (M)** Image upload: compress to the size limit, request presigned PUT, upload directly to private S3, confirm key, preview via presigned GET.
- [ ] **WEB-CHAT-05 (S)** Upload progress, retry and orphan cleanup.
- [ ] **WEB-CHAT-06 (S)** Mute/notifications preferences.
- [ ] **WEB-CHAT-07 (S)** Report message / moderation view.

**Acceptance:** text/audio/image messages work; realtime or refresh fallback; abuse reportable; media is private in S3 and only reachable through short-lived presigned URLs.

---

### 4.6 EPIC WEB-TRAFFIC — Road reports

- [ ] **WEB-TRAFFIC-01 (M)** Map layer for active reports (jam, closure, accident, hazard) using PostGIS nearby queries.
- [ ] **WEB-TRAFFIC-02 (S)** Create report (if allowed) and resolve.
- [ ] **WEB-TRAFFIC-03 (S)** Confirmations/upvotes and expiry indicator.
- [ ] **WEB-TRAFFIC-04 (S)** Filter by radius/date/type.

---

### 4.7 EPIC WEB-RISK — Driving risk dashboard

- [ ] **WEB-RISK-01 (M)** Risk events list and filters (type, severity, date).
- [ ] **WEB-RISK-02 (S)** Risk score per shift/day.
- [ ] **WEB-RISK-03 (S)** Charts: speeding/distraction/braking trends.
- [ ] **WEB-RISK-04 (S)** Export CSV (optional).

---

### 4.8 EPIC WEB-ADMIN — KYC and backoffice

- [ ] **WEB-ADMIN-01 (M)** Admin route guard + role.
- [ ] **WEB-ADMIN-02 (L)** Identity verification queue: document preview through short-lived presigned GET URLs, approve/reject, notes.
- [ ] **WEB-ADMIN-03 (M)** Background check status view/webhook log.
- [ ] **WEB-ADMIN-04 (S)** Audit log of admin actions.
- [ ] **WEB-ADMIN-05 (S)** PII access restrictions and masking.

**Acceptance:** only admins access; PII masked by default; actions audited.

---

### 4.9 EPIC WEB-PLATFORM — Hosting, CI, observability

- [ ] **WEB-PLAT-01 (S)** Staging topology: build the SPA locally/CI, copy to EC2, serve with nginx `try_files ... /index.html`; reverse-proxy `/api` to Laravel on the same origin. S3 only for media/backups.
- [ ] **WEB-PLAT-02 (S)** DuckDNS hostname updated every 5 minutes and on boot; Let's Encrypt HTTP-01 with auto-renewal. Document that DuckDNS points to EC2, not S3.
- [ ] **WEB-PLAT-03 (S)** Build/deploy pipeline (GitHub Actions): build, upload artifact to EC2, reload nginx, verify health.
- [ ] **WEB-PLAT-04 (S)** Env config for staging/production; same-origin API avoids CORS; document production CORS.
- [ ] **WEB-PLAT-05 (S)** Cache headers for hashed assets, no-cache for `index.html`, HTTPS redirect and HSTS.
- [ ] **WEB-PLAT-06 (S)** Error reporting (Sentry free tier optional).
- [ ] **WEB-PLAT-07 (S)** Accessibility pass: keyboard, labels, contrast.
- [ ] **WEB-PLAT-08 (S)** Cost guardrails: AWS Budget alert at `$1`, no CloudFront/Elastic IP, instance stop schedule, S3 size limits.

---

### 4.10 EPIC WEB-QA — Testing

- [ ] **WEB-QA-01 (M)** Vitest component tests for offers, auth, safety views.
- [ ] **WEB-QA-02 (M)** Playwright E2E: login → 2FA → offers → circles → chat.
- [ ] **WEB-QA-03 (S)** Contract tests against OpenAPI schema.
- [ ] **WEB-QA-04 (S)** Role/permission tests (lite vs peer vs admin).
- [ ] **WEB-QA-05 (S)** Accessibility checks (axe).

---

## 5. Dependencies on API

| Web need | API dependency |
| :--- | :--- |
| Offers dashboard | `GET /ride-offers`, `/summary/daily` |
| 2FA | TOTP setup/confirm/verify endpoints (`pragmarx/google2fa`) |
| Sessions | list/revoke endpoints |
| Circles | circles/members/invites |
| Live map | `GET /circles/{id}/locations` (PostGIS), Reverb |
| Panic panel | `GET /driver-alerts`, Reverb |
| Chat | messages + presigned S3 upload/read + Reverb |
| Traffic | traffic reports endpoints (PostGIS) |
| Risk | driving events summary |
| Admin KYC | identity verification endpoints + admin role + presigned GET on the private `kyc/` prefix |

---

## 6. Acceptance criteria for W1 (Offers dashboard)

- [ ] Typed client generated from OpenAPI compiles.
- [ ] Offers list with filters and pagination.
- [ ] Offer detail shows client vs server verdict and costs.
- [ ] Daily funnel + charts match API numbers.
- [ ] Loading/empty/error states covered.
- [ ] Lint, typecheck, Vitest and build pass.
