import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Flame,
  Target,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { useStore } from "../stores/useStore";
import { bundled } from "../data/bank";
import { Card, Heading } from "../components/UI";
import { categories } from "../services/model";
export function Home() {
  const { data: d } = useStore();
  const answers = d.answers.filter((a) => a.program === d.program);
  const correct = answers.filter((a) => a.correct).length;
  const today = new Date().toLocaleDateString();
  const daily = answers.filter(
    (a) => new Date(a.at).toLocaleDateString() === today,
  ).length;
  const days = new Set(answers.map((a) => new Date(a.at).toLocaleDateString()));
  let streak = 0;
  const date = new Date();
  if (!days.has(date.toLocaleDateString())) date.setDate(date.getDate() - 1);
  while (days.has(date.toLocaleDateString())) {
    streak++;
    date.setDate(date.getDate() - 1);
  }
  const weak = Object.keys(categories[d.program])
    .map((category) => {
      const a = answers.filter((a) => a.category === category);
      return {
        category,
        accuracy: a.length ? a.filter((a) => a.correct).length / a.length : -1,
      };
    })
    .sort((a, b) => a.accuracy - b.accuracy)[0];
  return (
    <>
      <Heading
        eyebrow="RUANG BELAJAR ANDA"
        title={`Halo, ${d.profile.name.split(" ")[0]} ${d.profile.avatar}`}
      >
        <span className="date">
          {new Intl.DateTimeFormat("id", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }).format(new Date())}
        </span>
      </Heading>
      <section className="hero">
        <div className="hero-copy">
          <span className="pill">
            <Sparkles size={14} /> Satu langkah lebih dekat
          </span>
          <h2>
            Masa depan dimulai
            <br />
            dari rasa ingin tahu.
          </h2>
          <p>
            Luangkan waktu hari ini. Bangun pemahaman,
            <br className="desktop" /> bukan sekadar hafalan.
          </p>
          <Link
            className="button light"
            to={d.attempt && !d.attempt.submitted ? "/sesi" : "/materi"}
          >
            {d.attempt && !d.attempt.submitted
              ? "Lanjutkan sesi"
              : "Mulai belajar"}{" "}
            <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit" />
          <div className="book">
            N<span>ACADEMY</span>
          </div>
          <span className="star">✦</span>
          <span className="small-star">✧</span>
        </div>
      </section>
      <div className="metrics">
        <Card>
          <CheckCircle2 />
          <strong>{answers.length}</strong>
          <span>Soal dijawab</span>
        </Card>
        <Card>
          <Target />
          <strong>
            {answers.length ? Math.round((correct / answers.length) * 100) : 0}%
          </strong>
          <span>Akurasi belajar</span>
        </Card>
        <Card>
          <Flame />
          <strong>
            {streak} <small>hari</small>
          </strong>
          <span>Streak belajar</span>
        </Card>
      </div>
      <div className="home-grid">
        <Card>
          <div className="row">
            <h2>Target harian</h2>
            <span className="tag">
              {daily} / {d.profile.goal} soal
            </span>
          </div>
          <p>Sedikit setiap hari, berarti untuk masa depan.</p>
          <progress
            max={d.profile.goal}
            value={Math.min(daily, d.profile.goal)}
          />
          <p className="muted">
            {daily >= d.profile.goal
              ? "Target tercapai. Kerja bagus!"
              : `${d.profile.goal - daily} soal lagi menuju target hari ini.`}
          </p>
        </Card>
        <Card>
          <span className="eyebrow">REKOMENDASI BELAJAR</span>
          <h2>{categories[d.program][weak.category]}</h2>
          <p>
            {weak.accuracy < 0
              ? "Mulai jelajahi bidang ini."
              : "Perkuat bidang dengan akurasi terendah Anda."}
          </p>
          <Link className="text-link" to={`/materi?category=${weak.category}`}>
            Jelajahi materi <ArrowUpRight size={17} />
          </Link>
        </Card>
      </div>
      <div className="row section-title">
        <h2>Jalur belajar Anda</h2>
        <Link to="/tryout">Lihat tryout →</Link>
      </div>
      <div className="subject-grid">
        {Object.entries(categories[d.program]).map(([id, label], i) => {
          const a = answers.filter((a) => a.category === id);
          const n = bundled.filter(
            (q) => q.program === d.program && q.category === id,
          ).length;
          return (
            <Link
              className="card subject"
              key={id}
              to={`/materi?category=${id}`}
            >
              <span className="subject-number">0{i + 1}</span>
              <h3>{label}</h3>
              <p>
                {n} soal · {new Set(a.map((a) => a.questionId)).size} dipelajari
              </p>
              <ArrowUpRight className="corner" />
            </Link>
          );
        })}
      </div>
      {answers.length > 0 && (
        <Card>
          <h2>Terakhir dipelajari</h2>
          {answers
            .slice(-3)
            .reverse()
            .map((a, i) => (
              <p key={i}>
                {a.topic}{" "}
                <span className="muted">
                  · {a.correct ? "Benar" : "Perlu diulang"}
                </span>
              </p>
            ))}
        </Card>
      )}
      <p className="fineprint">
        Materi latihan orisinal, bukan soal resmi. Konten klinis berstatus draf
        untuk tinjauan editorial, bukan nasihat perawatan pasien.
      </p>
    </>
  );
}
