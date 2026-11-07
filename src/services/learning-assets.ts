import { z } from "zod";
import passageData from "../data/passages/lpdp.json";
import stimulusData from "../data/stimuli/lpdp.json";
export const passageSchema = z.object({
  id: z.string().min(1),
  program: z.literal("lpdp"),
  title: z.string().min(1),
  text: z.string().min(100),
  sourceType: z.literal("original_practice"),
});
export const stimulusSchema = z
  .object({
    id: z.string().min(1),
    program: z.literal("lpdp"),
    title: z.string().min(1),
    unit: z.string().min(1),
    period: z.string().optional(),
    columns: z.array(z.string().min(1)).min(2),
    rows: z.array(z.array(z.union([z.string(), z.number()]))).min(1),
    kind: z.enum(["table", "bar", "line"]),
    sourceType: z.literal("original_practice"),
  })
  .superRefine((s, ctx) => {
    if (s.rows.some((r) => r.length !== s.columns.length))
      ctx.addIssue({
        code: "custom",
        message: "Lebar baris stimulus tidak sesuai kolom",
      });
    if (
      s.kind !== "table" &&
      s.rows.some((r) => r.slice(1).some((v) => typeof v !== "number"))
    )
      ctx.addIssue({ code: "custom", message: "Seri grafik harus numerik" });
  });
export const passages = z.array(passageSchema).parse(passageData);
export const stimuli = z.array(stimulusSchema).parse(stimulusData);
export type Stimulus = z.infer<typeof stimulusSchema>;
export const dataSufficiencyOptions = [
  "Pernyataan 1 saja cukup; pernyataan 2 saja tidak cukup.",
  "Pernyataan 2 saja cukup; pernyataan 1 saja tidak cukup.",
  "Gabungan cukup, tetapi masing-masing tidak cukup.",
  "Masing-masing pernyataan secara terpisah cukup.",
  "Gabungan kedua pernyataan tidak cukup.",
];
