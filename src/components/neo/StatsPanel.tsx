import { useMemo, useState } from "react";
import { Panel } from "./Panel";
import { useDataset } from "@/lib/dataset-store";
import { describe, numericValues } from "@/lib/data/stats";
import { InfoTip, PLAIN_ENGLISH } from "./InfoTip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, FunctionSquare, Briefcase } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useWorkspaceMode } from "@/lib/workspace-mode";

const SYLLABUS = [
  { unit: "Unit 1: Measures of Central Tendency", keys: ["mean", "median", "mode"] },
  { unit: "Unit 2: Measures of Dispersion", keys: ["variance", "stdev", "range", "iqr", "cv"] },
  { unit: "Unit 3: Shape & Distribution", keys: ["skew", "kurtosis"] },
  { unit: "Unit 4: Estimation & Confidence", keys: ["sem", "ci95"] },
] as const;

function fmt(n: number) {
  if (!Number.isFinite(n)) return "—";
  return Math.abs(n) > 1e6 || (Math.abs(n) > 0 && Math.abs(n) < 1e-3) ? n.toExponential(3) : n.toFixed(3);
}

const BUSINESS: Record<string, (v: number, mean: number) => string> = {
  stdev: (v, m) => `High variance → unpredictable demand. ±${fmt(v)} swing around ₹${fmt(m)} avg = harder forecasting & higher inventory buffers.`,
  cv: (v) => `CV = ${fmt(v)}%. >25% means revenue/output is volatile — investors price this as risk.`,
  ci95: (v, m) => `True average is likely within ±${fmt(v - m)} of ₹${fmt(m)} — use this band for budget guardrails.`,
  skew: (v) => v > 0.5 ? "Right-skewed: a few outliers (whales) drive most revenue. Concentration risk." : v < -0.5 ? "Left-skewed: most outcomes are good, but rare large losses pull the tail." : "Roughly symmetric — predictable distribution.",
};

function formula(key: string, vals: number[], s: ReturnType<typeof describe>): { tex: string; steps: string[] } {
  const sum = vals.reduce((a, b) => a + b, 0);
  switch (key) {
    case "mean":
      return { tex: "x̄ = (Σ xᵢ) / n", steps: [`Σ xᵢ = ${fmt(sum)}`, `n = ${s.n}`, `x̄ = ${fmt(sum)} / ${s.n} = ${fmt(s.mean)}`] };
    case "variance":
      return { tex: "s² = Σ(xᵢ - x̄)² / (n - 1)", steps: [`x̄ = ${fmt(s.mean)}`, `Σ(xᵢ - x̄)² = ${fmt(s.variance * Math.max(1, s.n - 1))}`, `s² = … / ${s.n - 1} = ${fmt(s.variance)}`] };
    case "stdev":
      return { tex: "s = √s²", steps: [`s² = ${fmt(s.variance)}`, `s = √${fmt(s.variance)} = ${fmt(s.stdev)}`] };
    case "sem":
      return { tex: "SE = s / √n", steps: [`s = ${fmt(s.stdev)}`, `√n = ${fmt(Math.sqrt(s.n))}`, `SE = ${fmt(s.sem)}`] };
    case "ci95":
      return { tex: "CI₉₅ = x̄ ± 1.96·SE", steps: [`x̄ = ${fmt(s.mean)}`, `1.96·SE = ${fmt(1.96 * s.sem)}`, `[${fmt(s.ci95[0])}, ${fmt(s.ci95[1])}]`] };
    case "median":
      return { tex: "Middle value of the sorted data", steps: [`n = ${s.n}`, `median = ${fmt(s.median)}`] };
    case "mode":
      return { tex: "Most frequent value", steps: [`mode = ${s.mode === null ? "no mode" : fmt(s.mode)}`] };
    case "iqr":
      return { tex: "IQR = Q₃ − Q₁", steps: [`Q₁ = ${fmt(s.q1)}`, `Q₃ = ${fmt(s.q3)}`, `IQR = ${fmt(s.iqr)}`] };
    case "range":
      return { tex: "Range = max − min", steps: [`max = ${fmt(s.max)}, min = ${fmt(s.min)}`, `= ${fmt(s.range)}`] };
    case "cv":
      return { tex: "CV = (s / |x̄|) × 100%", steps: [`s = ${fmt(s.stdev)}`, `x̄ = ${fmt(s.mean)}`, `CV = ${fmt(s.cv)}%`] };
    case "skew":
      return { tex: "skew = E[(x-x̄)³] / s³", steps: [`= ${fmt(s.skew)}`] };
    case "kurtosis":
      return { tex: "kurt = E[(x-x̄)⁴] / s⁴ − 3", steps: [`= ${fmt(s.kurtosis)} (excess)`] };
  }
  return { tex: "—", steps: [] };
}

export function StatsPanel() {
  const { dataset, outlierOffset, setOutlierOffset } = useDataset();
  const { mode } = useWorkspaceMode();
  const numericCols = dataset?.columns.filter((c) => c.type === "numeric") ?? [];
  const [col, setCol] = useState<string>("");
  const [businessMode, setBusinessMode] = useState(false);

  const activeCol = col || numericCols[0]?.name || "";
  const baseVals = useMemo(() => activeCol && dataset ? numericValues(dataset.rows, activeCol) : [], [activeCol, dataset]);
  const vals = useMemo(() => outlierOffset === 0 ? baseVals : [...baseVals, outlierOffset], [baseVals, outlierOffset]);
  const stats = useMemo(() => describe(vals), [vals]);

  if (!dataset) return <Panel title="Statistical Engine"><p className="text-sm text-muted-foreground">Load a dataset to begin computing.</p></Panel>;

  const valuesByKey: Record<string, number | [number, number] | null> = {
    mean: stats.mean, median: stats.median, mode: stats.mode,
    variance: stats.variance, stdev: stats.stdev, range: stats.range, iqr: stats.iqr, cv: stats.cv,
    skew: stats.skew, kurtosis: stats.kurtosis,
    sem: stats.sem, ci95: stats.ci95,
  };

  return (
    <Panel
      title="Statistical Engine"
      subtitle={`n = ${stats.n} · syllabus-aligned · show-your-work`}
      action={
        <div className="flex items-center gap-3 text-xs">
          {mode === "research" && (
            <label className="flex items-center gap-2 text-muted-foreground">
              <Briefcase className="size-3.5" />
              Corporate ROI
              <Switch checked={businessMode} onCheckedChange={setBusinessMode} />
            </label>
          )}
          <Select value={activeCol} onValueChange={setCol}>
            <SelectTrigger className="h-8 w-[180px] bg-card/60"><SelectValue /></SelectTrigger>
            <SelectContent>{numericCols.map((c) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      }
    >
      <div className="mb-5 rounded-md border border-border bg-card/40 p-3">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="uppercase tracking-wider text-muted-foreground">"What-If" Outlier Injection</span>
          <span className="font-mono text-accent">{outlierOffset === 0 ? "off" : outlierOffset.toFixed(0)}</span>
        </div>
        <Slider
          min={Math.floor(stats.min - stats.range * 2)}
          max={Math.ceil(stats.max + stats.range * 2)}
          step={Math.max(1, Math.round(stats.range / 100))}
          value={[outlierOffset]}
          onValueChange={(v) => setOutlierOffset(v[0])}
        />
        <p className="text-[10px] text-muted-foreground mt-1">Drag to inject a fake value into the dataset and watch every stat shift live.</p>
      </div>

      <div className="space-y-5">
        {SYLLABUS.map((unit) => (
          <div key={unit.unit}>
            <h4 className="text-[10px] uppercase tracking-[0.3em] text-accent mb-2">{unit.unit}</h4>
            <div className="grid gap-2 sm:grid-cols-2">
              {unit.keys.map((k) => {
                const val = valuesByKey[k];
                const display = val === null ? "—" : Array.isArray(val) ? `[${fmt(val[0])}, ${fmt(val[1])}]` : fmt(val);
                const fx = formula(k, vals, stats);
                return (
                  <Collapsible key={k} className="rounded-md border border-border bg-card/40 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs uppercase tracking-wider text-muted-foreground">{k}</span>
                        <InfoTip>{PLAIN_ENGLISH[k]}</InfoTip>
                      </div>
                      <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-accent">
                        <FunctionSquare className="size-3" /> show work <ChevronDown className="size-3" />
                      </CollapsibleTrigger>
                    </div>
                    <div className="mt-1 font-mono text-lg text-foreground text-glow">{display}</div>
                    <CollapsibleContent className="mt-2 rounded bg-background/60 p-2 text-xs font-mono text-muted-foreground space-y-1">
                      <div className="text-accent">{fx.tex}</div>
                      {fx.steps.map((s, i) => <div key={i}>{s}</div>)}
                    </CollapsibleContent>
                    {businessMode && BUSINESS[k] && (
                      <p className="mt-2 rounded bg-accent/10 px-2 py-1 text-[11px] text-accent">
                        {BUSINESS[k]((Array.isArray(val) ? val[1] : (val ?? 0)) as number, stats.mean)}
                      </p>
                    )}
                  </Collapsible>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}