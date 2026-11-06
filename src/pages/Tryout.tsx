import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Clock3, ClipboardCheck } from "lucide-react";
import { useStore } from "../stores/useStore";
import { mergeBank } from "../data/bank";
import { blueprints, makeAttempt } from "../services/exams";
import { Card, Heading } from "../components/UI";
export function Tryout() {
  const { data: d, update } = useStore();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [count, setCount] = useState(10);
  const [minutes, setMinutes] = useState(15);
  const [name, setName] = useState("Paket pribadi");
  const bank = mergeBank(d.localQuestions, d.disabled);
  const blueprint = blueprints[d.program];
  const missing = blueprint.filter(
    ([cat, n]) =>
      bank.filter(
        (q) => q.program === d.program && q.category === cat && !q.disabled,
      ).length < n,
  );
  function start(full = false, n = count, m = minutes) {
    if (d.attempt && !d.attempt.submitted) {
      setError("Ada sesi aktif. Lanjutkan atau selesaikan dahulu.");
      return;
    }
    try {
      const attempt = makeAttempt(d.program, "exam", bank, n, full, m);
      update((s) => ({ ...s, attempt }));
      navigate("/sesi");
    } catch (e) {
      setError(String(e));
    }
  }
  return (
    <>
      <Heading eyebrow="UKUR KESIAPAN ANDA" title="Tryout & simulasi" />
      <p className="intro">
        Latihan berwaktu, hasil yang jujur. Tidak ada nilai kelulusan resmi.
      </p>
      {error && (
        <p role="alert" className="notice">
          {error} <Link to="/sesi">Lanjutkan sesi</Link>
        </p>
      )}
      <Card className="exam-package">
        <span className="tag">REFERENSI LATIHAN 2026</span>
        <h2>Simulasi lengkap {d.program.toUpperCase()}</h2>
        <p>
          <ClipboardCheck size={18} />{" "}
          {blueprint.reduce((sum, s) => sum + s[1], 0)} soal{" "}
          <Clock3 size={18} /> {blueprint.reduce((sum, s) => sum + s[2], 0)}{" "}
          menit
        </p>
        {blueprint.map(([cat, n, m]) => (
          <div className="row section-row" key={cat}>
            <span>{cat}</span>
            <span>
              {n} soal / {m} menit
            </span>
          </div>
        ))}
        <p className="muted">
          Blueprint latihan dapat diubah di src/services/exams.ts. Format bukan
          jaminan ujian resmi tahun berikutnya.
        </p>
        {missing.length > 0 && (
          <p className="notice">
            Bank draf belum mencukupi simulasi lengkap. Tambahkan soal melalui
            Kelola Soal. Kekurangan:{" "}
            {missing.map(([c, n]) => `${c} perlu ${n}`).join("; ")}.
          </p>
        )}
        <button
          className="button"
          disabled={missing.length > 0}
          onClick={() => start(true)}
        >
          Mulai simulasi lengkap
        </button>
      </Card>
      <Card>
        <h2>Latihan singkat</h2>
        <p>
          Campuran bidang sesuai program Anda. Jawaban dibahas setelah
          penyerahan.
        </p>
        <div className="filters">
          <label>
            Soal
            <select value={count} onChange={(e) => setCount(+e.target.value)}>
              {[5, 10, 20, 30, 50].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          <label>
            Durasi (menit)
            <input
              type="number"
              min={1}
              max={600}
              value={minutes}
              onChange={(e) => setMinutes(+e.target.value)}
            />
          </label>
          <button
            className="button"
            disabled={minutes < 1 || minutes > 600}
            onClick={() => start()}
          >
            Mulai tryout
          </button>
        </div>
        <div className="filters">
          <label>
            Nama paket
            <input
              value={name}
              maxLength={60}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <button
            disabled={!name.trim() || minutes < 1 || minutes > 600}
            onClick={() =>
              update((s) => ({
                ...s,
                packages: [
                  ...s.packages,
                  {
                    id: crypto.randomUUID(),
                    name,
                    program: d.program,
                    count,
                    minutes,
                  },
                ],
              }))
            }
          >
            Simpan paket
          </button>
        </div>
      </Card>
      {d.packages
        .filter((p) => p.program === d.program)
        .map((p) => (
          <Card key={p.id}>
            <h3>{p.name}</h3>
            <p>
              {p.count} soal · {p.minutes} menit
            </p>
            <button onClick={() => start(false, p.count, p.minutes)}>
              Mulai
            </button>
            <button
              onClick={() =>
                update((s) => ({
                  ...s,
                  packages: s.packages.filter((x) => x.id !== p.id),
                }))
              }
            >
              Hapus paket
            </button>
          </Card>
        ))}
      <Card>
        <h2>Riwayat tryout</h2>
        {d.history.filter((h) => h.program === d.program && h.mode === "exam")
          .length ? (
          d.history
            .filter((h) => h.program === d.program && h.mode === "exam")
            .map((h) => (
              <p key={h.id}>
                {new Date(h.at).toLocaleString("id")} · {h.correct}/{h.total}{" "}
                benar
              </p>
            ))
        ) : (
          <p>
            Belum ada tryout selesai. Hasil pertama Anda akan muncul di sini.
          </p>
        )}
      </Card>
    </>
  );
}
