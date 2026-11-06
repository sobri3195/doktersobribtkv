import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { dataSchema, defaults, type Data } from "../services/model";
import { useStore } from "../stores/useStore";
import { download, parseBackup, KEYS } from "../services/storage";
import { legacyBundled } from "../data/bank";
import { Card, Heading } from "../components/UI";
const profileSchema = dataSchema.shape.profile;
export function Profile() {
  const { data: d, update } = useStore();
  const [message, setMessage] = useState("");
  const [restore, setRestore] = useState<Data | null>(null);
  const [deletion, setDeletion] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Data["profile"]>({
    resolver: zodResolver(profileSchema),
    defaultValues: d.profile,
  });
  return (
    <>
      <Heading eyebrow="BELAJAR DENGAN CARA ANDA" title="Profil & pengaturan" />
      <p className="notice">
        Profil disimpan di browser dan perangkat ini. Tidak ada akun cloud.
        Cadangkan data sebelum mengganti perangkat atau membersihkan browser.
      </p>
      <Card>
        <form
          onSubmit={handleSubmit((profile) => {
            update((s) => ({ ...s, profile: { ...profile, onboarded: true } }));
            setMessage("Profil tersimpan.");
          })}
        >
          <h2>Profil pembelajar</h2>
          <div className="filters">
            <label>
              Nama tampilan
              <input {...register("name")} />
              {errors.name && (
                <span role="alert">Nama wajib 1–60 karakter.</span>
              )}
            </label>
            <label>
              Avatar
              <select {...register("avatar")}>
                {["🌱", "🧠", "🎓", "🩺"].map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </label>
            <label>
              Target harian
              <input
                type="number"
                {...register("goal", { valueAsNumber: true })}
              />
              {errors.goal && <span role="alert">Target 1–200 soal.</span>}
            </label>
            <label>
              Target ujian
              <input {...register("target")} />
            </label>
          </div>
          <label className="checkbox">
            <input type="checkbox" {...register("notification")} /> Ingatkan
            target saat membuka aplikasi (tanpa notifikasi latar belakang)
          </label>
          <button className="button" type="submit">
            Simpan profil
          </button>
        </form>
      </Card>
      <Card>
        <h2>Tampilan</h2>
        <label>
          Tema
          <select
            value={d.theme}
            onChange={(e) =>
              update((s) => ({ ...s, theme: e.target.value as Data["theme"] }))
            }
          >
            <option value="light">Terang</option>
            <option value="dark">Gelap</option>
          </select>
        </label>
      </Card>
      <Card>
        <h2>Cadangan & pemulihan</h2>
        <div className="filters">
          <button
            onClick={() =>
              download("nexam-backup.json", JSON.stringify(d, null, 2))
            }
          >
            Ekspor data belajar
          </button>
          <label className="file-label">
            Pilih cadangan JSON
            <input
              type="file"
              accept=".json"
              onChange={async (e) => {
                try {
                  const file = e.target.files?.[0];
                  if (file) setRestore(parseBackup(await file.text()));
                } catch (err) {
                  setMessage(`Cadangan tidak valid: ${String(err)}`);
                }
                e.target.value = "";
              }}
            />
          </label>
          <button
            onClick={() => {
              const raw =
                localStorage.getItem(KEYS.recovery) ||
                localStorage.getItem(KEYS.data);
              if (raw) download("nexam-recovery.txt", raw, "text/plain");
              else setMessage("Tidak ada data mentah tersimpan.");
            }}
          >
            Ekspor data pemulihan
          </button>
        </div>
        {restore && (
          <div className="notice">
            <p>
              Pratinjau: profil {restore.profile.name}, {restore.answers.length}{" "}
              jawaban, {restore.localQuestions.length} soal lokal. Pemulihan
              mengganti data saat ini.
            </p>
            <button
              className="button"
              onClick={() => {
                update(() => restore);
                setRestore(null);
                setMessage(
                  "Cadangan dipulihkan. Muat ulang untuk memperbarui formulir profil.",
                );
              }}
            >
              Konfirmasi pulihkan
            </button>
            <button onClick={() => setRestore(null)}>Batal</button>
          </div>
        )}
      </Card>
      <Card>
        <h2>Koleksi pribadi</h2>
        <p>
          {d.bookmarks.length} bookmark · {d.history.length} sesi selesai ·{" "}
          {d.localQuestions.length} soal lokal
        </p>
        <div className="filters">
          <Link className="button" to="/materi">
            Buka materi & filter bookmark
          </Link>
          <Link className="button secondary" to="/kelola">
            Kelola Soal
          </Link>
        </div>
      </Card>
      {legacyBundled.some(
        (q) => d.bookmarks.includes(q.id) || d.notes[q.id],
      ) && (
        <Card>
          <h2>Arsip bank versi sebelumnya</h2>
          <p>
            Bookmark dan catatan lama tetap tersedia. Arsip tidak dihitung
            sebagai bagian dari bank aktif yang baru.
          </p>
          {legacyBundled
            .filter((q) => d.bookmarks.includes(q.id) || d.notes[q.id])
            .map((q) => (
              <details key={q.id}>
                <summary>
                  {q.id}: {q.question}
                </summary>
                <p>{d.notes[q.id] || "Belum ada catatan pribadi."}</p>
                {(!d.attempt || d.attempt.submitted) && <p>{q.explanation}</p>}
              </details>
            ))}
        </Card>
      )}
      <Card>
        <h2>Hapus data selektif</h2>
        <p>
          Ekspor cadangan terlebih dahulu. Penghapusan tidak dapat dibatalkan.
        </p>
        <div className="filters">
          <button onClick={() => setDeletion("progress")}>
            Reset kemajuan belajar
          </button>
          <button onClick={() => setDeletion("questions")}>
            Hapus soal lokal
          </button>
          <button className="danger" onClick={() => setDeletion("all")}>
            Reset semua data
          </button>
        </div>
        {deletion && (
          <div role="alertdialog" aria-label="Konfirmasi penghapusan">
            <p>
              Yakin menghapus{" "}
              {deletion === "all"
                ? "semua data"
                : deletion === "questions"
                  ? "soal lokal dan sesi yang menggunakannya"
                  : "jawaban, sesi, dan riwayat"}
              ?
            </p>
            <button onClick={() => setDeletion("")}>Batal</button>
            <button
              className="danger"
              onClick={() => {
                update((s) =>
                  deletion === "all"
                    ? defaults()
                    : deletion === "questions"
                      ? {
                          ...s,
                          localQuestions: [],
                          disabled: [],
                          attempt: null,
                        }
                      : { ...s, answers: [], history: [], attempt: null },
                );
                setDeletion("");
                setMessage("Data dipilih telah dihapus.");
              }}
            >
              Ya, hapus
            </button>
          </div>
        )}
      </Card>
      {message && (
        <p className="toast" role="status">
          <span>{message}</span>
          <button onClick={() => setMessage("")}>Tutup</button>
        </p>
      )}
    </>
  );
}
