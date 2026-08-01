# Senior Angular Developer Portfolio — Scoring Rubric (100 pts)

**Pass threshold:** 70/100 overall, with no single category below 50% of its max.
**Auto-fail conditions** (regardless of total score): committed secrets/API keys, no tests whatsoever, project doesn't run from README instructions, or plagiarized/unmodified bootcamp clone.

---

## 1. Architecture & Project Structure — 15 pts

| Criteria | Points |
|---|---|
| Feature-based modular structure (core/shared/features or standalone equivalent) | 5 |
| Consistent naming conventions & clean import paths (path aliases, no `../../../..`) | 3 |
| Clear smart/dumb (container/presentational) component separation | 4 |
| No business logic embedded in components | 3 |

**Deductions:** −5 if everything lives in one module/mega-component; −3 for circular dependency issues from barrel files.

---

## 2. Angular Technical Proficiency — 20 pts

| Criteria | Points |
|---|---|
| Modern patterns for claimed Angular version (standalone, signals, new control flow) | 6 |
| Correct RxJS usage (async pipe, `takeUntilDestroyed`, no leaked subscriptions) | 5 |
| OnPush change detection used deliberately | 3 |
| Typed reactive forms, strict TypeScript (`strict: true`) | 4 |
| Consistent DI approach (`inject()` or constructor, not mixed randomly) | 2 |

**Deductions:** −6 for any unsubscribed manual `.subscribe()` calls; −4 for `any` used pervasively; −4 for DOM manipulation bypassing Angular APIs.

---

## 3. Testing — 20 pts

| Criteria | Points |
|---|---|
| Coverage ≥70% | 6 |
| Coverage 40–69% | 3 |
| Coverage <40% | 0 |
| Tests assert meaningful behavior (not just `toBeTruthy()`) | 6 |
| Services/pipes/guards unit tested | 4 |
| At least one E2E/integration test for a critical flow | 4 |

**Deductions:** −10 (hard cap at 10/20 max) if coverage is high but tests are trivial/gamed; −5 for skipped tests (`xit`/`xdescribe`) left in.

---

## 4. Code Quality & Tooling — 10 pts

| Criteria | Points |
|---|---|
| ESLint configured and passing clean | 3 |
| Prettier/consistent formatting | 2 |
| Pre-commit hooks (Husky/lint-staged) | 2 |
| CI pipeline running lint + test + build | 3 |

**Deductions:** −3 if lint errors are suppressed wholesale via disable comments.

---

## 5. Performance & Best Practices — 10 pts

| Criteria | Points |
|---|---|
| Lazy-loaded feature routes | 3 |
| Bundle size awareness / code splitting | 2 |
| Accessibility basics (semantic HTML, ARIA) | 3 |
| No stray `console.log`/`debugger` in prod code | 2 |

---

## 6. Documentation (README) — 10 pts

| Criteria | Points |
|---|---|
| Clear purpose + working setup instructions (tested, not assumed) | 4 |
| Architecture decisions explained (why, not just what) | 3 |
| Screenshots/demo link | 2 |
| Tech stack + versions listed | 1 |

**Deductions:** −5 if README is untouched Angular CLI default; −4 if setup instructions fail when followed literally.

---

## 7. State Management (if applicable) — 5 pts

| Criteria | Points |
|---|---|
| Choice justified by app complexity (no NgRx for simple CRUD) | 3 |
| Implemented idiomatically | 2 |

*(If no state management library is used and the app doesn't need one, award full 5 by default — absence isn't a penalty.)*

---

## 8. Security — 5 pts

| Criteria | Points |
|---|---|
| No secrets/keys committed | 3 (auto-fail if violated) |
| No unjustified `bypassSecurityTrust*` calls | 2 |

---

## 9. Senior-Level Signals — 5 pts

| Criteria | Points |
|---|---|
| Evidence of trade-off reasoning (comments/README/ADRs) | 2 |
| Global error handling strategy (interceptors, error handler) | 2 |
| Thoughtful custom directives/pipes (not just library consumption) | 1 |

---

## Scoring Summary Sheet

| Category | Max | Score |
|---|---|---|
| 1. Architecture & Structure | 15 | |
| 2. Angular Technical Proficiency | 20 | |
| 3. Testing | 20 | |
| 4. Code Quality & Tooling | 10 | |
| 5. Performance & Best Practices | 10 | |
| 6. Documentation | 10 | |
| 7. State Management | 5 | |
| 8. Security | 5 | |
| 9. Senior-Level Signals | 5 | |
| **Total** | **100** | |

## Rating Bands

- **90–100:** Exceptional — hire-ready senior signal
- **80–89:** Strong senior candidate, minor gaps
- **70–79:** Passable senior, but verify specific weak categories in interview
- **50–69:** Mid-level portfolio mislabeled as senior — probe hard in interview
- **<50:** Does not support senior claim

---

*Note: Multiple smaller, varied portfolio projects should be scored individually then averaged, with a +5 bonus (capped at 100) if the set demonstrates range across different problem types (e.g., state-heavy app, forms-heavy UX, real-time data).*
