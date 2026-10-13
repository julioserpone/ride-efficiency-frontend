# Contributing

Thanks for helping improve Ride Efficiency. This repository contains the Vue
web dashboard; the JSON API and mobile client are maintained separately.

## Before you start

- Check existing issues and pull requests to avoid duplicating work.
- For a large change or a public API dependency, open an issue or discuss the
  approach before implementation.
- Never include secrets, access tokens, real receipts, personal information,
  or production data in source code, fixtures, screenshots, logs, or commits.

## Local development

Use the Node.js 22 runtime from CI and install exact locked dependencies:

```bash
npm ci
cp .env.example .env
npm run dev
```

Set `VITE_API_URL` to the API's versioned base URL. The API must allow the
frontend origin through its CORS configuration. Do not put secrets in `VITE_*`
variables; Vite exposes them to the browser.

## Branches and commits

- `main` is the default integration branch. Do not commit directly to it.
- Create a short-lived branch from the latest `main`, using
  `<type>/<short-kebab-summary>`, for example `feat/vehicle-dashboard`,
  `fix/invoice-status-label` or `docs/contribution-guide`.
- Keep each branch focused. Split unrelated concerns into separate branches
  and pull requests.
- Use [Conventional Commits](https://www.conventionalcommits.org/) for each
  commit:

    ```text
    <type>(<optional-scope>): <imperative summary>
    ```

    Common types are `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `build`,
    `ci` and `chore`. Use a concise, lowercase summary without a trailing period.
    Add a body when context, compatibility, or migration notes are useful.

## Pull requests

- Open a PR against `main`; keep it reviewable and explain the user or
  maintenance problem it solves.
- Link related issues and call out changes to API calls, data shapes,
  authentication, dependencies, accessibility or responsive behavior.
- Include before/after screenshots for meaningful visual changes, using only
  synthetic data.
- Describe how you tested it and disclose any known limitations. Do not claim a
  check passed unless it was run.
- Address review feedback with focused commits and preserve existing user work.
- Wait for required CI checks and maintainer approval before merging. Use the
  repository's enabled merge method and delete the branch after merge.

## Definition of done

- Behavior is covered by focused tests where practical.
- Build, tests, lint and formatting pass:

    ```bash
    npm run build
    npm test
    npm run lint:check
    npm run format:check
    ```

- Public API changes are coordinated with `ride-efficiency-api` and documented.
- User-facing text, empty states, validation and API failures remain
  understandable and accessible.

See [`README.md`](README.md) for project setup and
[`.github/instructions/vue-frontend.instructions.md`](.github/instructions/vue-frontend.instructions.md)
for component-specific implementation guidance.
