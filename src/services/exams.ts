import { type Program, type Question, type Attempt } from "./model";
export const blueprints = {
  lpdp: [
    ["verbal", 23, 30],
    ["quantitative", 25, 40],
    ["problem-solving", 12, 20],
  ],
  simak: [
    ["verbal", 40, 30],
    ["quantitative", 35, 50],
    ["logic", 25, 40],
    ["structure", 40, 30],
    ["vocabulary-reading", 50, 60],
  ],
  btkv: [
    ["thoracic", 10, 15],
    ["cardiac", 10, 15],
    ["vascular", 10, 15],
  ],
} as const;
export function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function makeAttempt(
  program: Program,
  mode: "study" | "exam",
  bank: Question[],
  count = 10,
  full = false,
  minutes = 15,
  category?: string,
): Attempt {
  const available = bank.filter(
    (q) =>
      q.program === program &&
      !q.disabled &&
      (!category || q.category === category),
  );
  const sections = full
    ? blueprints[program].map(([category, n, minutes]) => {
        const pool = available.filter((q) => q.category === category);
        if (pool.length < n)
          throw Error(`${category}: perlu ${n} soal, tersedia ${pool.length}.`);
        return {
          category,
          ids: shuffle(pool)
            .slice(0, n)
            .map((q) => q.id),
          minutes,
        };
      })
    : [
        {
          category: category || "Campuran",
          ids: shuffle(available)
            .slice(0, count)
            .map((q) => q.id),
          minutes,
        },
      ];
  if (!sections[0].ids.length) throw Error("Tidak ada soal untuk filter ini.");
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    program,
    mode,
    sections,
    section: 0,
    current: 0,
    startedAt: now,
    sectionStartedAt: now,
    deadline: now + sections[0].minutes * 60000,
    answers: {},
    marked: [],
    elapsed: {},
    submitted: false,
  };
}
export function score(attempt: Attempt, bank: Question[]) {
  let correct = 0,
    wrong = 0,
    blank = 0,
    peka = 0,
    english = 0;
  for (const id of attempt.sections.flatMap((s) => s.ids)) {
    const q = bank.find((q) => q.id === id);
    if (!q)
      throw Error(
        `Soal ${id} tidak tersedia. Pulihkan bank lokal yang digunakan.`,
      );
    const answer = attempt.answers[id];
    const right = answer === q.correctAnswer;
    if (!answer) blank++;
    else if (right) correct++;
    else wrong++;
    if (attempt.program === "simak") {
      if (["structure", "vocabulary-reading"].includes(q.category))
        english += right ? 1 : 0;
      else peka += !answer ? 0 : right ? 4 : -1;
    }
  }
  const practiceScore =
    attempt.program === "btkv"
      ? {
          practiceScore:
            correct * (attempt.scoring?.correct ?? 1) +
            wrong * (attempt.scoring?.wrong ?? 0) +
            blank * (attempt.scoring?.blank ?? 0),
        }
      : {};
  return {
    ...practiceScore,
    correct,
    wrong,
    blank,
    total: correct + wrong + blank,
    peka,
    english,
  };
}
export function expireSection(a: Attempt, now = Date.now()): Attempt {
  let next = { ...a };
  while (!next.submitted && now >= next.deadline) {
    const section = next.section + 1;
    if (section >= next.sections.length) return { ...next, submitted: true };
    const start = next.deadline;
    next = {
      ...next,
      section,
      current: 0,
      sectionStartedAt: start,
      deadline: start + next.sections[section].minutes * 60000,
    };
  }
  return next;
}
