import { beforeEach, afterEach, describe, it, expect } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { bundled, legacyBundled, mergeBank } from "../data/bank";
import {
  lpdpQuestionSchema,
  lpdpPracticeSchema,
} from "../services/lpdp-content";
import { lpdpTaxonomy } from "../data/lpdp-taxonomy";
import { passages, stimuli } from "../services/learning-assets";
import {
  makeAttempt,
  score,
  expireSection,
  lpdpBlueprint,
} from "../services/exams";
import { defaults } from "../services/model";
import { save, load } from "../services/storage";
import { parseQuestions, exportCSV } from "../services/import-export";
import { topicRecommendations, reviewDue } from "../services/recommendations";
import {
  quantitative,
  analytic,
  problem,
  verbalLogic,
  assertOracle,
} from "../../scripts/lpdp/oracles";
import { QuestionStimulus } from "../components/QuestionStimulus";
import { Session } from "../pages/Session";
import { useStore } from "../stores/useStore";
const bank = bundled.filter((q) => q.program === "lpdp");
beforeEach(() => {
  localStorage.clear();
  useStore.setState({ data: defaults(), error: "" });
});
afterEach(cleanup);
it.each(["verbal", "quantitative", "problem-solving"])(
  "validates 50 %s questions and all distributions",
  (category) => {
    const qs = bank.filter((q) => q.category === category);
    expect(qs).toHaveLength(50);
    for (const q of qs)
      expect(lpdpQuestionSchema.safeParse(q).success).toBe(true);
    for (const [level, count] of Object.entries({
      easy: 15,
      medium: 25,
      hard: 10,
    }))
      expect(qs.filter((q) => q.difficulty === level)).toHaveLength(count);
    for (const letter of "ABCDE")
      expect(qs.filter((q) => q.correctAnswer === letter)).toHaveLength(10);
    for (const [code, t] of Object.entries(lpdpTaxonomy).filter(
      ([, t]) => t.category === category,
    ))
      expect(
        qs.filter((q) => q.taxonomyCode === code && q.topic === t.label),
      ).toHaveLength(10);
  },
);
it("recomputes 110 numerical, formal-logic and constraint answers", () => {
  let count = 0;
  for (const q of bank) {
    const n = q.number!;
    const result =
      q.category === "quantitative"
        ? quantitative[n](q)
        : q.category === "verbal" && n >= 11 && n <= 20
          ? verbalLogic(q)
          : q.category === "verbal" && n >= 21 && n <= 30
            ? analytic[n](q)
            : q.category === "problem-solving" && n >= 11
              ? problem[n](q)
              : null;
    if (result) {
      expect(() => assertOracle(q, result)).not.toThrow();
      count++;
    }
  }
  expect(count).toBe(110);
});
it("detects corrupted answer keys independently of schema validity", () => {
  const q = bank.find((q) => q.id === "LPDP-QNT-010")!;
  const bad = {
    ...q,
    correctAnswer: q.options.find((o) => o.id !== q.correctAnswer)!.id,
  };
  expect(() => assertOracle(bad, quantitative[10](bad))).toThrow();
});
it("rejects missing fields, unknown references and noncanonical bundled IDs", () => {
  const q = bank[0];
  for (const bad of [
    { ...q, stepByStepSolution: undefined },
    { ...q, quickTip: undefined },
    { ...q, passageId: "MISSING" },
    { ...q, stimulusId: "MISSING" },
    { ...q, options: q.options.slice(0, 4) },
  ])
    expect(lpdpPracticeSchema.safeParse(bad).success).toBe(false);
  const local = { ...q, id: "LOCAL-LPDP" };
  expect(lpdpPracticeSchema.safeParse(local).success).toBe(true);
  expect(lpdpQuestionSchema.safeParse(local).success).toBe(false);
});
it("selects a restorable 60-question 90-minute LPDP 2026 exam with 300-point ceiling", () => {
  const a = makeAttempt("lpdp", "exam", bank, 10, true);
  expect(a.blueprintId).toBe("LPDP_TBS_2026");
  expect(lpdpBlueprint.referenceYear).toBe(2026);
  expect(a.sections.map((s) => s.ids.length)).toEqual([23, 25, 12]);
  expect(a.sections.map((s) => s.minutes)).toEqual([30, 40, 20]);
  expect(new Set(a.sections.flatMap((s) => s.ids)).size).toBe(60);
  for (const id of a.sections.flatMap((s) => s.ids))
    a.answers[id] = bank.find((q) => q.id === id)!.correctAnswer;
  expect(score(a, bank)).toMatchObject({
    correct: 60,
    blank: 0,
    practiceScore: 300,
    subtests: [
      { category: "verbal", score: 115 },
      { category: "quantitative", score: 125 },
      { category: "problem-solving", score: 60 },
    ],
  });
  const d = { ...defaults(), attempt: a };
  expect(save(d)).toBe("");
  expect(load().data.attempt).toEqual(a);
  expect(expireSection(a, a.startedAt + 30 * 60000 + 1).section).toBe(1);
  expect(expireSection(a, a.startedAt + 90 * 60000 + 1).submitted).toBe(true);
});
it("computes configurable scores and subtest blanks without affecting the SIMAK engine", () => {
  const a = makeAttempt("lpdp", "exam", bank, 5);
  a.scoring = { correct: 2, wrong: -1, blank: 0 };
  const [x, y] = a.sections[0].ids;
  const q = bank.find((q) => q.id === x)!,
    wrong = bank.find((q) => q.id === y)!;
  a.answers[x] = q.correctAnswer;
  a.answers[y] = wrong.options.find((o) => o.id !== wrong.correctAnswer)!.id;
  expect(score(a, bank)).toMatchObject({
    practiceScore: 1,
    correct: 1,
    wrong: 1,
    blank: 3,
  });
  expect(score(a, bank).subtests?.reduce((n, s) => n + s.score, 0)).toBe(1);
});
it("preserves old LPDP attempts, bookmarks and notes without adding old records to the active bank", () => {
  const old = legacyBundled.filter((q) => q.program === "lpdp");
  expect(old).toHaveLength(30);
  const a = makeAttempt("lpdp", "study", old, 5);
  expect(score(a, mergeBank([], [], true)).total).toBe(5);
  const d = {
    ...defaults(),
    attempt: a,
    bookmarks: [old[0].id],
    notes: { [old[0].id]: "Arsip" },
  };
  save(d);
  expect(load().data).toEqual(d);
  expect(bundled.filter((q) => q.program === "lpdp")).toHaveLength(150);
});
it("roundtrips shared passage and stimulus references plus structured solutions in JSON/CSV", () => {
  const qs = [
    bank.find((q) => q.passageId)!,
    bank.find((q) => q.stimulusId)!,
    bank.find((q) => q.workedSolution)!,
  ];
  expect(parseQuestions(JSON.stringify(qs))).toEqual(qs);
  expect(parseQuestions(exportCSV(qs), true)).toEqual(qs);
  expect(passages).toHaveLength(5);
  expect(stimuli).toHaveLength(20);
});
it("uses real responses for pedagogical priority and scheduled review", () => {
  const q = bank[0];
  const base = {
    questionId: q.id,
    program: q.program,
    category: q.category,
    topic: q.topic,
    answer: "A",
    at: 1000,
    seconds: 10,
  };
  const answers = [{ ...base, correct: false }];
  expect(topicRecommendations(answers, [q])[0]).toMatchObject({
    accuracy: 0,
    priority: "Prioritas tinggi",
  });
  expect(reviewDue(q.id, answers, 1000 + 86400000)).toBe(true);
  expect(reviewDue(q.id, [{ ...base, correct: true }], 1000 + 86400000)).toBe(
    false,
  );
  expect(reviewDue(q.id, [], Date.now())).toBe(false);
});
it("renders the referenced reading passage once and an accessible data table", () => {
  const passageQuestion = bank.find((q) => q.passageId)!;
  const { unmount } = render(<QuestionStimulus question={passageQuestion} />);
  expect(
    screen.getByRole("region", { name: passages[0].title }),
  ).toBeInTheDocument();
  expect(screen.getAllByText(passages[0].text.split("\n\n")[0])).toHaveLength(
    1,
  );
  unmount();
  render(
    <QuestionStimulus
      question={bank.find((q) => q.stimulusId === "LPDP-QDATA-03")!}
    />,
  );
  expect(screen.getByRole("table")).toBeInTheDocument();
  expect(
    screen.getByRole("columnheader", { name: "Frekuensi" }),
  ).toBeInTheDocument();
});
it("hides the worked solution until an answer is selected and stores the response", () => {
  const q = bank.find((q) => q.id === "LPDP-QNT-010")!;
  const a = makeAttempt("lpdp", "study", [q], 1);
  useStore.setState({ data: { ...defaults(), attempt: a } });
  render(
    <MemoryRouter>
      <Session />
    </MemoryRouter>,
  );
  expect(screen.queryByText("Langkah penyelesaian")).not.toBeInTheDocument();
  expect(document.querySelector(".katex")).toBeNull();
  fireEvent.click(screen.getAllByRole("radio")[0]);
  expect(
    screen.getByRole("heading", { name: "Langkah penyelesaian" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Tips cepat" }),
  ).toBeInTheDocument();
  expect(useStore.getState().data.answers).toHaveLength(1);
});
it("prioritizes measured weaknesses and treats 50% and 80% as transparent rule boundaries", () => {
  const q = bank[0],
    unseen = bank.find((x) => x.topic !== q.topic)!;
  const base = {
    questionId: q.id,
    answer: "A",
    at: 1000,
    seconds: 5,
    program: q.program,
    category: q.category,
    topic: q.topic,
  };
  for (const [correct, priority] of [
    [4, "Prioritas tinggi"],
    [5, "Perlu penguatan"],
    [8, "Lanjutkan topik berikutnya"],
  ] as const) {
    const a = Array.from({ length: 10 }, (_, i) => ({
      ...base,
      correct: i < correct,
    }));
    expect(topicRecommendations(a, [q]).at(0)?.priority).toBe(priority);
  }
  expect(
    topicRecommendations([{ ...base, correct: false }], [unseen, q]).at(0)
      ?.topic,
  ).toBe(q.topic);
});
