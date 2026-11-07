# Acceptance status

## LPDP (current change)

- Exactly 150 original LPDP SBAs: 50 verbal, 50 quantitative, 50 problem solving. Per category: five ten-question topics, 15/25/10 difficulty estimates, five options and ten keys each at A–E.
- Five shared original Indonesian passages and 20 labeled table/graph stimuli; all referenced resources render in study and exam modes and are cached for offline practice.
- Structured steps, quantitative worked solutions, individual distractor rationales, quick tips, estimated times and review flags.
- LPDP_TBS_2026 selects 23/25/12 questions over 30/40/20 minutes. Absolute section deadlines, section locking, restoration, practice scoring, per-subtest results, duration and backups are integrated. Default +5/0/0 yields 300 points for 60 correct answers; no official passing score is claimed.
- Real-response recommendations, difficulty/time statistics, wrong-answer review and scheduled repetition (1 day incorrect / 7 days correct). Rules are pedagogical and not psychometrically calibrated.
- Previous 30 LPDP questions remain in the read-only legacy archive for old attempts, notes and bookmarks.
- All generated LPDP content remains needs_review. Human editorial review, five similarity flags and official-source verification remain outstanding. See LPDP_EDITORIAL.md.

## BTKV retained

The active BTKV v2 bank remains 150 questions (50 per field), unchanged in this LPDP change. Its content validator and regression suite still run. Medical review and per-question scientific source verification remain pending as documented in BTKV_EDITORIAL.md.

## Validation

Both program-specific validators pass. LPDP additionally performs 110 separate numerical/formal/constraint checks. The 41 unit/component tests pass, the production build and formatting pass, and all ten Chromium browser journeys pass (including full LPDP simulation, restored results and offline shared resources). Automated checks do not prove originality, semantic validity, empirical difficulty or human peer review. The build retains a bundle-size warning.

## Earlier application requirements still outstanding

- Total active bank is 350: BTKV 150, LPDP 150, SIMAK 50. The global 550-question gate still fails on the remaining 200 SIMAK questions. SIMAK source files are unchanged by this LPDP change.
- SIMAK full simulations remain blocked where content is insufficient. Its English reading passages are still absent; LPDP passages are implemented independently.
- Reference-year blueprints are source-editable; an in-app blueprint editor is absent. Custom quick packages support create/delete.
- Optional LPDP essay/interview packs, SIMAK program-specific packs, Capacitor/Android packaging, persisted case progress, comprehensive accessibility review and real Android installation remain outstanding.
- No Vercel deployment or fresh cloud snapshot restoration was performed. Static configuration is supplied and local Chromium offline navigation is tested.

The global content-acceptance CI job remains strict. Do not weaken its 550-question requirement to hide the remaining SIMAK work.
