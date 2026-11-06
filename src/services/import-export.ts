import { btkvClinicalSchema } from "./btkv-content";
import Papa from "papaparse";
import { z } from "zod";
import { questionSchema, type Question } from "./model";
export function parseQuestions(text: string, csv = false): Question[] {
  let raw: unknown;
  if (csv) {
    const parsed = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
    });
    if (parsed.errors.length)
      throw Error(parsed.errors.map((e) => e.message).join("; "));
    raw = parsed.data.map((row) => {
      const q: Record<string, unknown> = { ...row };
      for (const key of [
        "options",
        "distractorExplanations",
        "references",
        "editorialFlags",
      ])
        if (row[key]) q[key] = JSON.parse(row[key]);
        else delete q[key];
      for (const key of ["number", "contentVersion"]) {
        if (row[key]) q[key] = Number(row[key]);
        else delete q[key];
      }
      for (const key of [
        "taxonomyCode",
        "questionType",
        "learningObjective",
        "correctAnswerReason",
        "clinicalReasoning",
        "clinicalPearl",
      ])
        if (!row[key]) delete q[key];
      for (const key of ["passageId", "formula", "disabled"]) {
        if (!row[key]) delete q[key];
        else if (key === "disabled") q[key] = row[key] === "true";
      }
      return q;
    });
  } else raw = JSON.parse(text);
  const questions = z
    .array(questionSchema)
    .min(1)
    .parse(raw)
    .map((q) =>
      q.program === "btkv" && q.contentVersion === 2
        ? btkvClinicalSchema.parse(q)
        : q,
    );
  if (new Set(questions.map((q) => q.id)).size !== questions.length)
    throw Error("ID duplikat dalam impor.");
  return questions;
}
export function exportCSV(questions: Question[]): string {
  return Papa.unparse(
    questions.map((q) => ({
      ...q,
      options: JSON.stringify(q.options),
      distractorExplanations: JSON.stringify(q.distractorExplanations),
      references: q.references ? JSON.stringify(q.references) : "",
      editorialFlags: q.editorialFlags ? JSON.stringify(q.editorialFlags) : "",
    })),
  );
}
