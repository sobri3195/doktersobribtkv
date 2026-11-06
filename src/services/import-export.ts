import { lpdpPracticeSchema } from "./lpdp-content";
import { passages, stimuli } from "./learning-assets";
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
        "stepByStepSolution",
        "workedSolution",
      ])
        if (row[key]) q[key] = JSON.parse(row[key]);
        else delete q[key];
      for (const key of [
        "number",
        "contentVersion",
        "version",
        "estimatedTimeSeconds",
      ]) {
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
        "stimulusId",
        "quickTip",
        "explanationFormat",
        "stimulusKind",
      ])
        if (!row[key]) delete q[key];
      if (row.integratesMultipleInformation)
        q.integratesMultipleInformation =
          row.integratesMultipleInformation === "true";
      else delete q.integratesMultipleInformation;
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
        : q.program === "lpdp" && q.version === 2
          ? lpdpPracticeSchema.parse(q)
          : q,
    );
  for (const q of questions) {
    if (q.passageId && !passages.some((p) => p.id === q.passageId))
      throw Error(
        "Passage ID tidak tersedia; gunakan bacaan bawaan atau teks mandiri dalam soal.",
      );
    if (q.stimulusId && !stimuli.some((s) => s.id === q.stimulusId))
      throw Error("Stimulus ID tidak tersedia.");
  }
  if (new Set(questions.map((q) => q.id)).size !== questions.length)
    throw Error("ID duplikat dalam impor.");
  return questions;
}
export function exportCSV(questions: Question[]): string {
  const rows = questions.map((q) => ({
    ...q,
    options: JSON.stringify(q.options),
    distractorExplanations: JSON.stringify(q.distractorExplanations),
    references: q.references ? JSON.stringify(q.references) : "",
    editorialFlags: q.editorialFlags ? JSON.stringify(q.editorialFlags) : "",
    stepByStepSolution: q.stepByStepSolution
      ? JSON.stringify(q.stepByStepSolution)
      : "",
    workedSolution: q.workedSolution ? JSON.stringify(q.workedSolution) : "",
  }));
  const fields = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  return Papa.unparse({
    fields,
    data: rows.map((row) =>
      fields.map((field) => (row as Record<string, unknown>)[field] ?? ""),
    ),
  });
}
