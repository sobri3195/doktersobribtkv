import { describe, it, expect } from "vitest";
import { bundled, legacyBundled, mergeBank } from "../data/bank";
import { btkvQuestionSchema } from "../services/btkv-content";
import { btkvTaxonomy } from "../data/btkv-taxonomy";
import { makeAttempt, score } from "../services/exams";
import { defaults } from "../services/model";
import { migrate } from "../services/storage";
import { parseQuestions, exportCSV } from "../services/import-export";
const bank = bundled.filter((q) => q.program === "btkv");
describe("BTKV content contract", () => {
  it.each(["thoracic", "cardiac", "vascular"])(
    "%s satisfies exact blueprint",
    (category) => {
      const qs = bank.filter((q) => q.category === category);
      expect(qs).toHaveLength(50);
      for (const q of qs)
        expect(btkvQuestionSchema.safeParse(q).success).toBe(true);
      for (const [difficulty, n] of Object.entries({
        easy: 15,
        medium: 25,
        hard: 10,
      }))
        expect(qs.filter((q) => q.difficulty === difficulty)).toHaveLength(n);
      for (const [format, n] of Object.entries({
        clinical_vignette: 35,
        basic_concept: 10,
        data_interpretation: 5,
      }))
        expect(qs.filter((q) => q.questionType === format)).toHaveLength(n);
      for (const letter of "ABCDE")
        expect(qs.filter((q) => q.correctAnswer === letter)).toHaveLength(10);
      for (const [code, t] of Object.entries(btkvTaxonomy).filter(
        ([, t]) => t.category === category,
      ))
        expect(
          qs.filter((q) => q.taxonomyCode === code && q.topic === t.label),
        ).toHaveLength(5);
    },
  );
  it("rejects missing medical metadata, bad option letters and premature approval", () => {
    const q = bank[0];
    for (const bad of [
      { ...q, number: 50 },
      { ...q, learningObjective: undefined },
      { ...q, clinicalPearl: undefined },
      { ...q, references: [] },
      { ...q, taxonomyCode: "C99" },
      { ...q, reviewStatus: "approved" },
      { ...q, options: q.options.slice(0, 4) },
    ])
      expect(btkvQuestionSchema.safeParse(bad).success).toBe(false);
  });
  it("keeps all automatically authored questions pending review and references unverified", () => {
    expect(bank).toHaveLength(150);
    for (const q of bank) {
      expect(q.reviewStatus).toBe("needs_review");
      expect(
        q.references?.every((r) => r.verificationStatus === "unverified"),
      ).toBe(true);
      expect(q.editorialFlags).toContain("human_medical_review_required");
    }
  });
  it.each(["thoracic", "cardiac", "vascular"])(
    "starts a 50-question %s exam without repetition and persists configurable scoring",
    (category) => {
      const a = makeAttempt("btkv", "exam", bank, 50, false, 40, category);
      expect(a.sections[0].ids).toHaveLength(50);
      expect(new Set(a.sections[0].ids).size).toBe(50);
      expect(
        a.sections[0].ids.every(
          (id) => bank.find((q) => q.id === id)?.category === category,
        ),
      ).toBe(true);
      expect(a.deadline - a.startedAt).toBe(40 * 60000);
      a.scoring = { correct: 2, wrong: -1, blank: 0 };
      const q = bank.find((q) => q.id === a.sections[0].ids[0])!;
      a.answers[q.id] = q.correctAnswer;
      const wrong = bank.find((q) => q.id === a.sections[0].ids[1])!;
      a.answers[wrong.id] = wrong.options.find(
        (o) => o.id !== wrong.correctAnswer,
      )!.id;
      expect(score(a, bank)).toMatchObject({
        correct: 1,
        wrong: 1,
        blank: 48,
        practiceScore: 1,
      });
      const restored = migrate(
        JSON.parse(
          JSON.stringify({ ...defaults(), program: "btkv", attempt: a }),
        ),
      );
      expect(restored.attempt?.scoring).toEqual(a.scoring);
    },
  );
  it("keeps archived content out of current counts but resolves old attempts", () => {
    expect(legacyBundled.filter((q) => q.program === "btkv")).toHaveLength(30);
    expect(mergeBank([], []).filter((q) => q.program === "btkv")).toHaveLength(
      150,
    );
    const old = legacyBundled.slice(0, 5);
    const a = makeAttempt("btkv", "exam", old, 5);
    a.answers[old[0].id] = old[0].correctAnswer;
    expect(score(a, mergeBank([], [], true))).toMatchObject({
      correct: 1,
      blank: 4,
    });
    const d = {
      ...defaults(),
      attempt: a,
      bookmarks: [old[0].id],
      notes: { [old[0].id]: "Catatan asli" },
    };
    expect(migrate(JSON.parse(JSON.stringify(d)))).toEqual(d);
  });
  it("roundtrips new clinical metadata in JSON and CSV without losing legacy compatibility", () => {
    expect(parseQuestions(JSON.stringify(bank.slice(0, 2)))).toEqual(
      bank.slice(0, 2),
    );
    expect(parseQuestions(exportCSV(bank.slice(0, 2)), true)).toEqual(
      bank.slice(0, 2),
    );
    expect(
      parseQuestions(
        exportCSV([...bank.slice(0, 1), ...legacyBundled.slice(0, 1)]),
        true,
      ),
    ).toEqual([...bank.slice(0, 1), ...legacyBundled.slice(0, 1)]);
  });
});

it("allows a new local BTKV ID while retaining required clinical metadata", () => {
  const q = { ...bank[0], id: "LOCAL-CLINICAL-NEW" };
  expect(parseQuestions(JSON.stringify([q]))).toEqual([q]);
  expect(parseQuestions(exportCSV([q]), true)).toEqual([q]);
  expect(btkvQuestionSchema.safeParse(q).success).toBe(false);
});
