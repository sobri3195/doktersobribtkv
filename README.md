# NEXAM Academy (draft)

A browser-local Indonesian learning PWA for BTKV, LPDP and SIMAK UI, built with React 19, Vite, strict TypeScript, Tailwind, React Router, Zustand, Zod, React Hook Form, Recharts and KaTeX. No backend, login, paid service, API key or database is required.

**This is an incomplete implementation of the supplied brief. It is not ready for acceptance or production publication. The active bank contains 230 authored questions: 150 BTKV questions pending medical review and 80 LPDP/SIMAK draft questions, not the required 550.** See [status and limitations](docs/STATUS.md).

## Develop

Use Node.js 24 and npm 11. The lockfile pins resolved dependencies.

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
npm run validate:btkv
npm run validate:questions
```

`validate:questions` intentionally exits nonzero until every bundled category contains exactly 50 questions. It also validates schemas, IDs, keys, category identity and normalized exact duplicate stems, and writes `docs/similarity-report.json` for manual similarity review. A passing schema is not evidence of medical accuracy, originality or adequate topic coverage.

```sh
# This cloud image includes /usr/bin/chromium:
npm run test:e2e
# Else install Chromium, then set the executable path:
npx playwright install chromium
CHROMIUM_PATH=/absolute/path/to/chrome npm run test:e2e
```

Playwright starts the production preview automatically. Build first. Use the existing checkout in the isolated environment; no worktree is needed. The test fixture containing replicated questions exercises exam blueprint selection only and is never bundled into the app.

## Implemented workflows

- Five persistent mobile tabs and a desktop sidebar; program switching retains each program's history.
- Local onboarding/profile, theme and daily goals. No cloud authentication.
- Search, category/difficulty/answer/bookmark filters and random study sessions of up to 5/10/20/30/50 available questions, without repetition. Study explanations appear after an answer.
- Quick exams and local custom packages. Absolute section deadlines survive refresh; expired sections advance and exhausted attempts submit. Full blueprint selection requires enough questions and is blocked with a specific message otherwise.
- Separate SIMAK PEKA (+4/−1/0) and English (+1/0/0) raw practice scores. LPDP and BTKV display correct/total without invented official scores.
- Real answer/score/activity charts, bookmarks and personal notes.
- Validated versioned backup/restore, corruption recovery copy, quota warnings and selective deletion.
- JSON/CSV question import with preview and explicit local overrides, export, enable/disable and local deletion.
- 150 BTKV SBAs with taxonomy, five options, clinical explanations, review flags and configurable category tryouts; three short branching learning cases. See [editorial requirements](docs/BTKV_EDITORIAL.md).
- Prompt-based PWA updates deferred during unfinished sessions; app chunks, question content and modern font resources are precached.

User data uses `nexam:data` (schema v2); `nexam:recovery` preserves malformed prior data when saving a new state. A v1 top-level migration is provided. Browser storage can be edited or deleted; neither timers nor scores are secure or certified. Export frequently. Restoring a backup replaces local data after confirmation. Browser profiles and app origins have separate storage.

## Static deployment on Vercel

Do not publish this draft as a complete 550-question product. After completing acceptance requirements:

1. Import the GitHub repository into Vercel.
2. Select Vite, Node 24, install `npm ci`, build `npm run build`, output `dist`.
3. No environment variables or secrets are required.
4. Deploy. `vercel.json` routes app paths to the SPA and excludes generated asset, icon, manifest and service-worker paths from fallback.
5. Check direct loads and refreshes of `/materi`, `/tryout`, `/statistik`, `/profil`. Install the PWA over HTTPS, wait for its offline-ready indication, then verify an offline cold start on Android.

Deployment, real Android installation and a fresh cloud snapshot restoration have not been performed. The local Chromium offline test passes. Service workers and LocalStorage require an appropriate browser origin; use Vite rather than opening HTML as a file.

## Layout

`src/pages` contains route views; `src/components` shared presentation; `src/services` schemas, persistence, import/export and scoring/timing; `src/stores` centralized state; `src/data/questions` immutable bundled JSON; `src/data/cases.ts` clinical case data. `e2e` and `src/tests` contain browser and unit/component tests. No network request is needed at application runtime.

The 2026 exam blueprints are editable practice configurations in `src/services/exams.ts`, based on the supplied brief, not independently verified official formats. Shared question updates require editing source JSON and redeploying; local imports never propagate to other users.
