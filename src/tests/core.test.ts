import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  defaults,
  questionSchema,
  categories,
  type Question,
} from "../services/model";
import { migrate, load, save, KEYS, parseBackup } from "../services/storage";
import { makeAttempt, score, expireSection } from "../services/exams";
import { parseQuestions, exportCSV } from "../services/import-export";
import { bundled, mergeBank } from "../data/bank";
import { useStore } from "../stores/useStore";
beforeEach(() => {
  localStorage.clear();
  useStore.setState({ data: defaults(), error: "" });
});
describe("bank content", () => {
  it("loads all currently authored questions with valid schemas and unique IDs", () => {
    expect(bundled.length).toBe(350);
    expect(new Set(bundled.map((q) => q.id)).size).toBe(350);
    for (const q of bundled)
      expect(questionSchema.safeParse(q).success).toBe(true);
  });
  it("covers all eleven categories but retains LPDP and SIMAK counts while completing BTKV", () => {
    for (const [p, cats] of Object.entries(categories))
      for (const cat of Object.keys(cats))
        expect(
          bundled.filter((q) => q.program === p && q.category === cat),
        ).toHaveLength(p !== "simak" ? 50 : 10);
  });
  it("rejects bad keys, repeated options, missing distractors and category mismatch", () => {
    const q = bundled[0];
    for (const bad of [
      { ...q, correctAnswer: "Z" },
      { ...q, options: [q.options[0], q.options[0], q.options[2]] },
      { ...q, distractorExplanations: {} },
      { ...q, category: "bad" },
    ])
      expect(questionSchema.safeParse(bad).success).toBe(false);
  });
  it("keeps bundled data immutable when using local overrides", () => {
    const original = bundled[0];
    expect(
      mergeBank(
        [{ ...original, question: "Perubahan lokal yang eksplisit" }],
        [],
      ).find((q) => q.id === original.id)?.question,
    ).not.toBe(original.question);
    expect(bundled[0]).toBe(original);
  });
});
describe("exams", () => {
  it("never repeats question IDs", () => {
    const a = makeAttempt("lpdp", "study", bundled, 50);
    expect(new Set(a.sections[0].ids).size).toBe(a.sections[0].ids.length);
  });
  it("fails full simulation if any category is insufficient", () => {
    expect(() => makeAttempt("simak", "exam", bundled, 10, true)).toThrow(
      "perlu",
    );
  });
  it("selects exact full blueprint counts when sufficient content is provided", () => {
    const pool: Question[] = [];
    for (const cat of Object.keys(categories.simak)) {
      const sample = bundled.find(
        (q) => q.program === "simak" && q.category === cat,
      )!;
      for (let i = 0; i < 50; i++) pool.push({ ...sample, id: `${cat}-${i}` });
    }
    const a = makeAttempt("simak", "exam", pool, 10, true);
    expect(a.sections.map((s) => s.ids.length)).toEqual([40, 35, 25, 40, 50]);
    expect(a.sections.reduce((n, s) => n + s.minutes, 0)).toBe(210);
  });
  it("separates PEKA negative marking and English scoring", () => {
    const pool = bundled.filter((q) => q.program === "simak");
    const qs = [
      pool.find((q) => q.category === "logic")!,
      pool.find((q) => q.category === "verbal")!,
      pool.find((q) => q.category === "structure")!,
      pool.find((q) => q.category === "quantitative")!,
    ];
    const a = makeAttempt("simak", "exam", qs, 4);
    a.answers = {
      [qs[0].id]: qs[0].correctAnswer,
      [qs[1].id]: "WRONG",
      [qs[2].id]: qs[2].correctAnswer,
    };
    expect(score(a, qs)).toEqual({
      correct: 2,
      wrong: 1,
      blank: 1,
      total: 4,
      peka: 3,
      english: 1,
    });
  });
  it("restores deadlines and advances across all expired sections", () => {
    const a = makeAttempt("lpdp", "exam", bundled, 5);
    a.sections = [
      { category: "a", ids: ["a"], minutes: 1 },
      { category: "b", ids: ["b"], minutes: 1 },
    ];
    a.deadline = 60000;
    expect(expireSection(a, 90000)).toMatchObject({
      section: 1,
      deadline: 120000,
      submitted: false,
    });
    expect(expireSection(a, 120001).submitted).toBe(true);
  });
});
describe("storage and imports", () => {
  it("roundtrips complete backups including attempts and bookmarks", () => {
    const d = defaults();
    d.attempt = makeAttempt("lpdp", "exam", bundled, 5);
    d.bookmarks = [bundled[0].id];
    expect(save(d)).toBe("");
    expect(load().data).toEqual(d);
    expect(parseBackup(JSON.stringify(d))).toEqual(d);
  });
  it("migrates version 1 and rejects unsupported versions", () => {
    expect(migrate({ ...defaults(), version: 1 }).version).toBe(2);
    expect(() => migrate({ ...defaults(), version: 99 })).toThrow();
  });
  it("recovers corrupted data and preserves a raw recovery copy on next write", () => {
    localStorage.setItem(KEYS.data, "broken");
    expect(load().error).toBeTruthy();
    save(defaults());
    expect(localStorage.getItem(KEYS.recovery)).toBe("broken");
  });
  it("reports quota failure without claiming persistence", () => {
    const spy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new DOMException("Full", "QuotaExceededError");
      });
    expect(save(defaults())).toContain("gagal");
    spy.mockRestore();
  });
  it("JSON and CSV roundtrip and duplicate rejection", () => {
    const qs = bundled.slice(0, 2);
    expect(parseQuestions(JSON.stringify(qs))).toEqual(qs);
    expect(parseQuestions(exportCSV(qs), true)).toEqual(qs);
    expect(() => parseQuestions(JSON.stringify([qs[0], qs[0]]))).toThrow(
      "duplikat",
    );
  });
  it("retains progress while switching programs", () => {
    useStore
      .getState()
      .update((d) => ({ ...d, bookmarks: ["some-id"], program: "simak" }));
    useStore.getState().update((d) => ({ ...d, program: "btkv" }));
    expect(useStore.getState().data.bookmarks).toEqual(["some-id"]);
  });
});
