# Acceptance status

## BTKV clinical bank (this change)

- Exactly 150 active BTKV v2 questions: 50 thoracic, 50 cardiac, 50 vascular.
- Each category has 15 easy / 25 medium / 10 hard; 35 vignettes / 10 basic concepts / 5 data interpretations; ten topic groups of five; ten correct keys at each letter A–E.
- Five answer options, explanation, individual distractor rationales, learning objective, clinical pearl, editorial flags and unverified source pointers on every record.
- `npm run validate:btkv` checks the complete technical content contract and emits `docs/btkv-validation.json`. Technical validation does not establish medical accuracy, distractor quality, empirical difficulty or human peer review.
- All 150 questions remain `needs_review`; every source pointer is explicitly unverified. The supplied reference site was blocked by network policy. Qualified medical review and per-question source verification remain necessary; see [editorial queue](BTKV_EDITORIAL.md).
- Category and mixed BTKV tryouts support local configurable duration and practice points. Clinical explanations and source links are hidden before exam submission.
- The previous 30 introductory questions are archived for old attempts/bookmarks/notes, excluded from active bank counts. They are not mapped onto unrelated new questions.

## Validation

`npm run validate:btkv`: PASS (150 questions, zero technical errors). `npm test`: PASS (27 tests). `npm run build`: PASS (including service worker). Chromium: eight journeys PASS, including BTKV offline practice. Formatting passes. The production build reports a bundle-size warning. The suite includes unit/component checks for both old and new schemas, all distribution counts, option/ID/metadata failures, clinical JSON/CSV roundtrips, configurable BTKV scoring, preserved legacy attempts, LPDP/SIMAK scoring, storage and migrations. Browser journeys cover program switching, study explanations, bookmarks and notes after refresh, tryout submission/restoration, statistics, backup/import, timeout submission, branching cases, and offline PWA navigation.

## Earlier application requirements still outstanding

- Active bank total is 230: BTKV 150, LPDP 30, SIMAK 50. The 550-question acceptance gate still fails because 320 LPDP/SIMAK questions remain. Those source files are unchanged by this BTKV change.
- LPDP and SIMAK full simulations remain blocked where content is insufficient. Real-content end-to-end full simulations still require completing those banks.
- Multiple original English reading passages and passage-aware rendering/import/validation are not implemented; passage imports are rejected.
- The reference-year blueprint is source-editable; an in-app editor is not implemented. Local quick packages support create/delete.
- Optional LPDP essay/interview modules, SIMAK program-specific packs, Capacitor/Android packaging, persisted case progress, comprehensive accessibility review, and real Android installation remain outstanding.
- No Vercel deployment or fresh cloud snapshot restoration was performed. Static configuration is supplied; Chromium offline navigation is tested locally.

The global `content-acceptance` CI job remains deliberately strict; do not weaken or skip its 550-question requirement. BTKV has its own passing technical validation gate.
