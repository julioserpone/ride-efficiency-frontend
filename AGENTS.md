# Agent instructions

These instructions apply to the whole repository. Read
[`CONTRIBUTING.md`](CONTRIBUTING.md) before changing code and follow the
matching file-scoped instructions in [`.github/instructions/`](.github/instructions/)
when editing Vue components.

## Project boundaries

- This is the Vue 3 web client. The Laravel API and React Native app are separate
  repositories; coordinate public API changes with the API repository and keep
  request/response types aligned with its documented contract.
- Keep application UI in `src/`. Do not edit generated `dist/`, dependencies,
  user-specific editor settings, or attached screenshots unless explicitly asked.
- Do not add credentials, real invoices, customer data, or other private data to
  source code, tests, screenshots, or commits.

## Implementation

- Follow the existing Vue Composition API, `<script setup lang="ts">`, typed API
  client, Vue Router and Pinia patterns. Prefer existing dependencies and helpers.
- Keep user-facing copy in Spanish and code identifiers, API keys and comments in
  English.
- Preserve the shared Harbor design tokens, keyboard access, readable contrast,
  responsive layouts and the 44px form-control target.
- Add or update focused tests for behavior changes. Do not silently turn API
  errors into success states.

## Validation

Run the relevant tests and checks before proposing a change:

```bash
npm run build
npm test
npm run lint:check
npm run format:check
```

For UI changes, verify a narrow viewport as well as desktop when browser
validation is available. See [`CONTRIBUTING.md`](CONTRIBUTING.md) for branch,
commit and pull-request conventions.
