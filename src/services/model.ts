import { z } from "zod";
export const programSchema = z.enum(["btkv", "lpdp", "simak"]);
export type Program = z.infer<typeof programSchema>;
export const categories: Record<Program, Record<string, string>> = {
  btkv: {
    thoracic: "Bedah Toraks",
    cardiac: "Bedah Jantung",
    vascular: "Bedah Vaskular",
  },
  lpdp: {
    verbal: "Penalaran Verbal",
    quantitative: "Penalaran Kuantitatif",
    "problem-solving": "Pemecahan Masalah",
  },
  simak: {
    verbal: "PEKA Verbal",
    quantitative: "PEKA Kuantitatif",
    logic: "PEKA Logika",
    structure: "English Structure",
    "vocabulary-reading": "Vocabulary & Reading",
  },
};
export const questionSchema = z
  .object({
    id: z.string().min(1),
    program: programSchema,
    category: z.string().min(1),
    topic: z.string().min(1),
    subtopic: z.string().default("Prinsip dasar"),
    difficulty: z.enum(["easy", "medium", "hard"]),
    type: z.literal("single_choice"),
    question: z.string().min(10),
    options: z
      .array(z.object({ id: z.string().min(1), text: z.string().min(1) }))
      .min(3)
      .max(5),
    correctAnswer: z.string(),
    explanation: z.string().min(10),
    distractorExplanations: z.record(z.string(), z.string().min(1)),
    learningPoint: z.string().min(5),
    sourceType: z.literal("original_practice"),
    reviewStatus: z.enum(["draft", "reviewed"]),
    passageId: z.string().optional(),
    formula: z.string().optional(),
    disabled: z.boolean().optional(),
  })
  .superRefine((q, ctx) => {
    if (!categories[q.program][q.category])
      ctx.addIssue({
        code: "custom",
        message: "Kategori tidak sesuai program",
      });
    if (!q.options.some((o) => o.id === q.correctAnswer))
      ctx.addIssue({ code: "custom", message: "Kunci jawaban tidak valid" });
    if (
      new Set(q.options.map((o) => o.id)).size !== q.options.length ||
      new Set(q.options.map((o) => o.text.trim().toLowerCase())).size !==
        q.options.length
    )
      ctx.addIssue({ code: "custom", message: "Opsi duplikat" });
    for (const o of q.options)
      if (o.id !== q.correctAnswer && !q.distractorExplanations[o.id])
        ctx.addIssue({
          code: "custom",
          message: `Penjelasan pengecoh ${o.id} diperlukan`,
        });
  });
export type Question = z.infer<typeof questionSchema>;
export const answerSchema = z.object({
  questionId: z.string(),
  answer: z.string(),
  correct: z.boolean(),
  at: z.number(),
  seconds: z.number().nonnegative(),
  program: programSchema,
  category: z.string(),
  topic: z.string(),
});
export type Answer = z.infer<typeof answerSchema>;
export const sectionSchema = z.object({
  category: z.string(),
  ids: z.array(z.string()).min(1),
  minutes: z.number().positive(),
});
export const attemptSchema = z.object({
  id: z.string(),
  program: programSchema,
  mode: z.enum(["study", "exam"]),
  sections: z.array(sectionSchema).min(1),
  section: z.number().int().nonnegative(),
  current: z.number().int().nonnegative(),
  startedAt: z.number(),
  sectionStartedAt: z.number(),
  deadline: z.number(),
  answers: z.record(z.string(), z.string()),
  marked: z.array(z.string()),
  elapsed: z.record(z.string(), z.number().nonnegative()),
  submitted: z.boolean(),
});
export type Attempt = z.infer<typeof attemptSchema>;
export const historySchema = z.object({
  id: z.string(),
  program: programSchema,
  at: z.number(),
  correct: z.number(),
  wrong: z.number(),
  blank: z.number(),
  total: z.number(),
  peka: z.number(),
  english: z.number(),
  mode: z.enum(["study", "exam"]),
});
export const dataSchema = z.object({
  version: z.literal(2),
  profile: z.object({
    name: z.string().min(1).max(60),
    avatar: z.enum(["🌱", "🧠", "🎓", "🩺"]),
    goal: z.number().int().min(1).max(200),
    target: z.string().max(100),
    notification: z.boolean(),
    onboarded: z.boolean(),
  }),
  program: programSchema,
  theme: z.enum(["light", "dark"]),
  answers: z.array(answerSchema),
  bookmarks: z.array(z.string()),
  notes: z.record(z.string(), z.string()),
  attempt: attemptSchema.nullable(),
  history: z.array(historySchema),
  localQuestions: z.array(questionSchema),
  disabled: z.array(z.string()),
  packages: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(1),
      program: programSchema,
      count: z.number().int().min(1).max(550),
      minutes: z.number().min(1).max(600),
    }),
  ),
});
export type Data = z.infer<typeof dataSchema>;
export function defaults(): Data {
  return {
    version: 2,
    profile: {
      name: "Pelajar",
      avatar: "🌱",
      goal: 10,
      target: "",
      notification: false,
      onboarded: false,
    },
    program: "lpdp",
    theme: "light",
    answers: [],
    bookmarks: [],
    notes: {},
    attempt: null,
    history: [],
    localQuestions: [],
    disabled: [],
    packages: [],
  };
}
