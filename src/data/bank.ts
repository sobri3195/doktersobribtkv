import { btkvQuestionSchema } from "../services/btkv-content";
import legacyData from "./legacy/btkv-v1.json";
import { questionSchema, type Question } from "../services/model";
const files = import.meta.glob("./questions/**/*.json", {
  eager: true,
  import: "default",
});
export const bundled: Question[] = Object.values(files).flatMap((data) =>
  (data as unknown[]).map((raw) => {
    const q = questionSchema.parse(raw);
    return q.program === "btkv" && q.contentVersion === 2
      ? btkvQuestionSchema.parse(q)
      : q;
  }),
);
export const legacyBundled: Question[] = legacyData.map((q) =>
  questionSchema.parse(q),
);
export function mergeBank(
  local: Question[],
  disabled: string[],
  includeLegacy = false,
): Question[] {
  const source = includeLegacy ? [...legacyBundled, ...bundled] : bundled;
  const map = new Map(source.map((q) => [q.id, q]));
  for (const q of local) map.set(q.id, q);
  return [...map.values()].map((q) => ({
    ...q,
    disabled: disabled.includes(q.id),
  }));
}
