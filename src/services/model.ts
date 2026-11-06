import { z } from "zod";
export const programSchema = z.enum(["btkv", "lpdp", "simak"]);
export type Program = z.infer<typeof programSchema>;
export const categories: Record<Program, Record<string, string>> = {
  btkv: {
    thoracic: "Bedah Toraks",
    cardiac: "Bedah Kardiak",
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
      .array(
        z.object({
          id: z.string().min(1),
          text: z.string().min(1),
          numericValue: z.number().optional(),
        }),
      )
      .min(3)
      .max(5),
    correctAnswer: z.string(),
    explanation: z.string().min(10),
    distractorExplanations: z.record(z.string(), z.string().min(1)),
    learningPoint: z.string().min(5),
    sourceType: z.literal("original_practice"),
    reviewStatus: z.enum([
      "draft",
      "needs_review",
      "approved",
      "published",
      "reviewed",
    ]),
    number: z.number().int().min(1).max(50).optional(),
    taxonomyCode: z.string().optional(),
    questionType: z
      .enum(["clinical_vignette", "basic_concept", "data_interpretation"])
      .optional(),
    learningObjective: z.string().min(10).optional(),
    correctAnswerReason: z.string().min(10).optional(),
    clinicalReasoning: z.string().min(10).optional(),
    clinicalPearl: z.string().min(10).optional(),
    references: z
      .array(
        z.object({
          url: z
            .url()
            .refine(
              (url) => url.startsWith("https://"),
              "Referensi harus HTTPS",
            ),
          verificationStatus: z.enum(["unverified", "verified"]),
          note: z.string().min(10),
        }),
      )
      .optional(),
    editorialFlags: z.array(z.string().min(1)).optional(),
    contentVersion: z.number().int().positive().optional(),
    version: z.number().int().positive().optional(),
    stimulusId: z.string().optional(),
    stepByStepSolution: z.array(z.string().min(5)).min(3).optional(),
    quickTip: z.string().min(10).optional(),
    estimatedTimeSeconds: z.number().int().positive().optional(),
    explanationFormat: z
      .enum(["reasoning", "worked_numeric", "data_sufficiency"])
      .optional(),
    workedSolution: z
      .object({
        known: z.string().min(5),
        asked: z.string().min(5),
        formula: z.string().min(1),
        calculation: z.array(z.string().min(5)).min(1),
        result: z.string().min(1),
        check: z.string().min(5),
      })
      .optional(),
    integratesMultipleInformation: z.boolean().optional(),
    stimulusKind: z
      .enum(["narrative", "table", "constraint", "bar", "line"])
      .optional(),
    passageId: z.string().optional(),
    formula: z.string().optional(),
    disabled: z.boolean().optional(),
  })
  .superRefine((q, ctx) => {
    if (q.program === "btkv" && q.contentVersion === 2) {
      if (q.options.map((o) => o.id).join("") !== "ABCDE")
        ctx.addIssue({
          code: "custom",
          message: "BTKV v2 memerlukan opsi A–E",
        });
      if (
        q.references?.some((ref) => ref.verificationStatus === "unverified") &&
        ["approved", "published"].includes(q.reviewStatus)
      )
        ctx.addIssue({
          code: "custom",
          message: "Sumber belum diverifikasi; status persetujuan tidak valid",
        });
    }
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
  blueprintId: z.string().optional(),
  scoring: z
    .object({
      correct: z.number().min(-10).max(10),
      wrong: z.number().min(-10).max(10),
      blank: z.number().min(-10).max(10),
    })
    .optional(),
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
  subtests: z
    .array(
      z.object({
        category: z.string(),
        correct: z.number(),
        wrong: z.number(),
        blank: z.number(),
        score: z.number(),
      }),
    )
    .optional(),
  durationSeconds: z.number().nonnegative().optional(),
  practiceScore: z.number().optional(),
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
