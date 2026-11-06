import { QuestionStimulus } from "../components/QuestionStimulus";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, Flag, Grid2X2, Clock3 } from "lucide-react";
import { useStore } from "../stores/useStore";
import { mergeBank } from "../data/bank";
import { type Attempt, type Data } from "../services/model";
import { expireSection, score } from "../services/exams";
import { Card, MathText, Empty } from "../components/UI";
function completed(d: Data, a: Attempt): Data {
  if (d.history.some((h) => h.id === a.id)) return { ...d, attempt: a };
  const bank = mergeBank(d.localQuestions, d.disabled, true);
  const result = score(a, bank);
  const now = Date.now();
  const answers =
    a.mode === "exam"
      ? a.sections
          .flatMap((s) => s.ids)
          .flatMap((id) => {
            const q = bank.find((q) => q.id === id);
            return q && a.answers[id]
              ? [
                  {
                    questionId: id,
                    answer: a.answers[id],
                    correct: a.answers[id] === q.correctAnswer,
                    at: now,
                    seconds: a.elapsed[id] || 0,
                    program: q.program,
                    category: q.category,
                    topic: q.topic,
                  },
                ]
              : [];
          })
      : [];
  return {
    ...d,
    attempt: a,
    answers: [...d.answers, ...answers],
    history: [
      ...d.history,
      {
        id: a.id,
        program: a.program,
        at: now,
        durationSeconds: Math.max(
          0,
          ((a.mode === "exam" ? Math.min(now, a.deadline) : now) -
            a.startedAt) /
            1000,
        ),
        ...result,
        mode: a.mode,
      },
    ],
  };
}
export function Session() {
  const { data: d, update } = useStore();
  const a = d.attempt;
  const [now, setNow] = useState(Date.now());
  const [navigator, setNavigator] = useState(false);
  const [confirm, setConfirm] = useState<"finish" | "next" | null>(null);
  const entered = useRef(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    entered.current = Date.now();
  }, [a?.section, a?.current]);
  useEffect(() => {
    if (!a || a.submitted || a.mode === "study" || now < a.deadline) return;
    update((s) => {
      if (!s.attempt || s.attempt.submitted) return s;
      const next = expireSection(s.attempt, Date.now());
      return next.submitted ? completed(s, next) : { ...s, attempt: next };
    });
  }, [now, a, update]);
  if (!a)
    return (
      <Empty>
        Tidak ada sesi aktif. <Link to="/materi">Pilih materi</Link>
      </Empty>
    );
  const bank = mergeBank(d.localQuestions, d.disabled, true);
  const section = a.sections[a.section];
  const q = bank.find((q) => q.id === section.ids[a.current]);
  if (!q)
    return (
      <Empty>
        Soal sesi tidak ditemukan. Pulihkan bank lokal melalui Profil.
      </Empty>
    );
  const selected = a.answers[q.id];
  const locked = a.submitted || (a.mode === "study" && !!selected);
  function mutate(fn: (a: Attempt) => Attempt) {
    update((s) => (s.attempt ? { ...s, attempt: fn(s.attempt) } : s));
  }
  function answer(id: string) {
    if (
      locked ||
      (!a!.submitted && a!.mode === "exam" && Date.now() >= a!.deadline)
    )
      return;
    const seconds = Math.max(0, (Date.now() - entered.current) / 1000);
    entered.current = Date.now();
    update((s) => {
      if (!s.attempt) return s;
      const attempt = {
        ...s.attempt,
        answers: { ...s.attempt.answers, [q!.id]: id },
        elapsed: {
          ...s.attempt.elapsed,
          [q!.id]: (s.attempt.elapsed[q!.id] || 0) + seconds,
        },
      };
      const record = {
        questionId: q!.id,
        answer: id,
        correct: id === q!.correctAnswer,
        at: Date.now(),
        seconds,
        program: q!.program,
        category: q!.category,
        topic: q!.topic,
      };
      return {
        ...s,
        attempt,
        answers: a!.mode === "study" ? [...s.answers, record] : s.answers,
      };
    });
  }
  function finish() {
    update((s) =>
      s.attempt ? completed(s, { ...s.attempt, submitted: true }) : s,
    );
    setConfirm(null);
  }
  function nextSection() {
    mutate((at) => {
      const next = at.section + 1;
      const start = Date.now();
      return {
        ...at,
        section: next,
        current: 0,
        sectionStartedAt: start,
        deadline: start + at.sections[next].minutes * 60000,
      };
    });
    setConfirm(null);
  }
  const result = a.submitted ? score(a, bank) : null;
  const remaining = Math.max(0, Math.ceil((a.deadline - now) / 1000));
  return (
    <div className="session">
      <div className="row">
        <Link to="/tryout">
          ← {a.submitted ? "Kembali" : "Simpan & keluar"}
        </Link>
        <span className="tag">
          {a.mode === "study" ? "MODE BELAJAR" : "UJIAN LATIHAN"}
        </span>
        {a.mode === "exam" && !a.submitted && (
          <span className={`timer ${remaining < 60 ? "urgent" : ""}`}>
            <Clock3 size={18} />
            {Math.floor(remaining / 60)}:
            {String(remaining % 60).padStart(2, "0")}
          </span>
        )}
      </div>
      {result && (
        <Card className="results">
          <span className="eyebrow">SESI SELESAI</span>
          <h1>
            {result.correct} / {result.total} benar
          </h1>
          <p>
            {result.wrong} salah · {result.blank} kosong
          </p>
          {a.program !== "simak" && (
            <p>
              Skor latihan: <strong>{result.practiceScore}</strong> · Benar{" "}
              {a.scoring?.correct ?? (a.program === "lpdp" ? 5 : 1)}, salah{" "}
              {a.scoring?.wrong ?? 0}, kosong {a.scoring?.blank ?? 0}
            </p>
          )}
          {a.program === "simak" && (
            <p>
              PEKA: <strong>{result.peka}</strong> · English:{" "}
              <strong>{result.english}</strong>
            </p>
          )}
          <p>Skor latihan lokal, bukan skor resmi atau hasil tersertifikasi.</p>
          {a.program === "lpdp" && (
            <>
              <p>
                Akurasi {Math.round((result.correct / result.total) * 100)}% ·
                Waktu{" "}
                {Math.round(
                  d.history.find((h) => h.id === a.id)?.durationSeconds ?? 0,
                )}{" "}
                detik.
              </p>
              <h3>Skor per subtes</h3>
              {result.subtests?.map((s) => (
                <p key={s.category}>
                  {s.category}: {s.score} poin · {s.correct} benar / {s.wrong}{" "}
                  salah / {s.blank} kosong
                </p>
              ))}
              <p>
                Rekomendasi: ulangi topik dengan jawaban salah melalui Materi →
                Pernah salah.
              </p>
            </>
          )}
          <p>Tinjau pembahasan setiap soal di bawah.</p>
          <div className="filters">
            {a.sections.map((s, i) => (
              <button
                key={i}
                onClick={() =>
                  mutate((at) => ({ ...at, section: i, current: 0 }))
                }
              >
                {s.category}
              </button>
            ))}
          </div>
        </Card>
      )}
      <div className="row section-title">
        <span>
          {section.category} · Soal {a.current + 1} dari {section.ids.length}
        </span>
        <button
          className="icon-button"
          aria-label="Buka navigator soal"
          onClick={() => setNavigator(true)}
        >
          <Grid2X2 />
        </button>
      </div>
      <progress
        value={section.ids.filter((id) => a.answers[id]).length}
        max={section.ids.length}
      />
      <Card className="question-card">
        <div className="row">
          <span className="eyebrow">
            {q.category} / {q.difficulty}
            {q.estimatedTimeSeconds
              ? ` · Estimasi ${q.estimatedTimeSeconds} detik`
              : ""}
          </span>
          <button
            className="icon-button"
            aria-label="Simpan bookmark"
            aria-pressed={d.bookmarks.includes(q.id)}
            onClick={() =>
              update((s) => ({
                ...s,
                bookmarks: s.bookmarks.includes(q.id)
                  ? s.bookmarks.filter((id) => id !== q.id)
                  : [...s.bookmarks, q.id],
              }))
            }
          >
            <Bookmark
              fill={d.bookmarks.includes(q.id) ? "currentColor" : "none"}
            />
          </button>
        </div>
        <QuestionStimulus question={q} />
        {q.explanationFormat === "data_sufficiency" && (
          <p className="notice">
            Kecukupan data: uji (1) dan (2) terpisah, lalu gabung bila
            diperlukan. Opsi A–E di bawah memiliki definisi tetap.
          </p>
        )}
        <h2>
          <MathText text={q.question} />
        </h2>
        {q.formula && (!q.workedSolution || locked) && (
          <MathText text={`$${q.formula}$`} />
        )}
        <fieldset className="options">
          <legend className="sr-only">Pilih jawaban</legend>
          {q.options.map((o) => (
            <label
              key={o.id}
              className={`option ${selected === o.id ? "chosen" : ""} ${locked && o.id === q.correctAnswer ? "correct" : ""}`}
            >
              <input
                type="radio"
                name={q.id}
                value={o.id}
                checked={selected === o.id}
                disabled={locked}
                onChange={() => answer(o.id)}
              />
              <span className="option-letter">{o.id}</span>
              <MathText text={o.text} />
            </label>
          ))}
        </fieldset>
        {locked && (
          <div className="explanation">
            <strong>
              {selected
                ? selected === q.correctAnswer
                  ? "Jawaban benar"
                  : "Jawaban belum tepat"
                : "Tidak dijawab"}{" "}
              · Kunci {q.correctAnswer}
            </strong>
            <p>
              <MathText text={q.explanation} />
            </p>
            {q.workedSolution && (
              <section>
                <h3>Diketahui</h3>
                <p>{q.workedSolution.known}</p>
                <h3>Ditanyakan</h3>
                <p>{q.workedSolution.asked}</p>
                <h3>Konsep / rumus</h3>
                <MathText text={`$${q.workedSolution.formula}$`} />
                <h3>Hasil akhir & pemeriksaan</h3>
                <p>
                  {q.workedSolution.result} · {q.workedSolution.check}
                </p>
              </section>
            )}
            {q.stepByStepSolution && (
              <>
                <h3>Langkah penyelesaian</h3>
                <ol>
                  {q.stepByStepSolution.map((step, i) => (
                    <li key={i}>
                      <MathText text={step} />
                    </li>
                  ))}
                </ol>
              </>
            )}
            {q.quickTip && (
              <>
                <h3>Tips cepat</h3>
                <p>{q.quickTip}</p>
              </>
            )}
            {q.learningObjective && (
              <>
                <h3>Tujuan pembelajaran</h3>
                <p>{q.learningObjective}</p>
              </>
            )}
            <h3>
              {q.clinicalPearl ? "Clinical pearl" : "Prinsip pembelajaran"}
            </h3>
            <p>{q.clinicalPearl || q.learningPoint}</p>
            {q.program === "lpdp" && (
              <p className="notice">
                Materi latihan orisinal, bukan soal resmi LPDP. Status{" "}
                {q.reviewStatus}; kesulitan dan estimasi waktu adalah perkiraan
                editorial.
              </p>
            )}
            {q.program === "btkv" && (
              <p className="notice">
                Status editorial: {q.reviewStatus}. Materi latihan orisinal,
                bukan soal resmi atau nasihat klinis. Belum ditinjau tenaga
                medis.
              </p>
            )}
            {q.references && (
              <details>
                <summary>Referensi dan status verifikasi</summary>
                {q.references.map((ref) => (
                  <p key={ref.url}>
                    <a href={ref.url} target="_blank" rel="noopener noreferrer">
                      Sumber penelusuran
                    </a>{" "}
                    —{" "}
                    {ref.verificationStatus === "unverified"
                      ? "Belum diverifikasi"
                      : "Terverifikasi sumber"}
                    . {ref.note}
                  </p>
                ))}
              </details>
            )}
            <details>
              <summary>Mengapa opsi lain kurang tepat?</summary>
              {Object.entries(q.distractorExplanations).map(([id, text]) => (
                <p key={id}>
                  <strong>{id}.</strong> {text}
                </p>
              ))}
            </details>
            <label>
              Catatan pribadi
              <textarea
                value={d.notes[q.id] || ""}
                onChange={(e) =>
                  update((s) => ({
                    ...s,
                    notes: { ...s.notes, [q.id]: e.target.value },
                  }))
                }
              />
            </label>
          </div>
        )}
      </Card>
      <div className="exam-controls">
        <button
          disabled={a.current === 0}
          onClick={() => mutate((at) => ({ ...at, current: at.current - 1 }))}
        >
          Sebelumnya
        </button>
        <button
          className={a.marked.includes(q.id) ? "selected" : ""}
          onClick={() =>
            mutate((at) => ({
              ...at,
              marked: at.marked.includes(q.id)
                ? at.marked.filter((id) => id !== q.id)
                : [...at.marked, q.id],
            }))
          }
        >
          <Flag size={16} /> Tandai
        </button>
        <button
          disabled={a.current === section.ids.length - 1}
          onClick={() => mutate((at) => ({ ...at, current: at.current + 1 }))}
        >
          Berikutnya
        </button>
      </div>
      {!a.submitted && (
        <div className="row section-title">
          {a.section < a.sections.length - 1 && (
            <button onClick={() => setConfirm("next")}>
              Kunci bagian & lanjut
            </button>
          )}
          <button className="button" onClick={() => setConfirm("finish")}>
            Selesaikan sesi
          </button>
        </div>
      )}
      {navigator && (
        <div className="modal-overlay">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Navigator soal"
          >
            <div className="row">
              <h2>Navigator soal</h2>
              <button autoFocus onClick={() => setNavigator(false)}>
                Tutup
              </button>
            </div>
            <p>● Terjawab · ⚑ Ditandai · Garis tebal: posisi aktif</p>
            <div className="navigator">
              {section.ids.map((id, i) => (
                <button
                  key={id}
                  className={`${a.answers[id] ? "answered" : ""} ${a.current === i ? "current" : ""}`}
                  onClick={() => {
                    mutate((at) => ({ ...at, current: i }));
                    setNavigator(false);
                  }}
                >
                  {i + 1}
                  {a.marked.includes(id) ? " ⚑" : a.answers[id] ? " ●" : ""}
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
      {confirm && (
        <div className="modal-overlay">
          <section
            className="modal"
            role="alertdialog"
            aria-modal="true"
            aria-label="Konfirmasi sesi"
          >
            <h2>
              {confirm === "finish" ? "Selesaikan sesi?" : "Kunci bagian ini?"}
            </h2>
            <p>
              {section.ids.filter((id) => !a.answers[id]).length} soal di bagian
              ini belum dijawab.{" "}
              {confirm === "finish"
                ? "Jawaban seluruh bagian akan diserahkan."
                : "Anda tidak dapat kembali ke bagian ini sampai ujian selesai."}
            </p>
            <div className="row">
              <button autoFocus onClick={() => setConfirm(null)}>
                Batal
              </button>
              <button
                className="button"
                onClick={confirm === "finish" ? finish : nextSection}
              >
                Ya, lanjutkan
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
