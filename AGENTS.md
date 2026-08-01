# AGENTS.md

## Project Overview

Wheeloflife is an Angular application for creating and managing "Wheel of Life" assessments for free, personal, and professional/coach workflows.

Tech stack:

- Angular 17 application using standalone components and Angular SSR/prerender targets.
- TypeScript 5.3 with strict compiler and strict Angular template checking enabled.
- SCSS for styling.
- NgRx Store/Effects for application state.
- Karma + Jasmine for unit tests.
- npm is the package manager. `package-lock.json` is present; no `pnpm-lock.yaml` or `yarn.lock` was found.

Key dependencies:

- `@angular/*`, `@angular/material`, `@angular/cdk`
- `@ngrx/store`, `@ngrx/effects`, `@ngrx/store-devtools`
- `@ngx-translate/core`, `@ngx-translate/http-loader`
- `ngx-markdown`
- `ng2-charts`, `chart.js`
- `dom-to-image`
- `@sentry/angular`, `@sentry/cli`
- `express` for SSR serving

## Coding Conventions

- Use standalone Angular components; do not introduce NgModules for new feature code.
- Use the `wil-` component selector prefix.
- Use external template and style files: `templateUrl` and `styleUrl`/`styleUrls`.
- Prefer `ChangeDetectionStrategy.OnPush` for components.
- Prefer Angular's `inject()` function for dependency injection in new code.
- Use explicit `public`, `private`, and `readonly` modifiers where helpful.
- Keep reusable feature types in nearby `typings.d.ts` files instead of exporting interfaces/types from component files.
- Keep components organized as:

```text
feature-name/
  /ui
  /features
  /services
  feature-name.component.ts
  feature-name.component.html
  feature-name.component.scss
  feature-name.component.spec.ts
```

- Use NgRx immutable update patterns for state changes.
- Keep API DTOs in `src/app/services/api/dto/` or a relevant nearby DTO location.
- Use lazy route files for feature route groups where that pattern already exists.
- Prefer behavior-driven tests using DOM interactions over direct method calls.
- Add `data-testid` attributes to interactive elements when adding or changing testable UI.
- Use SCSS and follow existing BEM-style class naming where present.

Formatting:

- UTF-8 files.
- 2-space indentation.
- Single quotes in TypeScript.
- Final newline required.
- Trim trailing whitespace except in Markdown.
- Prettier is configured with `printWidth: 140`; no other Prettier options are set.

## Testing

./agents-docs/testing.md - use for testing tasks

## Constraints / Rules

- Never call API data services directly from component, use effects as proxy.
- Keep HTML short, sepratating out big elements into separate components. 
- Try to keep smart / dummy arcitecture, where most logic is in a feature component and dummy components are kept in closest /ui folder. 
- Nest feature/feature component if needed. 
- Treat code as source of truth. Docs in `README.md`, `docs/`, and `.github/` may be stale.
- Preserve strict TypeScript settings: avoid `any`, implicit returns, unsafe index property access, and casing mismatches.
- Do not commit secrets, auth tokens, Sentry tokens, API keys, or private environment values.
- Do not edit generated output in `dist/`, `coverage/`, or `node_modules/`.
- Do not add new dependencies without asking first, especially for UI, state, testing, or build tooling.
- Keep changes scoped to the requested feature or bug.
- Maintain SSR safety: guard browser-only APIs such as `window`, `document`, canvas, and storage with platform checks or Angular-safe abstractions.
- Keep bundle-size budgets in mind; production builds warn/error on large initial, component style, and vendor bundles.
- Sentry source-map upload is part of `build:ssr`; avoid running it casually unless release/upload behavior is intended.
- Update or add tests when changing behavior, state transitions, guards, services, or non-trivial UI logic.

## AI-Specific Instructions

- Start by reading the relevant source files and existing tests before changing code.
- Prefer incremental, focused patches over broad refactors.
- Follow existing Angular/Ngrx patterns in the touched area, even if another pattern is theoretically cleaner.
- Ask before adding dependencies, changing package manager files, or altering build/deployment behavior.
- Explain non-obvious code with short comments only when it reduces future maintenance cost.
- If docs conflict with source, follow source and mention the discrepancy.
- Do not rewrite unrelated code while fixing a narrow issue.
- Verify with the narrowest useful command first, then broaden if the change affects shared behavior.
- If a command cannot run because of local environment constraints, report that clearly with the command attempted.
