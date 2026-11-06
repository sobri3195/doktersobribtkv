# Question format and local content

Bundled JSON arrays live in `src/data/questions/<program>/<category>.json`:

- btkv: thoracic, cardiac, vascular
- lpdp: verbal, quantitative, problem-solving
- simak: verbal, quantitative, logic, structure, vocabulary-reading

The runtime schema is `src/services/model.ts`. Required fields: unique `id`, valid program/category, topic, difficulty (`easy`, `medium`, `hard`), type `single_choice`, question, 3–5 distinct `{id,text}` options, correctAnswer matching an option ID, nonempty explanation, distractorExplanations keyed by each incorrect option ID, learningPoint, sourceType `original_practice`, reviewStatus (`draft` or `reviewed`). Subtopic defaults to a basic-concepts label if omitted. Optional formula uses KaTeX syntax; inline math uses `$...$` in rendered question/option/explanation text. All bundled material is original practice, never official past exam content. Generated clinical content must remain draft pending qualified review.

`passageId` is reserved in the schema but passage loading is not implemented; the editor/import rejects it. There are no invented citations. Images, tables, references and content version metadata still require implementation.

JSON imports are arrays. CSV uses named question fields; `options` and `distractorExplanations` must be JSON strings inside correctly quoted CSV cells. Export a current bank as a format example. Duplicate IDs within an import are rejected. Existing IDs produce a preview warning and explicit local override on confirmation. Disabled state is local. Full learning backups include local questions, notes, bookmarks, attempts, history and settings. Do not include passwords or secrets in any content.

Run `npm run validate:questions` after every content change. Exactly 50 per category and 550 total are required for release. Similarity reporting is a heuristic for editorial review, not a replacement for it. Local overrides do not modify bundled files or satisfy the bundled release gate.

## BTKV v2

IDs are BTKV-TH-001…050, BTKV-CD-001…050, BTKV-VS-001…050. Records include `number`, `taxonomyCode` (T01–T10/C01–C10/V01–V10), `questionType` (`clinical_vignette`, `basic_concept`, `data_interpretation`), `learningObjective`, `correctAnswerReason`, `clinicalReasoning`, `clinicalPearl`, `references` (HTTPS URL, verificationStatus, note), `editorialFlags` and `contentVersion: 2`. Five options must be ordered A–E. See `src/services/btkv-content.ts` and `src/data/btkv-taxonomy.ts`. Old questions remain readable without the new fields. CSV serializes references and editorialFlags as JSON cells. Run `npm run validate:btkv` for the BTKV acceptance contract. See BTKV_EDITORIAL.md for the remaining human medical and source-verification requirements.
