import { questionSchema } from "./model";
import { lpdpTaxonomy } from "../data/lpdp-taxonomy";
import { passages, stimuli, dataSufficiencyOptions } from "./learning-assets";
export const lpdpPracticeSchema = questionSchema.superRefine((q, ctx) => {
  const add = (message: string) => ctx.addIssue({ code: "custom", message });
  if (q.program !== "lpdp" || q.version !== 2)
    add("Program/versi LPDP tidak sesuai");
  if (q.options.map((o) => o.id).join("") !== "ABCDE")
    add("LPDP v2 memerlukan lima opsi A–E");
  const topic = lpdpTaxonomy[q.taxonomyCode as keyof typeof lpdpTaxonomy];
  if (!topic || topic.category !== q.category || topic.label !== q.topic)
    add("Taksonomi LPDP tidak sesuai");
  for (const field of [
    "learningObjective",
    "stepByStepSolution",
    "quickTip",
    "estimatedTimeSeconds",
    "explanationFormat",
  ] as const)
    if (!q[field]) add(`Field LPDP wajib: ${field}`);
  if (q.category === "quantitative" && !q.workedSolution)
    add("Pembahasan kuantitatif terstruktur wajib");
  if (q.passageId && !passages.some((p) => p.id === q.passageId))
    add("Passage ID tidak ditemukan");
  if (q.stimulusId && !stimuli.some((s) => s.id === q.stimulusId))
    add("Stimulus ID tidak ditemukan");
  if (
    q.explanationFormat === "data_sufficiency" &&
    q.options.some((o, i) => o.text !== dataSufficiencyOptions[i])
  )
    add("Definisi opsi kecukupan data harus konsisten A–E");
  if (
    !["draft", "needs_review", "approved", "published"].includes(q.reviewStatus)
  )
    add("Status editorial LPDP tidak valid");
  if (
    /lorem ipsum|jawaban contoh|to be completed|pertanyaan akan ditambahkan/i.test(
      q.question + " " + q.explanation,
    )
  )
    add("Placeholder tidak diizinkan");
  const dollar = (q.question + " " + q.explanation).match(/\$/g)?.length || 0;
  if (dollar % 2) add("Delimiter matematika tidak berpasangan");
});
export const lpdpQuestionSchema = lpdpPracticeSchema.superRefine((q, ctx) => {
  const prefix = {
    verbal: "VRB",
    quantitative: "QNT",
    "problem-solving": "PS",
  }[q.category];
  if (
    !prefix ||
    !q.number ||
    q.id !== `LPDP-${prefix}-${String(q.number).padStart(3, "0")}`
  )
    ctx.addIssue({
      code: "custom",
      message: "ID/nomor bank LPDP tidak sesuai",
    });
});
