import type { Dataset, Row } from "./types";

export function numericValues(rows: Row[], col: string): number[] {
  const out: number[] = [];
  for (const r of rows) {
    const v = r[col];
    if (typeof v === "number" && Number.isFinite(v)) out.push(v);
  }
  return out;
}

export interface DescriptiveStats {
  n: number;
  mean: number;
  median: number;
  mode: number | null;
  variance: number;
  stdev: number;
  min: number;
  max: number;
  range: number;
  sum: number;
  q1: number;
  q3: number;
  iqr: number;
  skew: number;
  kurtosis: number;
  cv: number;
  sem: number;
  ci95: [number, number];
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return NaN;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return sorted[base + 1] !== undefined
    ? sorted[base] + rest * (sorted[base + 1] - sorted[base])
    : sorted[base];
}

export function describe(values: number[]): DescriptiveStats {
  const n = values.length;
  if (n === 0) {
    return { n: 0, mean: 0, median: 0, mode: null, variance: 0, stdev: 0, min: 0, max: 0, range: 0, sum: 0, q1: 0, q3: 0, iqr: 0, skew: 0, kurtosis: 0, cv: 0, sem: 0, ci95: [0, 0] };
  }
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  const sorted = [...values].sort((a, b) => a - b);
  const median = quantile(sorted, 0.5);
  const q1 = quantile(sorted, 0.25);
  const q3 = quantile(sorted, 0.75);
  const min = sorted[0];
  const max = sorted[n - 1];
  const variance = n > 1 ? values.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1) : 0;
  const stdev = Math.sqrt(variance);
  const sem = stdev / Math.sqrt(n);
  const ci95: [number, number] = [mean - 1.96 * sem, mean + 1.96 * sem];
  const m3 = values.reduce((a, b) => a + (b - mean) ** 3, 0) / n;
  const m4 = values.reduce((a, b) => a + (b - mean) ** 4, 0) / n;
  const skew = stdev === 0 ? 0 : m3 / stdev ** 3;
  const kurtosis = stdev === 0 ? 0 : m4 / stdev ** 4 - 3;
  // mode (most frequent rounded value)
  const freq = new Map<number, number>();
  for (const v of values) freq.set(v, (freq.get(v) ?? 0) + 1);
  let mode: number | null = null, best = 1;
  for (const [v, c] of freq) if (c > best) { best = c; mode = v; }
  return {
    n, mean, median, mode, variance, stdev, min, max, range: max - min, sum,
    q1, q3, iqr: q3 - q1, skew, kurtosis,
    cv: mean === 0 ? 0 : (stdev / Math.abs(mean)) * 100,
    sem, ci95,
  };
}

export function linearRegression(xs: number[], ys: number[]) {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return { slope: 0, intercept: 0, r2: 0, predict: (x: number) => x };
  let sx = 0, sy = 0, sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    sx += xs[i]; sy += ys[i]; sxy += xs[i] * ys[i];
    sxx += xs[i] * xs[i]; syy += ys[i] * ys[i];
  }
  const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  const intercept = (sy - slope * sx) / n;
  const r = (n * sxy - sx * sy) / Math.sqrt((n * sxx - sx * sx) * (n * syy - sy * sy));
  return { slope, intercept, r2: r * r, predict: (x: number) => slope * x + intercept };
}

// Approximate one-sample t-test
export function tTestOneSample(values: number[], mu: number) {
  const s = describe(values);
  const t = s.sem === 0 ? 0 : (s.mean - mu) / s.sem;
  const df = s.n - 1;
  // approximate p-value via normal cdf for large df
  const p = 2 * (1 - normalCdf(Math.abs(t)));
  return { t, df, p, mean: s.mean, sem: s.sem };
}

export function normalCdf(z: number): number {
  // Abramowitz & Stegun approximation
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

export function summarizeDataset(d: Dataset): string {
  if (!d || d.rows.length === 0) return "(no dataset loaded)";
  const lines: string[] = [];
  lines.push(`Dataset: ${d.name} — ${d.rows.length} rows × ${d.columns.length} cols`);
  for (const c of d.columns) {
    if (c.type === "numeric") {
      const s = describe(numericValues(d.rows, c.name));
      lines.push(`- ${c.name} (num): mean=${s.mean.toFixed(2)}, sd=${s.stdev.toFixed(2)}, min=${s.min}, max=${s.max}`);
    } else {
      const set = new Set(d.rows.map((r) => r[c.name]));
      lines.push(`- ${c.name} (cat): ${set.size} unique`);
    }
  }
  return lines.join("\n");
}