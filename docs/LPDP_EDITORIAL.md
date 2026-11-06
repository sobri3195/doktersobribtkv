# LPDP practice bank: content and verification

The active bank contains exactly 150 original practice SBAs, 50 in each category. Each category has five ten-question topics, 15 easy / 25 medium / 10 hard questions, and ten keys at each A–E position. These are internal learning topics, not an official LPDP syllabus. All questions remain `needs_review`. Difficulty and estimated time are editorial judgments, not psychometric measurements.

## Shared learning resources

Five original passages (169–180 words each) are stored once in `src/data/passages/lpdp.json` and referenced by ten reading questions. They cover digital public services, health-service evaluation, infrastructure sustainability, research transparency and cultural participation. Twenty original table/graph stimuli live in `src/data/stimuli/lpdp.json`; titles, units, column labels and periods where relevant are rendered with accessible data tables. Graph values come from the same rows as the tables.

Every question has three or more explicit reasoning steps, four individual distractor rationales, a learning objective, key concept, quick tip, time estimate and editorial status. Quantitative questions add structured known/asked/formula/calculation/result/check fields. Data-sufficiency questions use fixed A–E definitions; their options are not shuffled independently of those definitions.

## Independent computations

`npm run validate:lpdp` validates schemas, counts, distributions, IDs, answer keys, references to shared resources, duplicated stems/explanations, and KaTeX syntax. It also invokes `scripts/lpdp/oracles.ts`, which recomputes answers from separately encoded problem inputs and constraints:

- All 50 quantitative items: arithmetic, algebra, sequences, finite-domain data-sufficiency enumeration and calculations using the actual stimulus rows.
- Ten verbal logic items: truth tables and finite predicate models.
- Ten verbal analytical items: permutations, positions and team assignments.
- Forty problem-solving items: actual stimulus ratios, enumerated assignments and subsets, objective functions, probabilities and capacity/rate calculations.

This totals 110 automated reasoning checks, rather than 110 separate unit tests. Numeric answers are matched to option numeric values with a tolerance; validators also require exactly one matching numeric option. Proof inputs are intentionally separate from answer keys, so changing a key without changing the underlying model fails. However, the hand-encoded models must still be checked against the wording by an editor: successful computation alone cannot prove that no unstated assumption exists. The remaining 40 language/argument items require semantic editorial review.

Five similar-text pairs remain flagged in `docs/lpdp-validation.json`. They occur within the standardized data-sufficiency format and test different targets/conditions. They are retained as review candidates, not silently waived or claimed to have passed human review. Numeric-skeleton detection and token similarity are heuristics, not proofs of originality. Review distractor plausibility, ambiguous wording, cognitive demand and answer-length cues for every question.

## Reference-year examination blueprint

`src/data/blueprints/lpdp-2026.json` has ID `LPDP_TBS_2026` with sections 23/30, 25/40 and 12/20 questions/minutes (60 questions, 90 minutes). Its values come from the supplied brief. Access to the supplied LPDP website was denied by network policy; no independent verification of the official 2026 guide is claimed. Both supplied URLs are retained for verification. This source-editable configuration must be checked and updated for later reference years.

The default application simulation scoring is +5/0/0, producing 300 points for 60 correct answers. Users can configure practice points. The UI labels these as application simulation rules, not an official score scale or passing grade. Results preserve category scores, blanks, correct/wrong counts and duration. Section deadlines use absolute timestamps; active answers, deadlines and the blueprint ID survive refresh. Client clocks and LocalStorage are editable, so the exam is not secure or certified.

## Pedagogical review scheduling

Topic recommendations use actual attempts on current question IDs: below 50% accuracy is high priority, 50–79% needs reinforcement, at least 80% suggests continuing. Unattempted topics are labeled unstudied. Scheduled review becomes due one day after an incorrect response or seven days after a correct response. These are transparent application rules, not validated memory or admission predictions. The existing daily goal remains user-configurable.

## Backward compatibility and local content

The prior 30 LPDP records remain in `src/data/legacy/lpdp-v1.json`, excluded from the active-bank glob but available to saved attempts and the profile archive. Old answers are not reassigned to unrelated new questions. Additive schema fields preserve old backups; bundled content is never copied wholesale into LocalStorage.

JSON/CSV preserve steps, worked solutions, numeric options and shared-resource references, including mixed-category exports. CSV headers use the union of all row fields rather than only the first row. Local questions can use custom IDs; canonical LPDP IDs are enforced only for bundled content. Imports may refer to existing bundled passages/stimuli. New custom shared resources are not imported by the question-only importer: use an existing resource ID or put a standalone stimulus in the question text. Unknown resource IDs are rejected. Source updates shared with all users still require a repository change and redeployment.
