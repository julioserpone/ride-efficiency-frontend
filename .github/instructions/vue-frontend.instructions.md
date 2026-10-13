---
description: 'Use when implementing or reviewing Vue components, responsive layouts, forms, tables, accessibility, or visual styles in the web dashboard.'
name: 'Vue frontend guidance'
applyTo: 'src/**/*.vue'
---

# Vue component guidance

- Use Vue 3 `<script setup lang="ts">` and Composition API patterns already
  established in `src/`. Keep view-specific state in the view and reusable
  behavior in an existing composable or API module.
- Give API requests typed payloads and responses via `src/api/types.ts`.
  Surface actionable errors; do not swallow rejected requests.
- Keep forms keyboard-operable with associated labels, native validation where
  appropriate, visible focus, and consistent `.field-control` styles.
- Check narrow and wide layouts. Keep data tables readable and horizontally
  usable on small screens; do not rely on color alone to convey status.
- Use `src/assets/main.css` Harbor tokens and existing shared components rather
  than introducing page-specific colors or duplicate styling systems.
- Add or update focused Vitest coverage for behavior changes. Before finishing,
  run `npm run build`, `npm test`, `npm run lint:check` and
  `npm run format:check` as applicable.
