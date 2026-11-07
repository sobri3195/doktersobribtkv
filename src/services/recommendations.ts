import type { Answer, Question } from "./model";
export function reviewDue(
  questionId: string,
  answers: Answer[],
  now = Date.now(),
) {
  const last = answers.filter((a) => a.questionId === questionId).at(-1);
  if (!last) return false;
  return now >= last.at + (last.correct ? 7 : 1) * 86400000;
}
export function topicRecommendations(answers: Answer[], bank: Question[]) {
  return [...new Set(bank.map((q) => q.topic))]
    .map((topic) => {
      const ids = new Set(
        bank.filter((q) => q.topic === topic).map((q) => q.id),
      );
      const a = answers.filter((a) => ids.has(a.questionId));
      const accuracy = a.length
        ? (a.filter((a) => a.correct).length / a.length) * 100
        : null;
      return {
        topic,
        attempts: a.length,
        accuracy,
        priority:
          accuracy === null
            ? "Belum dipelajari"
            : accuracy < 50
              ? "Prioritas tinggi"
              : accuracy < 80
                ? "Perlu penguatan"
                : "Lanjutkan topik berikutnya",
      };
    })
    .sort((a, b) => {
      const rank = (value: number | null) =>
        value === null ? 1.5 : value < 50 ? 0 : value < 80 ? 1 : 2;
      return (
        rank(a.accuracy) - rank(b.accuracy) ||
        (a.accuracy ?? 0) - (b.accuracy ?? 0)
      );
    });
}
