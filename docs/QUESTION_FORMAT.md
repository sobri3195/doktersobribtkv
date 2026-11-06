# Question format and local content

Bundled JSON arrays live in `src/data/questions/<program>/<category>.json`:

- btkv: thoracic, cardiac, vascular
- lpdp: verbal, quantitative, problem-solving
- simak: verbal, quantitative, logic, structure, vocabulary-reading

The runtime schema is `src/services/model.ts`. Required fields: unique `id`, valid program/category, topic, difficulty (`easy`, `medium`, `hard`), type `single_choice`, question, 3–5 distinct `{id,text}` options, correctAnswer matching an option ID, nonempty explanation, distractorExplanations keyed by each incorrect option ID, learningPoint, sourceType `original_practice`, reviewStatus (`draft` or `reviewed`). Subtopic defaults to a basic-concepts label if omitted. Optional formula uses KaTeX syntax; inline math uses `$...$` in rendered question/option/explanation text. All bundled material is original practice, never official past exam content. Generated clinical content must remain draft pending qualified review.

LPDP passage and stimulus IDs resolve against the bundled resources in `src/data/passages/lpdp.json` and `src/data/stimuli/lpdp.json`. The editor/import rejects unknown IDs. There are no invented citations. Shared LPDP tables/graphs and version metadata are supported. Arbitrary inline image assets and custom shared-resource imports still require implementation.

JSON imports are arrays. CSV uses named question fields; `options` and `distractorExplanations` must be JSON strings inside correctly quoted CSV cells. Export a current bank as a format example. Duplicate IDs within an import are rejected. Existing IDs produce a preview warning and explicit local override on confirmation. Disabled state is local. Full learning backups include local questions, notes, bookmarks, attempts, history and settings. Do not include passwords or secrets in any content.

Run `npm run validate:questions` after every content change. Exactly 50 per category and 550 total are required for release. Similarity reporting is a heuristic for editorial review, not a replacement for it. Local overrides do not modify bundled files or satisfy the bundled release gate.

## BTKV v2

IDs are BTKV-TH-001…050, BTKV-CD-001…050, BTKV-VS-001…050. Records include `number`, `taxonomyCode` (T01–T10/C01–C10/V01–V10), `questionType` (`clinical_vignette`, `basic_concept`, `data_interpretation`), `learningObjective`, `correctAnswerReason`, `clinicalReasoning`, `clinicalPearl`, `references` (HTTPS URL, verificationStatus, note), `editorialFlags` and `contentVersion: 2`. Five options must be ordered A–E. See `src/services/btkv-content.ts` and `src/data/btkv-taxonomy.ts`. Old questions remain readable without the new fields. CSV serializes references and editorialFlags as JSON cells. Run `npm run validate:btkv` for the BTKV acceptance contract. See BTKV_EDITORIAL.md for the remaining human medical and source-verification requirements.

## LPDP v2

Bundled IDs are LPDP-VRB-001…050, LPDP-QNT-001…050 and LPDP-PS-001…050. Extra fields include `version: 2`, `number`, `taxonomyCode` (V01–V05, Q01–Q05, P01–P05), `learningObjective`, `stepByStepSolution`, `quickTip`, `estimatedTimeSeconds`, `explanationFormat`, and optional `passageId` / `stimulusId`. Quantitative records require `workedSolution` (known, asked, formula, calculation array, result, check). Numeric answer options carry `numericValue` for independent checks. All records retain the original `single_choice` type. CSV serializes arrays and workedSolution as JSON cells. See LPDP_EDITORIAL.md and run `npm run validate:lpdp`.
