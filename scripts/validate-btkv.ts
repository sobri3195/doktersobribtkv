import { readFileSync, writeFileSync } from "node:fs";
import {
  btkvQuestionSchema,
  normalizeStem,
} from "../src/services/btkv-content";
import { btkvTaxonomy } from "../src/data/btkv-taxonomy";
import type { Question } from "../src/services/model";
const questions: Question[] = [];
const errors: string[] = [];
const seenIds = new Set<string>();
const seenStems = new Set<string>();
const report: Record<string, unknown> = {};
for (const category of ["thoracic", "cardiac", "vascular"]) {
  try {
    const raw: unknown = JSON.parse(
      readFileSync(
        new URL(`../src/data/questions/btkv/${category}.json`, import.meta.url),
        "utf8",
      ),
    );
    if (!Array.isArray(raw)) throw Error("Bank harus array");
    if (raw.length !== 50)
      errors.push(`${category}: wajib 50 soal, ditemukan ${raw.length}`);
    const bank = raw.map((q) => btkvQuestionSchema.parse(q));
    for (const q of bank) {
      if (q.category !== category) errors.push(`${q.id}: kategori salah`);
      const stem = normalizeStem(q.question);
      if (seenIds.has(q.id) || seenStems.has(stem))
        errors.push(`${q.id}: duplikat ID atau stem`);
      seenIds.add(q.id);
      seenStems.add(stem);
      if (!["draft", "needs_review"].includes(q.reviewStatus))
        errors.push(
          `${q.id}: bank otomatis belum boleh disetujui tanpa tinjauan manusia`,
        );
    }
    const counts = (
      field: "difficulty" | "questionType" | "correctAnswer" | "taxonomyCode",
    ) =>
      Object.fromEntries(
        [...new Set(bank.map((q) => q[field]))].map((key) => [
          key,
          bank.filter((q) => q[field] === key).length,
        ]),
      );
    const difficulty = counts("difficulty"),
      formats = counts("questionType"),
      keys = counts("correctAnswer"),
      topics = counts("taxonomyCode");
    for (const [key, n] of Object.entries({ easy: 15, medium: 25, hard: 10 }))
      if (difficulty[key] !== n)
        errors.push(`${category}: difficulty ${key} harus ${n}`);
    for (const [key, n] of Object.entries({
      clinical_vignette: 35,
      basic_concept: 10,
      data_interpretation: 5,
    }))
      if (formats[key] !== n)
        errors.push(`${category}: format ${key} harus ${n}`);
    for (const key of "ABCDE")
      if (keys[key] !== 10) errors.push(`${category}: jawaban ${key} harus 10`);
    for (const [code, topic] of Object.entries(btkvTaxonomy))
      if (topic.category === category && topics[code] !== 5)
        errors.push(`${category}: topik ${code} harus 5`);
    report[category] = {
      total: bank.length,
      difficulty,
      formats,
      keys,
      topics,
    };
    questions.push(...bank);
  } catch (error) {
    errors.push(`${category}: ${String(error)}`);
  }
}
const similar = [];
for (let i = 0; i < questions.length; i++)
  for (let j = i + 1; j < questions.length; j++) {
    const a = new Set(normalizeStem(questions[i].question).split(" ")),
      b = new Set(normalizeStem(questions[j].question).split(" "));
    const intersection = [...a].filter((t) => b.has(t)).length;
    const similarity = intersection / (a.size + b.size - intersection);
    if (similarity > 0.6)
      similar.push({ a: questions[i].id, b: questions[j].id, similarity });
  }
if (questions.length !== 150)
  errors.push(`Total wajib 150, ditemukan ${questions.length}`);
writeFileSync(
  "docs/btkv-validation.json",
  JSON.stringify(
    {
      total: questions.length,
      technicalValidation: errors.length ? "failed" : "passed",
      medicalReview: "pending_human_review",
      referenceVerification: "blocked_by_network_policy",
      categories: report,
      similarityThreshold: 0.6,
      suspiciousPairs: similar,
      editorialQueue: questions.map((q) => ({
        id: q.id,
        flags: q.editorialFlags,
      })),
      errors,
    },
    null,
    2,
  ) + "\n",
);
for (const error of errors) console.error(error);
console.log(
  `${questions.length} soal BTKV; ${similar.length} pasangan perlu tinjauan kemiripan; ${errors.length} kesalahan teknis. Tinjauan medis dan verifikasi sumber belum selesai.`,
);
process.exitCode = errors.length ? 1 : 0;
