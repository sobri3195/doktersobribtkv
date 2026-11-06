# Draft acceptance status

## Verified in the cloud instance

- Frozen npm dependency installation and production TypeScript/Vite/PWA build.
- 16 unit/component tests: schemas, content loading, overrides, negative marking, blueprint selection, deadlines, backup/migration/corruption/quota handling, JSON/CSV roundtrips, program switching, search and bookmarks.
- Six Chromium mobile-viewport journeys: study/persistence/statistics/routes, exam restoration and answer hiding, service-worker offline cold navigation, branching BTKV case decisions, backup/import preview and automatic deadline submission.
- Strict question validation: **FAIL**. All 110 current questions have valid schemas, unique IDs and normalized stems. All eleven categories contain 10 questions instead of 50; 440 questions remain. No pairs exceed the current 0.65 Jaccard stem similarity heuristic. This heuristic does not prove originality or content diversity.

## Required work before acceptance

- Author and editorially review 40 additional substantive questions in each category. Do not use paraphrase padding. All clinical content remains draft, with no assertion of medical verification. Add varied difficulties, fuller topic/subtopic coverage, independent factual and answer-key review, and richer distractor-specific explanations.
- Add multiple original English reading passages with separately stored passage IDs and passage-aware rendering/import/validation. Current vocabulary-reading questions cover vocabulary concepts only; passage imports are explicitly rejected.
- Populate sufficient content and verify full 60-question LPDP and 190-question SIMAK simulations end to end using real bundled content. Selection/scoring/timing logic is tested with isolated fixtures, not a completed production bank.
- Add an in-app editable reference-year blueprint manager. Current blueprint configuration is source-editable; custom quick packages are locally editable via create/delete only.
- Complete LPDP essay, study-plan, leadership/contribution and interview modules; SIMAK program-specific optional packs.
- Add richer subject/topic/subtopic browsing, exact-size session availability messaging (current sessions cap at available filtered questions), full review-only question filters, a dedicated bookmark/history view, and more detailed topic trend analytics.
- Clinical cases are short branching educational decision flows, not comprehensive validated simulations. Persisted case progress is not implemented.
- Complete accessibility audit (dialog focus trapping/escape handling), real Android installation and cold launch tests, hardware back behavior, update-available/offline upgrade tests, and cross-browser storage migration tests.
- Optional Capacitor/Android integration and APK generation are not implemented.
- No Vercel deployment has been performed. The Vercel rewrite configuration is provided but has not been tested on Vercel's hosted platform.

## CI

The application job runs unit tests, build and browser tests. The separate `content-acceptance` job intentionally fails until all 550 original questions are complete. Do not weaken this gate to merge or mark the application complete.
