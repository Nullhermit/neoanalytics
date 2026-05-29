import { useMemo } from "react";
import { Panel } from "./Panel";
import { useDataset } from "@/lib/dataset-store";
import { useWorkspaceMode } from "@/lib/workspace-mode";
import { describe, numericValues } from "@/lib/data/stats";
import { Sparkles } from "lucide-react";

export function AiInsights() {
  const { dataset } = useDataset();
  const { mode } = useWorkspaceMode();

  const insights = useMemo<string[]>(() => {
    if (!dataset) return [];
    const out: string[] = [];
    const nums = dataset.columns.filter((c) => c.type === "numeric");
    if (mode === "household") {
      const inc = dataset.columns.find((c) => /income|salary/i.test(c.name));
      const sav = dataset.columns.find((c) => /saving/i.test(c.name));
      const dine = dataset.columns.find((c) => /din(e|ing)/i.test(c.name));
      if (inc) {
        const s = describe(numericValues(dataset.rows, inc.name));
        out.push(`Your average ${inc.name.toLowerCase()} is around ₹${s.mean.toFixed(0)} per month — nice and steady (varies only ±${s.stdev.toFixed(0)}).`);
      }
      if (sav && inc) {
        const si = describe(numericValues(dataset.rows, inc.name));
        const ss = describe(numericValues(dataset.rows, sav.name));
        const rate = (ss.mean / si.mean) * 100;
        out.push(`You're saving roughly ${rate.toFixed(1)}% of what you earn. ${rate < 20 ? "Try nudging this above 20% — even tiny cuts compound fast." : "That's a healthy savings rate — keep it going!"}`);
      }
      if (dine && inc) {
        const si = describe(numericValues(dataset.rows, inc.name));
        const sd = describe(numericValues(dataset.rows, dine.name));
        const pct = (sd.mean / si.mean) * 100;
        out.push(`Dining is eating ${pct.toFixed(1)}% of your income. ${pct > 8 ? `Cutting it by half could free up ~₹${(sd.mean / 2).toFixed(0)} every month.` : "That's well in check."}`);
      }
      if (out.length === 0) out.push("Load the household demo to see friendly budgeting tips.");
    } else if (mode === "research") {
      for (const c of nums.slice(0, 4)) {
        const s = describe(numericValues(dataset.rows, c.name));
        const skewNote = Math.abs(s.skew) > 1 ? ` Distribution is ${s.skew > 0 ? "right" : "left"}-skewed (γ₁ = ${s.skew.toFixed(2)}), suggesting non-normality.` : "";
        out.push(`${c.name}: x̄ = ${s.mean.toFixed(3)}, s = ${s.stdev.toFixed(3)}, n = ${s.n}. 95% CI for μ ∈ [${s.ci95[0].toFixed(2)}, ${s.ci95[1].toFixed(2)}].${skewNote}`);
      }
    } else {
      out.push(`Schema: ${dataset.columns.length} cols (${nums.length} numeric).`);
      out.push(`Throughput: ${dataset.rows.length.toLocaleString()} rows resident in memory · O(1) column access via Map.`);
      out.push(`Null pressure: ${dataset.rows.reduce((a, r) => a + dataset.columns.filter((c) => r[c.name] === null).length, 0)} null cells total.`);
    }
    return out;
  }, [dataset, mode]);

  if (!dataset) return null;
  return (
    <Panel title="Conversational Insights" subtitle="Mode-aware · human voice" >
      <div className="space-y-2">
        {insights.map((t, i) => (
          <div key={i} className="flex gap-2 text-sm rounded-md border border-border bg-card/40 p-3 animate-glitch-in">
            <Sparkles className="size-4 text-accent shrink-0 mt-0.5" />
            <p className="leading-relaxed text-foreground/90">{t}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}