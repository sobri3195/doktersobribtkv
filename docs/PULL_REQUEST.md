# Draft: build NEXAM Academy browser-local learning PWA

Starts the empty repository with a React/Vite/TypeScript application for BTKV, LPDP and SIMAK UI. Includes five-tab responsive navigation, local profiles and persistence, study sessions, timed exam infrastructure, separate SIMAK scoring, real analytics, validated backup/import/export, a local question editor, three branching clinical cases, and static PWA/Vercel configuration.

**Incomplete acceptance:** 110 original draft questions are included, 10 per category; the brief requires 550. Full simulations are explicitly disabled where content is insufficient. Reading passages, in-app year blueprint editing, optional preparation packs and Android packaging remain outstanding; see docs/STATUS.md. This PR must remain draft and must not be described as a completed implementation.

Validation: production build passed; 16 unit/component tests and 4 Chromium mobile browser tests passed, including offline navigation after service-worker installation. `npm run validate:questions` fails intentionally because 440 questions are missing. Content is not medically verified. No deployment or real Android installation has been tested.
