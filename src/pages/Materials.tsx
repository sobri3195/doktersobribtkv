import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Search, ArrowRight, Bookmark } from "lucide-react";
import { useStore } from "../stores/useStore";
import { mergeBank } from "../data/bank";
import { categories } from "../services/model";
import { makeAttempt } from "../services/exams";
import { Card, Heading, Empty } from "../components/UI";
export function Materials() {
  const { data: d, update } = useStore();
  const [params] = useSearchParams();
  const [category, setCategory] = useState(params.get("category") || "");
  const [topic, setTopic] = useState("");
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [status, setStatus] = useState("");
  const [count, setCount] = useState(10);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const bank = mergeBank(d.localQuestions, d.disabled).filter(
    (q) => q.program === d.program && !q.disabled,
  );
  const filtered = bank.filter(
    (q) =>
      (!category || q.category === category) &&
      (!topic || q.topic === topic) &&
      (!search ||
        `${q.question} ${q.topic}`
          .toLowerCase()
          .includes(search.toLowerCase())) &&
      (!difficulty || q.difficulty === difficulty) &&
      (!status ||
        (status === "bookmarks"
          ? d.bookmarks.includes(q.id)
          : status === "unanswered"
            ? !d.answers.some((a) => a.questionId === q.id)
            : status === "incorrect"
              ? d.answers.filter((a) => a.questionId === q.id).at(-1)
                  ?.correct === false
              : d.answers.some((a) => a.questionId === q.id))),
  );
  function start(pool = filtered) {
    if (d.attempt && !d.attempt.submitted) {
      setError(
        "Selesaikan atau lanjutkan sesi aktif sebelum memulai sesi baru.",
      );
      return;
    }
    try {
      const attempt = makeAttempt(d.program, "study", pool, count);
      update((s) => ({ ...s, attempt }));
      navigate("/sesi");
    } catch (e) {
      setError(String(e));
    }
  }
  return (
    <>
      <Heading eyebrow="PAHAMI KONSEPNYA" title="Ruang materi" />
      <p className="intro">
        Pilih topik. Pelajari alasannya. Bangun pemahaman yang bertahan.
      </p>
      <div className="category-tabs">
        <button
          className={!category ? "selected" : ""}
          onClick={() => {
            setCategory("");
            setTopic("");
          }}
        >
          Semua bidang
        </button>
        {Object.entries(categories[d.program]).map(([id, label]) => (
          <button
            key={id}
            className={category === id ? "selected" : ""}
            onClick={() => {
              setCategory(id);
              setTopic("");
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <Card>
        <div className="search">
          <Search size={18} />
          <input
            aria-label="Cari soal atau topik"
            placeholder="Cari soal atau topik…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filters">
          {d.program === "btkv" && (
            <label>
              Topik
              <select value={topic} onChange={(e) => setTopic(e.target.value)}>
                <option value="">Semua topik</option>
                {[
                  ...new Set(
                    bank
                      .filter((q) => !category || q.category === category)
                      .map((q) => q.topic),
                  ),
                ].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
          )}
          <label>
            Kesulitan
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="">Semua</option>
              <option value="easy">Mudah</option>
              <option value="medium">Sedang</option>
              <option value="hard">Sulit</option>
            </select>
          </label>
          <label>
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Semua soal</option>
              <option value="answered">Sudah dijawab</option>
              <option value="unanswered">Belum dijawab</option>
              <option value="incorrect">Terakhir salah</option>
              <option value="bookmarks">Bookmark</option>
            </select>
          </label>
          <label>
            Jumlah soal
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            >
              {[5, 10, 20, 30, 50].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          <button
            className="button"
            disabled={!filtered.length}
            onClick={() => start()}
          >
            Latihan {Math.min(count, filtered.length)} soal{" "}
            <ArrowRight size={17} />
          </button>
        </div>
        {error && (
          <p role="alert">
            {error} <Link to="/sesi">Lanjutkan sesi</Link>
          </p>
        )}
      </Card>
      <div className="row section-title">
        <h2>{filtered.length} soal tersedia</h2>
        <span className="muted">Acak tanpa pengulangan</span>
      </div>
      {!filtered.length && <Empty>Tidak ada soal yang sesuai filter.</Empty>}
      <div className="subject-grid">
        {Object.entries(categories[d.program])
          .filter(([id]) => !category || category === id)
          .map(([id, label]) => {
            const pool = bank.filter((q) => q.category === id);
            const a = d.answers.filter(
              (a) =>
                a.program === d.program &&
                a.category === id &&
                pool.some((q) => q.id === a.questionId),
            );
            return (
              <Card key={id}>
                <h3>{label}</h3>
                <p>
                  {pool.length} soal ·{" "}
                  {new Set(a.map((a) => a.questionId)).size} selesai
                </p>
                <p>
                  {a.filter((a) => a.correct).length} benar · akurasi{" "}
                  {a.length
                    ? Math.round(
                        (a.filter((a) => a.correct).length / a.length) * 100,
                      )
                    : 0}
                  %
                </p>
                <p className="muted">
                  Mudah {pool.filter((q) => q.difficulty === "easy").length} ·
                  Sedang {pool.filter((q) => q.difficulty === "medium").length}{" "}
                  · Sulit {pool.filter((q) => q.difficulty === "hard").length}
                </p>
                <p className="muted">
                  Selesai{" "}
                  {pool.length
                    ? Math.round(
                        (new Set(a.map((a) => a.questionId)).size /
                          pool.length) *
                          100,
                      )
                    : 0}
                  %
                </p>
                <button
                  disabled={!filtered.some((q) => q.category === id)}
                  onClick={() =>
                    start(filtered.filter((q) => q.category === id))
                  }
                >
                  Mulai belajar {label}
                </button>
                <progress
                  max={pool.length || 1}
                  value={new Set(a.map((a) => a.questionId)).size}
                />
              </Card>
            );
          })}
      </div>
      <div className="question-list">
        {filtered.map((q) => (
          <article className="card" key={q.id}>
            <div className="row">
              <span className="tag">
                {categories[d.program][q.category]} · {q.difficulty}
              </span>
              <button
                aria-label={`Bookmark ${q.id}`}
                className="icon-button"
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
                  size={18}
                  fill={d.bookmarks.includes(q.id) ? "currentColor" : "none"}
                />
              </button>
            </div>
            <h3>{q.question}</h3>
            <span className="muted">
              {q.id} · {q.subtopic}
            </span>
          </article>
        ))}
      </div>
      {d.program === "btkv" && (
        <Link className="button" to="/kasus">
          Buka simulasi kasus klinis
        </Link>
      )}
    </>
  );
}
