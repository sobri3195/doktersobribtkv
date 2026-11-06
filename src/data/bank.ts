import { questionSchema, type Question } from "../services/model";
const files = import.meta.glob("./questions/**/*.json", {
  eager: true,
  import: "default",
});
export const bundled: Question[] = Object.values(files).flatMap((data) =>
  (data as unknown[]).map((q) => questionSchema.parse(q)),
);
export function mergeBank(local: Question[], disabled: string[]): Question[] {
  const map = new Map(bundled.map((q) => [q.id, q]));
  for (const q of local) map.set(q.id, q);
  return [...map.values()].map((q) => ({
    ...q,
    disabled: disabled.includes(q.id),
  }));
}
