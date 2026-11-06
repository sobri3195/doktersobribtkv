# Add 150 BTKV clinical practice questions and category tryouts

BTKV previously contained only 30 introductory questions with three options. This change replaces the active bank with 150 original five-option SBAs (50 each in thoracic, cardiac and vascular surgery). Each field has ten five-question topics, the requested 15/25/10 difficulty and 35/10/5 question-format distributions, and balanced A–E answer keys.

Adds backward-compatible clinical metadata and a strict `validate:btkv` command, topic filters and subject start buttons, configurable category/mixed tryouts, persisted practice scoring, and clinical pearls/source status after study answers or final submission. Preserves the old 30 records outside the active bank so saved attempts, bookmarks and notes still resolve. LPDP and SIMAK question files are unchanged; existing scoring and browser flows are regression-tested.

All 150 questions remain **needs_review**. Source pointers from the brief are **unverified** because the supplied source request was blocked by network policy. No human medical peer review, guideline currency or verified per-question bibliography is claimed. Qualified editorial review is required; see docs/BTKV_EDITORIAL.md and docs/btkv-validation.json.

Validation: `npm run validate:btkv` passes (150 questions, zero technical errors); `npm test` passes 27 tests; `npm run build` passes with PWA precache generation; all eight Chromium browser journeys pass, including offline BTKV practice. `npm run format:check` passes. The original global 550-question gate still fails at 230 active questions because LPDP/SIMAK lack 320 questions; this is unchanged scope outside BTKV. No deployment was performed.
