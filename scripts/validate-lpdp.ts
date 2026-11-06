import { readFileSync, writeFileSync } from "node:fs";
import katex from "katex";
import { lpdpQuestionSchema } from "../src/services/lpdp-content";
import { lpdpTaxonomy } from "../src/data/lpdp-taxonomy";
import { passages, stimuli } from "../src/services/learning-assets";
import { normalizeStem } from "../src/services/btkv-content";
import {
  quantitative,
  problem,
  analytic,
  verbalLogic,
  assertOracle,
} from "./lpdp/oracles";
import type { Question } from "../src/services/model";
const errors: string[] = [],
  questions: Question[] = [],
  proofs: string[] = [];
const ids = new Set<string>(),
  stems = new Set<string>(),
  explanations = new Set<string>();
const counts: Record<string, unknown> = {};
for (const category of ["verbal", "quantitative", "problem-solving"])
  try {
    const raw: unknown = JSON.parse(
      readFileSync(
        new URL(`../src/data/questions/lpdp/${category}.json`, import.meta.url),
        "utf8",
      ),
    );
    if (!Array.isArray(raw)) throw Error("Array soal diperlukan");
    if (raw.length !== 50)
      errors.push(`${category}: perlu tepat 50, ditemukan ${raw.length}`);
    const bank = raw.map((q) => lpdpQuestionSchema.parse(q));
    for (const q of bank) {
      if (q.category !== category) errors.push(`${q.id}: kategori file salah`);
      const stem = normalizeStem(q.question);
      if (ids.has(q.id) || stems.has(stem))
        errors.push(`${q.id}: duplikat ID/stem`);
      ids.add(q.id);
      stems.add(stem);
      const explanation = normalizeStem(q.explanation);
      if (explanations.has(explanation))
        errors.push(`${q.id}: pembahasan identik`);
      explanations.add(explanation);
      if (!["draft", "needs_review"].includes(q.reviewStatus))
        errors.push(`${q.id}: konten otomatis belum boleh approved`);
      if (q.formula)
        try {
          katex.renderToString(q.formula, { throwOnError: true, trust: false });
        } catch {
          errors.push(`${q.id}: rumus KaTeX tidak valid`);
        }
      try {
        const n = q.number!;
        if (category === "quantitative") {
          assertOracle(q, quantitative[n](q));
          proofs.push(q.id);
        } else if (category === "verbal" && n >= 11 && n <= 20) {
          assertOracle(q, verbalLogic(q));
          proofs.push(q.id);
        } else if (category === "verbal" && n >= 21 && n <= 30) {
          assertOracle(q, analytic[n](q));
          proofs.push(q.id);
        } else if (category === "problem-solving" && n >= 11) {
          assertOracle(q, problem[n](q));
          proofs.push(q.id);
        }
      } catch (e) {
        errors.push(String(e));
      }
    }
    const tally = (field: "difficulty" | "correctAnswer" | "taxonomyCode") =>
      Object.fromEntries(
        [...new Set(bank.map((q) => q[field]))].map((key) => [
          key,
          bank.filter((q) => q[field] === key).length,
        ]),
      );
    const difficulty = tally("difficulty"),
      keys = tally("correctAnswer"),
      topics = tally("taxonomyCode");
    for (const [k, n] of Object.entries({ easy: 15, medium: 25, hard: 10 }))
      if (difficulty[k] !== n) errors.push(`${category}: ${k} harus ${n}`);
    for (const k of "ABCDE")
      if (keys[k] !== 10) errors.push(`${category}: kunci ${k} harus 10`);
    for (const [code, t] of Object.entries(lpdpTaxonomy))
      if (t.category === category && topics[code] !== 10)
        errors.push(`${category}: ${code} harus 10 soal`);
    counts[category] = { total: bank.length, difficulty, keys, topics };
    questions.push(...bank);
  } catch (e) {
    errors.push(`${category}: ${String(e)}`);
  }
if (questions.length !== 150)
  errors.push(`Total ${questions.length}, perlu 150`);
if (
  questions.filter(
    (q) => q.category === "problem-solving" && q.integratesMultipleInformation,
  ).length < 30
)
  errors.push("Minimal 30 soal multi-informasi diperlukan");
for (const p of passages) {
  const words = p.text.split(/\s+/).length;
  if (words < 150 || words > 350)
    errors.push(`${p.id}: panjang bacaan di luar 150–350 kata`);
  if (!questions.some((q) => q.passageId === p.id))
    errors.push(`${p.id}: bacaan tidak digunakan`);
}
for (const s of stimuli)
  if (!questions.some((q) => q.stimulusId === s.id))
    errors.push(`${s.id}: stimulus tidak digunakan`);
if (
  new Set(passages.map((p) => p.id)).size !== passages.length ||
  new Set(stimuli.map((s) => s.id)).size !== stimuli.length
)
  errors.push("ID stimulus/bacaan duplikat");
const suspicious = [];
for (let i = 0; i < questions.length; i++)
  for (let j = i + 1; j < questions.length; j++) {
    const a = new Set(normalizeStem(questions[i].question).split(" ")),
      b = new Set(normalizeStem(questions[j].question).split(" "));
    const common = [...a].filter((t) => b.has(t)).length;
    const similarity = common / (a.size + b.size - common);
    const numericSkeleton = (s: string) =>
      normalizeStem(s).replace(/\d+/g, "#");
    if (
      similarity > 0.65 ||
      numericSkeleton(questions[i].question) ===
        numericSkeleton(questions[j].question)
    )
      suspicious.push({ a: questions[i].id, b: questions[j].id, similarity });
  }
writeFileSync(
  "docs/lpdp-validation.json",
  JSON.stringify(
    {
      total: questions.length,
      technicalValidation: errors.length ? "failed" : "passed",
      categories: counts,
      passages: passages.length,
      stimuli: stimuli.length,
      independentlyComputedChecks: proofs.length,
      checkedIds: proofs,
      suspiciousPairs: suspicious,
      editorialReview: "pending_human_review",
      difficultyCalibration: "editorial_estimates_only",
      officialBlueprintVerification: "unverified_from_user_brief",
      errors,
    },
    null,
    2,
  ) + "\n",
);
errors.forEach((e) => console.error(e));
console.log(
  `${questions.length} soal LPDP; ${proofs.length} pemeriksaan hitungan/logika/enumerasi; ${suspicious.length} pasangan untuk tinjauan; ${errors.length} kesalahan.`,
);
process.exitCode = errors.length ? 1 : 0;
