import { bundled } from "../data/bank";
import { topicRecommendations } from "../services/recommendations";
import { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useStore } from "../stores/useStore";
import { categories } from "../services/model";
import { Card, Empty, Heading } from "../components/UI";
export function Statistics() {
  const { data: d } = useStore();
  const [window, setWindow] = useState(30);
  const answers = d.answers.filter(
    (a) => a.program === d.program && a.at >= Date.now() - window * 86400000,
  );
  const history = d.history.filter(
    (h) => h.program === d.program && h.at >= Date.now() - window * 86400000,
  );
  const right = answers.filter((a) => a.correct).length;
  const subjects = Object.entries(categories[d.program]).map(([id, name]) => {
    const a = answers.filter((a) => a.category === id);
    return {
      name,
      accuracy: a.length
        ? Math.round((a.filter((a) => a.correct).length / a.length) * 100)
        : 0,
      total: a.length,
    };
  });
  const days = Array.from({ length: Math.min(window, 30) }, (_, i) => {
    const day = new Date(
      Date.now() - (Math.min(window, 30) - 1 - i) * 86400000,
    ).toLocaleDateString("id");
    return {
      day,
      total: answers.filter(
        (a) => new Date(a.at).toLocaleDateString("id") === day,
      ).length,
    };
  });
  return (
    <>
      <Heading eyebrow="SETIAP LANGKAH TERUKUR" title="Statistik belajar">
        <label>
          Periode
          <select value={window} onChange={(e) => setWindow(+e.target.value)}>
            <option value={7}>7 hari</option>
            <option value={30}>30 hari</option>
            <option value={365}>365 hari</option>
          </select>
        </label>
      </Heading>
      {!answers.length && !history.length ? (
        <Empty>
          Belum ada aktivitas untuk program dan periode ini. Jawab soal pertama
          untuk mulai melihat perkembangan Anda.
        </Empty>
      ) : (
        <>
          <div className="metrics">
            <Card>
              <strong>{answers.length}</strong>
              <span>Jawaban tersimpan</span>
            </Card>
            <Card>
              <strong>
                {answers.length
                  ? Math.round((right / answers.length) * 100)
                  : 0}
                %
              </strong>
              <span>Akurasi keseluruhan</span>
            </Card>
            <Card>
              <strong>
                {answers.length
                  ? Math.round(
                      answers.reduce((s, a) => s + a.seconds, 0) /
                        answers.length,
                    )
                  : 0}{" "}
                dtk
              </strong>
              <span>Rata-rata waktu aktif</span>
            </Card>
          </div>
          <div className="home-grid">
            <Card>
              <h2>Akurasi per bidang</h2>
              <div className="chart">
                <ResponsiveContainer>
                  <BarChart data={subjects}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar
                      dataKey="accuracy"
                      name="Akurasi (%)"
                      fill="#0f766e"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card>
              <h2>Komposisi jawaban</h2>
              <div className="chart">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Benar", value: right },
                        { name: "Salah", value: answers.length - right },
                      ]}
                      dataKey="value"
                      innerRadius={65}
                      outerRadius={90}
                    >
                      <Cell fill="#0f766e" />
                      <Cell fill="#e8a85d" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <p>
                {right} benar · {answers.length - right} salah ·{" "}
                {history.reduce((s, h) => s + h.blank, 0)} kosong dalam sesi
                selesai
              </p>
            </Card>
            <Card>
              <h2>Riwayat skor latihan</h2>
              {history.length ? (
                <div className="chart">
                  <ResponsiveContainer>
                    <LineChart
                      data={history.map((h) => ({
                        date: new Date(h.at).toLocaleDateString("id"),
                        accuracy: Math.round((h.correct / h.total) * 100),
                        score: h.practiceScore ?? null,
                      }))}
                    >
                      <XAxis dataKey="date" />
                      <YAxis
                        domain={
                          d.program === "lpdp" ? ["auto", "auto"] : [0, 100]
                        }
                      />
                      <Tooltip />
                      <Line
                        dataKey={d.program === "lpdp" ? "score" : "accuracy"}
                        name={
                          d.program === "lpdp"
                            ? "Skor simulasi aplikasi"
                            : "Benar (%)"
                        }
                        stroke="#3b82f6"
                        strokeWidth={3}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <Empty>Selesaikan sesi untuk melihat riwayat.</Empty>
              )}
            </Card>
            <Card>
              <h2>Aktivitas harian</h2>
              <div className="chart">
                <ResponsiveContainer>
                  <BarChart data={days}>
                    <XAxis dataKey="day" hide />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="total" name="Soal dijawab" fill="#7c3aed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
          {d.program === "lpdp" && (
            <Card>
              <h2>Waktu dan kesulitan LPDP</h2>
              <p>
                Rata-rata waktu aktif per kategori (detik), dari jawaban
                tersimpan:
              </p>
              <div className="chart">
                <ResponsiveContainer>
                  <BarChart
                    data={Object.entries(categories.lpdp).map(([id, name]) => {
                      const a = answers.filter((a) => a.category === id);
                      return {
                        name,
                        seconds: a.length
                          ? Math.round(
                              a.reduce((s, a) => s + a.seconds, 0) / a.length,
                            )
                          : 0,
                      };
                    })}
                  >
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="seconds" name="Detik" fill="#7c3aed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Kesulitan editorial</th>
                      <th>Jawaban</th>
                      <th>Benar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {["easy", "medium", "hard"].map((level) => {
                      const ids = new Set(
                        bundled
                          .filter(
                            (q) =>
                              q.program === "lpdp" && q.difficulty === level,
                          )
                          .map((q) => q.id),
                      );
                      const a = answers.filter((a) => ids.has(a.questionId));
                      return (
                        <tr key={level}>
                          <th>{level}</th>
                          <td>{a.length}</td>
                          <td>{a.filter((a) => a.correct).length}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <h3>Rekomendasi topik</h3>
              {topicRecommendations(
                answers,
                bundled.filter((q) => q.program === "lpdp"),
              )
                .filter((t) => t.attempts > 0)
                .slice(0, 5)
                .map((t) => (
                  <p key={t.topic}>
                    {t.topic}: {t.priority} ({Math.round(t.accuracy!)}%)
                  </p>
                ))}
              <p>
                Aturan pedagogis aplikasi, bukan standar kelulusan atau
                kalibrasi kemampuan.
              </p>
            </Card>
          )}
          <Card>
            <h2>Topik untuk diperkuat</h2>
            {Array.from(
              new Set(answers.filter((a) => !a.correct).map((a) => a.topic)),
            )
              .slice(-5)
              .map((t) => (
                <p key={t}>{t}</p>
              ))}
            <p>
              {history.filter((h) => h.mode === "exam").length} tryout selesai.
              Tren dihitung dari riwayat nyata, bukan prediksi hasil ujian
              resmi.
            </p>
          </Card>
        </>
      )}
    </>
  );
}
