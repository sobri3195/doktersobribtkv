import stimuli from "../../src/data/stimuli/lpdp.json";
import type { Question } from "../../src/services/model";
type Result =
  | { kind: "number"; value: number }
  | { kind: "text" | "letter"; value: string };
const num = (value: number): Result => ({ kind: "number", value });
const txt = (value: string): Result => ({ kind: "text", value });
const rows = (id: string) => {
  const s = stimuli.find((s) => s.id === id);
  if (!s) throw Error(`Stimulus ${id} hilang`);
  return s.rows;
};
const n = (r: (string | number)[], i: number) => {
  if (typeof r[i] !== "number") throw Error("Data numerik diperlukan");
  return r[i] as number;
};
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const range = (a: number, b: number) =>
  Array.from({ length: b - a + 1 }, (_, i) => a + i);
export function permutations<T>(xs: T[]): T[][] {
  return xs.length
    ? xs.flatMap((x, i) =>
        permutations(xs.filter((_, j) => i !== j)).map((p) => [x, ...p]),
      )
    : [[]];
}
const factorial = (x: number): number => (x <= 1 ? 1 : x * factorial(x - 1));
const bestRow = (
  id: string,
  fn: (r: (string | number)[]) => number,
  max = true,
) => {
  const rs = rows(id),
    scores = rs.map(fn),
    target = (max ? Math.max : Math.min)(...scores);
  if (scores.filter((s) => s === target).length !== 1)
    throw Error(`Maksimum/minimum tidak unik: ${id}`);
  return txt(String(rs[scores.indexOf(target)][0]));
};
const choose = (q: Question, test: (text: string) => boolean): Result => {
  const valid = q.options.filter((o) => test(o.text));
  if (valid.length !== 1)
    throw Error(`${q.id}: ${valid.length} opsi layak, wajib satu`);
  return txt(valid[0].text);
};
const positions = (p: string[]) => Object.fromEntries(p.map((x, i) => [x, i]));
const orderChoice = (
  q: Question,
  items: string[],
  test: (p: Record<string, number>) => boolean,
) => {
  const valid = permutations(items)
    .filter((p) => test(positions(p)))
    .map((p) => p.join("-"));
  return choose(q, (text) => valid.includes(text));
};
const queryFromOrders = (
  items: string[],
  test: (p: Record<string, number>) => boolean,
  query: (p: Record<string, number>) => string | number,
): Result => {
  const values = new Set(
    permutations(items)
      .filter((p) => test(positions(p)))
      .map((p) => query(positions(p))),
  );
  if (values.size !== 1) throw Error("Jawaban pengurutan tidak unik");
  const value = [...values][0];
  return typeof value === "number" ? num(value) : txt(value);
};
const ds = (
  domain: number[][],
  one: (v: number[]) => boolean,
  two: (v: number[]) => boolean,
  query: (v: number[]) => number | boolean,
): Result => {
  const sufficient = (pred: (v: number[]) => boolean) => {
    const models = domain.filter(pred);
    return models.length > 0 && new Set(models.map(query)).size === 1;
  };
  const a = sufficient(one),
    b = sufficient(two),
    both = sufficient((v) => one(v) && two(v));
  return {
    kind: "letter",
    value: a ? (b ? "D" : "A") : b ? "B" : both ? "C" : "E",
  };
};
const single = (max: number) => range(1, max).map((x) => [x]);
const pairs = (max: number) =>
  range(1, max).flatMap((x) => range(1, max).map((y) => [x, y]));
const tableNumber = (id: string, r: number, c: number) => n(rows(id)[r], c);
const qdata = (i: number) => `LPDP-QDATA-${String(i).padStart(2, "0")}`;
const pdata = (i: number) => `LPDP-PDATA-${String(i).padStart(2, "0")}`;
export const quantitative: Record<number, (q: Question) => Result> = {
  1: () => num(80 * (1 - 3 / 5)),
  2: () => num(240 * (1 - 0.2) + 10),
  3: () => num((21 * 4) / 7),
  4: () => num((12 * 70 + 96) / 13),
  5: () => num((180 * 5) / 2),
  6: () => num((1.25 * 0.8 - 1) * 100),
  7: () => num(2.4 * (1 - 3 / 8) + 0.5),
  8: () => num(20 / (1 - 0.3 - 0.45)),
  9: () => num((70 * 15) / (8 + 12 + 15)),
  10: () => num((0.2 * 10 - 0.12 * 10) / (0.3 - 0.2)),
  11: () => num((19 + 9) / 4),
  12: () => num((13 - 5) / 2),
  13: () => num(3 * (-2) ** 2 - 2),
  14: () => num(range(1, 20).filter((x) => 3 * x + 2 < 17).length),
  15: () => num(sum(range(-10, 10).filter((x) => x * x - 7 * x + 12 === 0))),
  16: (q) => {
    const models = range(-3, 3).flatMap((a) =>
      range(-3, 3)
        .filter((b) => a !== b && b !== 0)
        .map((b) => [a, b]),
    );
    const formulas: Record<string, (a: number, b: number) => number> = {
      "a + b": (a, b) => a + b,
      "a − b": (a, b) => a - b,
      "a² + b²": (a, b) => a * a + b * b,
      "1": () => 1,
      "a/b": (a, b) => a / b,
    };
    return choose(
      q,
      (t) =>
        !!formulas[t] &&
        models.every(
          ([a, b]) =>
            Math.abs(formulas[t](a, b) - (a * a - b * b) / (a - b)) < 1e-9,
        ),
    );
  },
  17: () => num((31 - 17) / (3 - 1)),
  18: () => num((2 * 3 + 1) ** 2),
  19: () => num((48 - 2 * 6) / 3),
  20: () => num(5 ** 2 - 2),
  21: () => num(7 + (6 - 1) * 4),
  22: () => num(sum(range(0, 4).map((i) => 3 * 2 ** i))),
  23: () => num(19 + 9),
  24: () => num(10 * (8 / 2)),
  25: () => {
    let a = 2;
    for (let i = 1; i < 4; i++) a = 3 * a - 1;
    return num(a);
  },
  26: () => num(6 ** 2 + 2 * 6 - (5 ** 2 + 2 * 5)),
  27: () => {
    let a = 1,
      b = 3;
    for (let i = 3; i <= 6; i++) {
      [a, b] = [b, a + b];
    }
    return num(b);
  },
  28: () => num(factorial(5) / factorial(3)),
  29: () => num(7 * 18),
  30: () => {
    let a = 5;
    for (let i = 1; i < 6; i++) a = i % 2 ? a + 3 : a * 2;
    return num(a);
  },
  31: () =>
    ds(
      single(9),
      ([x]) => x + 2 === 7,
      ([x]) => x % 2 === 1,
      ([x]) => x,
    ),
  32: () =>
    ds(
      single(10),
      ([x]) => x > 4,
      ([x]) => x % 4 === 0,
      ([x]) => x % 2 === 0,
    ),
  33: () =>
    ds(
      pairs(10),
      ([x, y]) => x + y === 12,
      ([x, y]) => x - y === 2,
      ([x]) => x,
    ),
  34: () =>
    ds(
      single(12),
      ([x]) => x * x === 36,
      ([x]) => 2 * x === 12,
      ([x]) => x,
    ),
  35: () =>
    ds(
      pairs(10),
      ([a, b]) => a > b,
      ([a, b]) => (a + b) % 2 === 0,
      ([a, b]) => a + b,
    ),
  36: () =>
    ds(
      single(8),
      ([x]) => x >= 6,
      ([x]) => x % 2 === 0,
      ([x]) => x > 4,
    ),
  37: () =>
    ds(
      pairs(5),
      ([a, b]) => a + b === 6,
      ([a, b]) => a === 2 && b === 4,
      ([a, b]) => a * b,
    ),
  38: () =>
    ds(
      pairs(10),
      ([p, l]) => 2 * (p + l) === 18,
      ([p, l]) => p === 2 * l,
      ([p, l]) => p * l,
    ),
  39: () =>
    ds(
      single(10),
      ([x]) => x * (x - 8) === -15,
      ([x]) => x > 1 && 35 % x === 0,
      ([x]) => x % 2 === 1,
    ),
  40: () =>
    ds(
      pairs(9),
      ([p, q]) => p > q,
      ([p, q]) => p + q === 10,
      ([p, q]) => p / q,
    ),
  41: () => num(tableNumber(qdata(1), 2, 1) - tableNumber(qdata(1), 0, 1)),
  42: () => {
    const data = rows(qdata(2))
      .map((r) => n(r, 1))
      .sort((a, b) => a - b);
    return num(data[Math.floor(data.length / 2)]);
  },
  43: () => {
    const rs = rows(qdata(3));
    return num(
      sum(rs.map((r) => n(r, 0) * n(r, 1))) / sum(rs.map((r) => n(r, 1))),
    );
  },
  44: () => {
    const rs = rows(qdata(4));
    return num(
      sum(rs.filter((r) => r[0] !== "Merah").map((r) => n(r, 1))) /
        sum(rs.map((r) => n(r, 1))),
    );
  },
  45: () =>
    num((tableNumber(qdata(5), 1, 1) / tableNumber(qdata(5), 0, 1) - 1) * 100),
  46: () => {
    const rs = rows(qdata(6));
    return num(
      sum(rs.map((r) => n(r, 1) * n(r, 2))) / sum(rs.map((r) => n(r, 1))),
    );
  },
  47: () => bestRow(qdata(7), (r) => n(r, 1)),
  48: () => {
    const data = rows(qdata(8)).map((r) => n(r, 1));
    return num(Math.max(...data) - Math.min(...data));
  },
  49: () => {
    const rs = rows(qdata(9));
    return num(
      (n(rs.find((r) => r[0] === "B")!, 1) / sum(rs.map((r) => n(r, 1)))) * 100,
    );
  },
  50: () => {
    const rs = rows(qdata(10));
    return num(
      (sum(rs.map((r) => n(r, 2))) / sum(rs.map((r) => n(r, 1)))) * 100,
    );
  },
};
export const analytic: Record<number, (q: Question) => Result> = {
  21: (q) => orderChoice(q, ["A", "B", "C"], (p) => p.A < p.B && p.B < p.C),
  22: (q) =>
    orderChoice(
      q,
      ["A", "B", "C", "D"],
      (p) => p.A === 0 && p.D === 3 && p.C === p.B + 1,
    ),
  23: () =>
    queryFromOrders(
      ["Rani", "Sita", "Tono", "Uli"],
      (p) => p.Tono < p.Rani && p.Rani < p.Sita && p.Sita < p.Uli,
      (p) => Object.keys(p).find((k) => p[k] === 0)!,
    ),
  24: () =>
    queryFromOrders(
      ["A", "B", "C", "D"],
      (p) => p.B === p.A + 1 && p.C === 3 && p.D < p.A,
      (p) => ["Senin", "Selasa", "Rabu", "Kamis"][p.B],
    ),
  25: () =>
    queryFromOrders(
      ["M", "N", "O", "P", "Q"],
      (p) => p.N === 2 && p.M === p.N - 1 && p.P === 4 && p.O < p.M,
      (p) => p.Q + 1,
    ),
  26: (q) => {
    const groups = permutations(["A", "B", "C", "D", "E", "F"])
      .map((p) => [p.slice(0, 3), p.slice(3)])
      .filter(
        (gs) =>
          gs.some(
            (g) => g.includes("A") && g.includes("B") && g.includes("E"),
          ) &&
          gs.some(
            (g) => g.includes("C") && g.includes("D") && !g.includes("A"),
          ),
      );
    const companions = new Set(
      groups.map((gs) =>
        gs
          .find((g) => g.includes("F"))!
          .filter((x) => x !== "F")
          .sort()
          .join(" dan "),
      ),
    );
    if (companions.size !== 1) throw Error("Tim tidak unik");
    return choose(q, (t) => companions.has(t));
  },
  27: () =>
    queryFromOrders(
      ["W", "X", "Y", "Z"],
      (p) => p.X < p.W && p.W < p.Y && p.Y < p.Z,
      (p) => Object.keys(p).find((k) => p[k] === 0)!,
    ),
  28: (q) =>
    orderChoice(
      q,
      ["K", "L", "M", "N"],
      (p) => p.L === p.K + 1 && p.M < p.K && p.N !== 0,
    ),
  29: (q) =>
    orderChoice(
      q,
      ["A", "B", "C", "D", "E"],
      (p) =>
        p.E === 4 && p.D === p.C + 1 && p.A < p.C && p.B > p.A && p.B < p.D,
    ),
  30: () =>
    queryFromOrders(
      ["P", "Q", "R", "S", "T"],
      (p) => p.R === 2 && p.P < p.Q && p.S === p.Q + 1 && p.T < p.P,
      (p) => p.S + 1,
    ),
};
const combos = (items: string[], size: number) =>
  permutations(items)
    .map((p) => p.slice(0, size))
    .filter(
      (p, i, a) =>
        a.findIndex(
          (x) => [...x].sort().join("") === [...p].sort().join(""),
        ) === i,
    );
export const problem: Record<number, (q: Question) => Result> = {
  11: () => bestRow(pdata(1), (r) => n(r, 2) / n(r, 1)),
  12: () => bestRow(pdata(2), (r) => n(r, 1) / n(r, 2)),
  13: () => bestRow(pdata(3), (r) => (n(r, 1) - n(r, 2)) * n(r, 3)),
  14: () => bestRow(pdata(4), (r) => n(r, 2) - n(r, 1)),
  15: () => bestRow(pdata(5), (r) => (n(r, 2) / n(r, 1) >= 0.9 ? 1 : 0)),
  16: () => bestRow(pdata(6), (r) => n(r, 1) / n(r, 2), false),
  17: () => bestRow(pdata(7), (r) => n(r, 1) + n(r, 2) - n(r, 3), false),
  18: () => {
    const rs = rows(pdata(8));
    const rates = ["A", "B"].map((x) =>
      rs.filter((r) => r[0] === x).map((r) => n(r, 3) / n(r, 2)),
    );
    if (!rates[0].every((rate, i) => rate < rates[1][i]))
      throw Error("Perbandingan perusahaan tidak berlaku");
    return txt("Perusahaan A");
  },
  19: () => {
    const rs = rows(pdata(9)).filter((r) => n(r, 1) <= 80 && n(r, 2) <= 900);
    const max = Math.max(...rs.map((r) => n(r, 1)));
    return txt(String(rs.find((r) => n(r, 1) === max)![0]));
  },
  20: () => {
    const rs = rows(pdata(10));
    const rate = (period: string) => {
      const a = rs.filter((r) => r[0] === period);
      return sum(a.map((r) => n(r, 2))) / sum(a.map((r) => n(r, 3)));
    };
    return num((rate("II") / rate("I") - 1) * 100);
  },
  21: (q) =>
    orderChoice(
      q,
      ["A", "B", "C", "D"],
      (p) => p.A === 0 && p.A < p.C && p.D === p.B + 1,
    ),
  22: () => {
    const gs = combos(["A", "B", "C", "D"], 2).filter(
      (g) =>
        !g.includes("B") &&
        g.includes("A") === g.includes("C") &&
        !(g.includes("C") && g.includes("D")),
    );
    if (gs.length !== 1) throw Error("Shift tidak unik");
    return txt(gs[0].sort().join(" dan "));
  },
  23: () => {
    const valid = ["P", "Q"].filter((modem) => !(modem === "Q"));
    if (valid.length !== 1) throw Error("Modem tidak unik");
    return txt(valid[0]);
  },
  24: () =>
    queryFromOrders(
      ["musik", "diskusi", "ujian"],
      (p) => p.musik !== 0 && p.ujian === 2,
      (p) => ["A", "B", "C"][p.musik],
    ),
  25: (q) =>
    orderChoice(
      q,
      ["A", "B", "C", "D", "E"],
      (p) => p.C > p.A && p.C > p.B && p.D > p.C,
    ),
  26: () => num(Math.max(...range(1, 12).filter((y) => 12 - 3 * y >= 3))),
  27: (q) =>
    choose(q, (t) => {
      const match = t.match(/^A-([XYZ]), B-([XYZ]), C-([XYZ])$/);
      return (
        !!match &&
        new Set(match.slice(1)).size === 3 &&
        match[1] !== "X" &&
        match[2] === "X" &&
        match[3] !== "Y"
      );
    }),
  28: (q) => {
    const allowed = combos(["K", "L", "M", "N"], 2).filter(
      (g) =>
        g.includes("N") &&
        (!g.includes("K") || g.includes("L")) &&
        !(g.includes("M") && g.includes("L")),
    );
    return choose(q, (t) => allowed.some((g) => g.sort().join(" dan ") === t));
  },
  29: () => {
    const all = ["P", "Q", "R", "S", "T"];
    const gs = [...combos(all, 2), ...combos(all, 3)].filter(
      (g) =>
        g.includes("P") &&
        g.includes("Q") &&
        g.includes("R") === g.includes("S") &&
        !g.includes("T"),
    );
    const others = new Set(
      gs.map((g) => all.filter((x) => !g.includes(x)).join(", ")),
    );
    if (others.size !== 1) throw Error("Panel tidak unik");
    return txt([...others][0].replace("R, S, T", "R, S, dan T"));
  },
  30: (q) =>
    choose(q, (t) => {
      const m = t.match(/^([ABC])-G1, ([ABC])-G2, ([ABC])-G3$/);
      if (!m) return false;
      const p = positions(m.slice(1));
      return (
        new Set(m.slice(1)).size === 3 && p.A !== 0 && p.B === 2 && p.C !== 2
      );
    }),
  31: () => {
    const xs = [
      [80, 5],
      [100, 3],
      [90, 4],
      [120, 2],
      [110, 4],
    ];
    const valid = xs
      .map(([cost, days], i) => ({ cost, days, i }))
      .filter((x) => x.days <= 3)
      .sort((a, b) => a.cost - b.cost);
    return txt("ABCDE"[valid[0].i]);
  },
  32: () => {
    const xs = [
      [4, 8],
      [6, 15],
      [5, 11],
      [7, 18],
      [3, 6],
    ];
    const valid = xs
      .map(([cost, benefit], i) => ({ cost, benefit, i }))
      .filter((x) => x.cost <= 5)
      .sort((a, b) => b.benefit - a.benefit);
    return txt("ABCDE"[valid[0].i]);
  },
  33: () => {
    const days = [
      ["Senin", "Selasa"],
      ["Selasa", "Rabu"],
      ["Selasa", "Kamis"],
    ];
    return txt(days[0].find((d) => days.every((g) => g.includes(d)))!);
  },
  34: () => {
    const vals = [
      [8, 5],
      [7, 2],
      [9, 8],
      [6, 1],
      [8, 7],
    ].map(([m, c]) => 2 * m - c);
    return txt("ABCDE"[vals.indexOf(Math.max(...vals))]);
  },
  35: () => {
    const costs = [3, 4, 8],
      cover = [1, 2, 3];
    const xs = range(1, 7)
      .map((mask) => ({
        mask,
        cost: sum(costs.filter((_, i) => mask & (1 << i))),
        coverage: cover.reduce((a, c, i) => (mask & (1 << i) ? a | c : a), 0),
      }))
      .filter((x) => x.coverage === 3)
      .sort((a, b) => a.cost - b.cost);
    return txt(
      ["A", "B", "C"].filter((_, i) => xs[0].mask & (1 << i)).join(" dan "),
    );
  },
  36: () => {
    const vals = [
      [8, 6],
      [10, 3],
      [7, 8],
      [12, 2],
      [9, 7],
    ].map(([a, b]) => a + b);
    return txt("ABCDE"[vals.indexOf(Math.min(...vals))]);
  },
  37: () => {
    const vals = [
      [0.1, 100],
      [0.4, 40],
      [0.2, 60],
      [0.05, 200],
      [0.3, 30],
    ].map(([p, d]) => p * d);
    return txt("ABCDE"[vals.indexOf(Math.max(...vals))]);
  },
  38: () => {
    const options = [
      [98, 8],
      [99.5, 14],
      [99, 12],
      [97, 6],
      [98.5, 10],
    ];
    const indexes = options
      .map(([u, c], i) => (u >= 99 && c <= 12 ? i : -1))
      .filter((i) => i >= 0);
    if (indexes.length !== 1) throw Error("Server tidak unik");
    return txt("ABCDE"[indexes[0]]);
  },
  39: () => {
    const durations = [2, 3, 4],
      benefits = [5, 8, 9];
    const xs = range(0, 7)
      .map((mask) => ({
        mask,
        time: sum(durations.filter((_, i) => mask & (1 << i))),
        benefit: sum(benefits.filter((_, i) => mask & (1 << i))),
      }))
      .filter((x) => x.time <= 6)
      .sort((a, b) => b.benefit - a.benefit);
    return txt(
      ["A", "B", "C"].filter((_, i) => xs[0].mask & (1 << i)).join(" dan "),
    );
  },
  40: () => {
    const vals = [
      [5, 0.2],
      [10, 0.1],
      [15, 0.02],
      [0, 0.3],
      [8, 0.15],
    ].map(([c, p]) => c + p * 100);
    return txt("ABCDE"[vals.indexOf(Math.min(...vals))]);
  },
  41: () =>
    num(
      Math.min(
        ...range(0, 10).flatMap((s) =>
          range(0, 10)
            .filter((b) => 4 * s + 10 * b >= 24)
            .map((b) => 3 * s + 8 * b),
        ),
      ),
    ),
  42: () => {
    const t = range(0, 100)
      .map((i) => i / 10)
      .find((t) => 12 * Math.max(0, t - 1) + 8 * t >= 68);
    return num(t!);
  },
  43: () =>
    num(
      Math.max(
        ...range(0, 4).flatMap((a) =>
          range(0, 3)
            .filter((b) => 3 * a + 4 * b <= 12 && a + b <= 3)
            .map((b) => 5 * a + 8 * b),
        ),
      ),
    ),
  44: () => num((3 * 2) / (5 * 4)),
  45: () =>
    num(
      Math.min(
        ...range(0, 4).flatMap((s) =>
          range(0, 4)
            .filter((b) => s + b <= 4 && 10 * s + 18 * b >= 46)
            .map((b) => 4 * s + 7 * b),
        ),
      ),
    ),
  46: () => num(2 + (1 - 2 / 6) / (1 / 6 + 1 / 3)),
  47: () => num(3 * Math.floor(100 / 30)),
  48: () => num(5 + (150 - 5 * 12) / (12 + 8 - 2)),
  49: () => num(Math.min(6 + 0.04 * 50 + 0.1 * 5, 4 + 0.1 * 50 + 0.02 * 5)),
  50: () => {
    const costs = [4, 6, 5, 3],
      benefits = [7, 12, 9, 5];
    let max = 0;
    for (let mask = 0; mask < 16; mask++) {
      const cost = sum(costs.filter((_, i) => mask & (1 << i))),
        benefit = sum(benefits.filter((_, i) => mask & (1 << i)));
      if (cost <= 10) max = Math.max(max, benefit);
    }
    return num(max);
  },
};
export function assertOracle(q: Question, result: Result) {
  const option = q.options.find((o) => o.id === q.correctAnswer);
  if (!option) throw Error(`${q.id}: kunci tidak ada`);
  if (result.kind === "letter") {
    if (q.correctAnswer !== result.value)
      throw Error(
        `${q.id}: kecukupan data ${result.value}, kunci ${q.correctAnswer}`,
      );
  } else if (result.kind === "number") {
    if (
      option.numericValue === undefined ||
      Math.abs(option.numericValue - result.value) > 1e-7
    )
      throw Error(
        `${q.id}: hitungan ${result.value}, opsi ${option.numericValue}`,
      );
    if (
      q.options.filter(
        (o) =>
          o.numericValue !== undefined &&
          Math.abs(o.numericValue - result.value) < 1e-7,
      ).length !== 1
    )
      throw Error(`${q.id}: jawaban numerik tidak unik`);
  } else if (option.text !== result.value)
    throw Error(`${q.id}: oracle ${result.value}, kunci ${option.text}`);
}
type Bits = boolean[];
const truth = (count: number) =>
  Array.from({ length: 2 ** count }, (_, mask) =>
    Array.from({ length: count }, (_, i) => !!(mask & (1 << i))),
  );
const implies = (a: boolean, b: boolean) => !a || b;
const entailed = (
  q: Question,
  count: number,
  premise: (v: Bits) => boolean,
  options: Record<string, (v: Bits) => boolean>,
) => {
  const models = truth(count).filter(premise);
  if (!models.length) throw Error(`${q.id}: premis tidak konsisten`);
  return choose(q, (t) => !!options[t] && models.every(options[t]));
};
export function verbalLogic(q: Question): Result {
  switch (q.number) {
    case 11:
      return entailed(
        q,
        5,
        ([p, c, r, s]) => p && implies(p, c) && implies(r, s),
        {
          "Nara memiliki kartu masuk": ([, c]) => c,
          "Semua pemilik kartu mengikuti lokakarya": ([p, c, r, s]) =>
            implies(c, p) && implies(s, r),
          "Nara memimpin lokakarya": (v) => v[4],
          "Tidak ada peserta yang memiliki kartu": ([p, c, r, s]) =>
            !(p && c) && !(r && s),
          "Nara tidak memiliki kartu": ([, c]) => !c,
        },
      );
    case 12: {
      const some = (
        v: Bits,
        p: (a: boolean, b: boolean, c: boolean) => boolean,
      ) => [0, 3, 6].some((i) => p(v[i], v[i + 1], v[i + 2]));
      const all = (
        v: Bits,
        p: (a: boolean, b: boolean, c: boolean) => boolean,
      ) => [0, 3, 6].every((i) => p(v[i], v[i + 1], v[i + 2]));
      return entailed(
        q,
        9,
        (v) => some(v, (a, b) => a && b) && all(v, (_, b, c) => implies(b, c)),
        {
          "Sebagian peneliti memahami komposisi": (v) =>
            some(v, (a, _, c) => a && c),
          "Semua peneliti adalah ilustrator": (v) =>
            all(v, (a, b) => implies(a, b)),
          "Semua yang memahami komposisi adalah peneliti": (v) =>
            all(v, (a, _, c) => implies(c, a)),
          "Tidak ada peneliti memahami komposisi": (v) =>
            !some(v, (a, _, c) => a && c),
          "Sebagian ilustrator tidak memahami komposisi": (v) =>
            some(v, (_, b, c) => b && !c),
        },
      );
    }
    case 13:
      return entailed(q, 3, (v) => !v.every(Boolean), {
        "Ada dokumen yang belum diperiksa": (v) => v.some((x) => !x),
        "Semua dokumen belum diperiksa": (v) => v.every((x) => !x),
        "Tidak ada dokumen": () => false,
        "Semua dokumen telah diperiksa": (v) => v.every(Boolean),
        "Jumlah dokumen yang diperiksa lebih banyak": (v) =>
          v.filter(Boolean).length > v.filter((x) => !x).length,
      });
    case 14: {
      const formulas: Record<string, (v: Bits) => boolean> = {
        "Jika bukan S maka bukan R": ([r, s]) => implies(!s, !r),
        "Jika S maka R": ([r, s]) => implies(s, r),
        "Jika bukan R maka bukan S": ([r, s]) => implies(!r, !s),
        "R dan S selalu benar": ([r, s]) => r && s,
        "R jika dan hanya jika S": ([r, s]) => r === s,
      };
      return choose(
        q,
        (t) =>
          !!formulas[t] &&
          truth(2).every((v) => formulas[t](v) === implies(v[0], v[1])),
      );
    }
    case 15:
      return entailed(q, 2, ([a, b]) => (a || b) && !a, {
        "Server B aktif": ([, b]) => b,
        "Kedua server tidak aktif": ([a, b]) => !a && !b,
        "Server A aktif": ([a]) => a,
        "Server B tidak aktif": ([, b]) => !b,
        "Kedua server aktif": ([a, b]) => a && b,
      });
    case 16: {
      const models = truth(2).filter(([p, n]) => implies(p, n) && n);
      if (new Set(models.map((v) => v[0])).size !== 2)
        throw Error("Status formulir seharusnya tidak pasti");
      return txt("Belum dapat dipastikan");
    }
    case 17: {
      const f: Record<string, (v: Bits) => boolean> = {
        "R tidak terjadi atau S tidak terjadi": ([r, s]) => !r || !s,
        "R dan S keduanya tidak terjadi": ([r, s]) => !r && !s,
        "R terjadi dan S tidak terjadi": ([r, s]) => r && !s,
        "R tidak terjadi dan S terjadi": ([r, s]) => !r && s,
        "R atau S pasti terjadi": ([r, s]) => r || s,
      };
      return choose(
        q,
        (t) => !!f[t] && truth(2).every((v) => f[t](v) === !(v[0] && v[1])),
      );
    }
    case 18:
      return entailed(
        q,
        5,
        ([i, p, j, r]) => implies(i, p) && implies(j, r) && !p,
        {
          "Damar tidak memperoleh izin": ([i]) => !i,
          "Damar memperoleh izin": ([i]) => i,
          "Semua yang lulus pasti memperoleh izin": ([i, p, j, r]) =>
            implies(p, i) && implies(r, j),
          "Tidak ada orang yang lulus": ([, p, , r]) => !p && !r,
          "Pemeriksaan pasti dibatalkan": (v) => v[4],
        },
      );
    case 19:
      return entailed(q, 2, ([k, l]) => k !== l && k, {
        "Proposal L tidak didanai": ([, l]) => !l,
        "K dan L sama-sama didanai": ([k, l]) => k && l,
        "K tidak didanai": ([k]) => !k,
        "Keduanya tidak didanai": ([k, l]) => !k && !l,
        "Pendanaan L tidak dapat ditentukan": () => false,
      });
    case 20:
      return entailed(
        q,
        3,
        ([a, u, p]) => implies(a, u) && implies(u, p) && !p,
        {
          "Audit tidak dimulai dan arsip tidak dibuka": ([a, u]) => !u && !a,
          "Audit dimulai tetapi arsip tidak dibuka": ([a, u]) => u && !a,
          "Arsip dibuka tetapi audit tidak dimulai": ([a, u]) => a && !u,
          "Arsip dan audit berlangsung": ([a, u]) => a && u,
          "Arsip dibuka dan pengawas tidak hadir tanpa pelanggaran": ([
            a,
            u,
            p,
          ]) => a && !p && implies(a, u) && implies(u, p),
        },
      );
    default:
      throw Error(`Oracle logika tidak tersedia: ${q.id}`);
  }
}
