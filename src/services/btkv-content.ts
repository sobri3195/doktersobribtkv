import { questionSchema } from "./model";
import { btkvTaxonomy } from "../data/btkv-taxonomy";
export const btkvClinicalSchema = questionSchema.superRefine((q, ctx) => {
  const add = (message: string) => ctx.addIssue({ code: "custom", message });
  if (q.program !== "btkv") add("Program harus btkv");
  if (q.options.map((o) => o.id).join("") !== "ABCDE")
    add("BTKV memerlukan lima opsi A–E");
  const topic = btkvTaxonomy[q.taxonomyCode as keyof typeof btkvTaxonomy];
  if (!topic || topic.category !== q.category || topic.label !== q.topic)
    add("Taksonomi BTKV tidak valid");
  for (const field of [
    "questionType",
    "learningObjective",
    "correctAnswerReason",
    "clinicalReasoning",
    "clinicalPearl",
  ] as const)
    if (!q[field]) add(`Field BTKV wajib: ${field}`);
  if (!q.references?.length)
    add("Sumber atau status kebutuhan verifikasi wajib disertakan");
  if (
    q.references?.some((r) => r.verificationStatus === "unverified") &&
    !q.editorialFlags?.includes("source_not_verified")
  )
    add("Sumber belum diverifikasi harus diberi flag");
  if (
    !["draft", "needs_review", "approved", "published"].includes(q.reviewStatus)
  )
    add("Status editorial BTKV tidak valid");
  if (
    q.references?.some((r) => r.verificationStatus === "unverified") &&
    ["approved", "published"].includes(q.reviewStatus)
  )
    add("Konten belum terverifikasi tidak dapat disetujui atau dipublikasikan");
  if (q.contentVersion !== 2) add("Versi konten BTKV harus 2");
  if (
    /lorem ipsum|jawaban contoh|to be completed|pertanyaan akan ditambahkan/i.test(
      q.question + " " + q.explanation,
    )
  )
    add("Placeholder tidak diizinkan");
});
export const btkvQuestionSchema = btkvClinicalSchema.superRefine((q, ctx) => {
  const add = (message: string) => ctx.addIssue({ code: "custom", message });
  const prefixes = { thoracic: "TH", cardiac: "CD", vascular: "VS" };
  const prefix = prefixes[q.category as keyof typeof prefixes];
  if (
    !prefix ||
    !q.number ||
    q.id !== `BTKV-${prefix}-${String(q.number).padStart(3, "0")}`
  )
    add("Nomor dan ID BTKV tidak sesuai");
});
export function normalizeStem(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}
