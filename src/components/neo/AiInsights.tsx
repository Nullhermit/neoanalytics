import { useMemo } from "react";
import { Panel } from "./Panel";
import { useDataset } from "@/lib/dataset-store";
import { useWorkspaceMode } from "@/lib/workspace-mode";
import { describe, numericValues } from "@/lib/data/stats";
import { Sparkles, Lightbulb } from "lucide-react";

type Insight = { insight: string; suggestion: string };

export function AiInsights() {
  const { dataset } = useDataset();
  const { mode } = useWorkspaceMode();

  const items = useMemo<Insight[]>(() => {
    if (!dataset) return [];
    const out: Insight[] = [];
    const nums = dataset.columns.filter((c) => c.type === "numeric");

    if (mode === "household") {
      const inc = dataset.columns.find((c) => /income|salary/i.test(c.name));
      const sav = dataset.columns.find((c) => /saving/i.test(c.name));
      const dine = dataset.columns.find((c) => /din(e|ing)/i.test(c.name));
      if (inc) {
        const s = describe(numericValues(dataset.rows, inc.name));
        out.push({
          insight: `Your average ${inc.name.toLowerCase()} is around ₹${s.mean.toFixed(0)} per month with only ±${s.stdev.toFixed(0)} variation — income is remarkably stable.`,
          suggestion: `Lock in a fixed auto-transfer of ~₹${(s.mean * 0.2).toFixed(0)} on payday to a separate savings account before lifestyle spending begins.`,
        });
      }
      if (sav && inc) {
        const si = describe(numericValues(dataset.rows, inc.name));
        const ss = describe(numericValues(dataset.rows, sav.name));
        const rate = (ss.mean / si.mean) * 100;
        out.push({
          insight: `You're saving roughly ${rate.toFixed(1)}% of what you earn.`,
          suggestion: rate < 20
            ? `Aim for the 50/30/20 rule — trim two discretionary categories by 10% each to push savings past 20%.`
            : `Channel surplus savings into an index SIP or emergency buffer (6× monthly expenses) for compounding gains.`,
        });
      }
      if (dine && inc) {
        const si = describe(numericValues(dataset.rows, inc.name));
        const sd = describe(numericValues(dataset.rows, dine.name));
        const pct = (sd.mean / si.mean) * 100;
        out.push({
          insight: `Dining is consuming ${pct.toFixed(1)}% of your monthly income (~₹${sd.mean.toFixed(0)}).`,
          suggestion: pct > 8
            ? `Cap dining-out to twice a week — a 50% cut would free ~₹${(sd.mean / 2).toFixed(0)}/month for savings or experiences.`
            : `Healthy ratio. Keep tracking weekly so it doesn't drift upward during festive months.`,
        });
      }
      if (out.length === 0) {
        out.push({
          insight: `No income / savings / dining columns detected in your dataset.`,
          suggestion: `Load the Household demo from the data panel, or rename a column to "Income" / "Savings" to unlock budgeting tips.`,
        });
      }
    } else if (mode === "research") {
      for (const c of nums.slice(0, 4)) {
        const s = describe(numericValues(dataset.rows, c.name));
        const skewed = Math.abs(s.skew) > 1;
        out.push({
          insight: `${c.name}: x̄ = ${s.mean.toFixed(3)}, s = ${s.stdev.toFixed(3)}, n = ${s.n}; 95% CI for μ ∈ [${s.ci95[0].toFixed(2)}, ${s.ci95[1].toFixed(2)}]${skewed ? ` · ${s.skew > 0 ? "right" : "left"}-skewed (γ₁ = ${s.skew.toFixed(2)})` : ""}.`,
          suggestion: skewed
            ? `Distribution violates normality — apply a log/Box-Cox transform, or prefer non-parametric tests (Mann-Whitney, Wilcoxon) over Student's t.`
            : `Distribution is approximately normal — Student's t-tests and Pearson correlations are appropriate. Verify with Shapiro-Wilk for n < 50.`,
        });
      }
      if (out.length === 0) out.push({ insight: "No numeric variables found.", suggestion: "Add at least one numeric column to run descriptive statistics." });
    } else {
      const nulls = dataset.rows.reduce((a, r) => a + dataset.columns.filter((c) => r[c.name] === null).length, 0);
      const total = dataset.rows.length * dataset.columns.length;
      const nullPct = total ? (nulls / total) * 100 : 0;
      out.push({
        insight: `Schema: ${dataset.columns.length} columns (${nums.length} numeric) · ${dataset.rows.length.toLocaleString()} rows resident in memory with O(1) column access.`,
        suggestion: `Index your primary key column server-side and stream rows in batches of 10k for sub-100ms paginated APIs.`,
      });
      out.push({
        insight: `Null pressure: ${nulls} null cells (${nullPct.toFixed(2)}% of grid).`,
        suggestion: nullPct > 5
          ? `Add NOT NULL constraints + default values in your schema migration, or impute with column mean/mode before training ML models.`
          : `Data is dense — safe to feed directly into pandas / Polars / SQL aggregations without dropna().`,
      });
      out.push({
        insight: `Throughput estimate: ${(dataset.rows.length / 1e6).toFixed(3)}M rows in client memory.`,
        suggestion: `For >1M rows, move aggregations to a worker thread or DuckDB-WASM to keep the main thread under 16ms/frame.`,
      });
    }
    return out;
  }, [dataset, mode]);

  if (!dataset) return null;
  return (
    <Panel title="Conversational Insights" subtitle="Mode-aware · insight + actionable suggestion">
      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={i} className="rounded-md border border-border bg-card/40 overflow-hidden animate-glitch-in">
            <div className="flex gap-2 p-3 border-b border-border/60 bg-primary/5">
              <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-[0.2em] text-primary/80 font-semibold mb-1">Insight</div>
                <p className="text-sm leading-relaxed text-foreground/90">{it.insight}</p>
              </div>
            </div>
            <div className="flex gap-2 p-3 bg-accent/5">
              <Lightbulb className="size-4 text-accent shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-[0.2em] text-accent/80 font-semibold mb-1">Suggestion</div>
                <p className="text-sm leading-relaxed text-foreground/80">{it.suggestion}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}