import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { passages, stimuli } from "../services/learning-assets";
import type { Question } from "../services/model";
export function QuestionStimulus({ question: q }: { question: Question }) {
  const passage = passages.find((p) => p.id === q.passageId);
  const s = stimuli.find((s) => s.id === q.stimulusId);
  return (
    <>
      {passage && (
        <section className="reading-passage" aria-label={passage.title}>
          <span className="eyebrow">BACAAN ORISINAL · {passage.id}</span>
          <h3>{passage.title}</h3>
          {passage.text.split("\n\n").map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </section>
      )}
      {s && (
        <figure className="data-stimulus">
          <figcaption>
            <strong>{s.title}</strong>
            <p>
              Satuan: {s.unit}
              {s.period ? ` · Periode: ${s.period}` : ""}
            </p>
          </figcaption>
          {s.kind !== "table" && (
            <div className="chart" aria-label={`Grafik ${s.title}`}>
              <ResponsiveContainer>
                {s.kind === "bar" ? (
                  <BarChart
                    data={s.rows.map((row) =>
                      Object.fromEntries(s.columns.map((c, i) => [c, row[i]])),
                    )}
                  >
                    <XAxis dataKey={s.columns[0]} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {s.columns.slice(1).map((c, i) => (
                      <Bar
                        key={c}
                        dataKey={c}
                        fill={["#7c3aed", "#0f766e", "#2563eb"][i % 3]}
                      />
                    ))}
                  </BarChart>
                ) : (
                  <LineChart
                    data={s.rows.map((row) =>
                      Object.fromEntries(s.columns.map((c, i) => [c, row[i]])),
                    )}
                  >
                    <XAxis dataKey={s.columns[0]} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {s.columns.slice(1).map((c, i) => (
                      <Line
                        key={c}
                        dataKey={c}
                        stroke={["#7c3aed", "#0f766e", "#2563eb"][i % 3]}
                        strokeWidth={3}
                      />
                    ))}
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
          <div className="table-scroll">
            <table>
              <caption className="sr-only">
                {s.title} — {s.unit}
              </caption>
              <thead>
                <tr>
                  {s.columns.map((c) => (
                    <th scope="col" key={c}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {s.rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((v, j) =>
                      j === 0 ? (
                        <th scope="row" key={j}>
                          {v}
                        </th>
                      ) : (
                        <td key={j}>{v}</td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </figure>
      )}
    </>
  );
}
