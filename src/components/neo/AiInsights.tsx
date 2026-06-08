import { useMemo } from "react";
import { Panel } from "./Panel";
import { useDataset, useCountryMeta } from "@/lib/dataset-store";
import { useWorkspaceMode } from "@/lib/workspace-mode";
import { describe, numericValues } from "@/lib/data/stats";
import { Sparkles, Lightbulb } from "lucide-react";

type Insight = { insight: string; suggestion: string };

export function AiInsights() {
  const { dataset } = useDataset();
  const { mode } = useWorkspaceMode();
  const cm = useCountryMeta();
  const sym = cm.symbol;

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
          insight: `Your average ${inc.name.toLowerCase()} is around ${sym}${s.mean.toFixed(0)} per month with only ±${sym}${s.stdev.toFixed(0)} variation — income is remarkably stable for a ${cm.name} household.`,
          suggestion: countryTip(cm.code, "income", s.mean, sym),
        });
      }
      if (sav && inc) {
        const si = describe(numericValues(dataset.rows, inc.name));
        const ss = describe(numericValues(dataset.rows, sav.name));
        const rate = (ss.mean / si.mean) * 100;
        out.push({
          insight: `You're saving roughly ${rate.toFixed(1)}% of what you earn — benchmark for ${cm.name} is ${benchmarkSaveRate(cm.code)}%.`,
          suggestion: countryTip(cm.code, "savings", rate, sym),
        });
      }
      if (dine && inc) {
        const si = describe(numericValues(dataset.rows, inc.name));
        const sd = describe(numericValues(dataset.rows, dine.name));
        const pct = (sd.mean / si.mean) * 100;
        out.push({
          insight: `Dining is consuming ${pct.toFixed(1)}% of your monthly income (~${sym}${sd.mean.toFixed(0)}).`,
          suggestion: pct > 8
            ? `Cap dining-out to twice a week — a 50% cut would free ~${sym}${(sd.mean / 2).toFixed(0)}/month for ${cm.code === "US" ? "401(k) matching" : cm.code === "GB" ? "your ISA" : cm.code === "IN" ? "an index SIP" : cm.code === "JP" ? "your NISA account" : "savings"}.`
            : `Healthy ratio for ${cm.name}. Keep tracking weekly so it doesn't drift upward during festive months.`,
        });
      }
      if (out.length === 0) {
        out.push({
          insight: `No income / savings / dining columns detected in your dataset.`,
          suggestion: `Load the Household demo from the data panel, or rename a column to "Income" / "Savings" to unlock budgeting tips.`,
        });
      }
      // Always inject a country-economy macro tip
      out.push({
        insight: `Macro context · ${cm.flag} ${cm.name} (${cm.currency}): ${cm.note}`,
        suggestion: countryTip(cm.code, "macro", 0, sym),
      });
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
    } else if (mode === "business") {
      for (const c of nums.slice(0, 3)) {
        const s = describe(numericValues(dataset.rows, c.name));
        const cv = s.mean ? (s.stdev / Math.abs(s.mean)) * 100 : 0;
        out.push({
          insight: `${c.name}: average ${sym}${s.mean.toFixed(2)} per record · ${cv.toFixed(1)}% coefficient of variation across ${s.n} entries.`,
          suggestion: cv > 50
            ? `Volatility is high — segment this KPI by region/channel to isolate the top-quartile performers driving variance.`
            : `KPI is steady — set a target of +10% QoQ and track weekly deltas in a dashboard alert.`,
        });
      }
      if (out.length === 0) out.push({ insight: "No numeric KPIs detected.", suggestion: "Load the Sales demo or add a revenue column to surface growth insights." });
      out.push({
        insight: `Strategic context · ${cm.flag} ${cm.name}: ${cm.note}`,
        suggestion: `Benchmark unit economics against the ${cm.currency} regional median before greenlighting expansion.`,
      });
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
  }, [dataset, mode, cm, sym]);

  if (!dataset) return null;
  return (
    <Panel title="Conversational Insights" subtitle={`Mode-aware · ${cm.flag} ${cm.name} (${cm.currency}) tuned`}>
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

function benchmarkSaveRate(code: string): number {
  return ({ IN: 30, US: 12, GB: 8, EU: 14, JP: 28, SG: 35, BR: 6, AE: 22, AU: 15, CA: 9 } as Record<string, number>)[code] ?? 20;
}

function countryTip(code: string, topic: "income" | "savings" | "macro", val: number, sym: string): string {
  if (topic === "income") {
    switch (code) {
      case "IN": return `Auto-debit ~${sym}${(val * 0.2).toFixed(0)} to an index SIP on the 1st — Section 80C ELSS funds also slash tax up to ${sym}1,50,000/yr.`;
      case "US": return `Capture the full 401(k) employer match first (free money), then funnel ~${sym}${(val * 0.15).toFixed(0)} to a Roth IRA each month.`;
      case "GB": return `Max your £20k/yr Stocks & Shares ISA — auto-invest ~${sym}${(val * 0.15).toFixed(0)} monthly into a global tracker.`;
      case "JP": return `Open a Tsumitate NISA and DCA ~${sym}${(val * 0.2).toFixed(0)} into eMAXIS Slim — gains are tax-free for 20 years.`;
      case "SG": return `Top up CPF Special Account above your mandatory contribution; ~${sym}${(val * 0.1).toFixed(0)} extra/month earns 4% risk-free.`;
      case "AE": return `No income tax means a 30% savings rate is realistic — wire ${sym}${(val * 0.3).toFixed(0)} home or into a global ETF before lifestyle creep.`;
      case "BR": return `With Selic high, Tesouro Selic gives ~13% nominal — park ~${sym}${(val * 0.2).toFixed(0)} there before any consumption.`;
      case "AU": return `Salary-sacrifice ~${sym}${(val * 0.1).toFixed(0)} into super for the 15% concessional tax rate — compounds tax-sheltered until 60.`;
      case "CA": return `Fill TFSA contribution room first ($7k/yr), then RRSP — ~${sym}${(val * 0.15).toFixed(0)} monthly into XEQT covers both.`;
      default:   return `Direct-debit ~${sym}${(val * 0.2).toFixed(0)} on payday to a separate savings account before lifestyle spending begins.`;
    }
  }
  if (topic === "savings") {
    const bm = benchmarkSaveRate(code);
    if (val < bm) return `Below the ${code} benchmark of ${bm}%. Trim two discretionary categories by 10% each and aim for ${bm}% within 3 months.`;
    return `Above the ${code} benchmark of ${bm}% — surplus is best deployed into ${code === "US" ? "VTI/VXUS" : code === "IN" ? "an index SIP" : code === "JP" ? "your NISA" : code === "GB" ? "a global ISA tracker" : "a diversified ETF"}.`;
  }
  // macro
  switch (code) {
    case "IN": return `Hedge against rupee depreciation by keeping 10–20% of long-term savings in a USD-denominated international fund.`;
    case "US": return `Lock in HYSA rates while they're elevated; refinance any debt above 7% APR aggressively.`;
    case "GB": return `Energy and council tax are sticky — shop tariffs annually, and use ISA/SIPP wrappers to outrun frozen tax thresholds.`;
    case "EU": return `VAT inflates sticker prices ~20%; comparison-shop cross-border within the EU for big-ticket items.`;
    case "JP": return `Yen weakness rewards foreign-asset exposure; cap domestic-only holdings under 60% of portfolio.`;
    case "SG": return `Property loans are tied to SORA — fix your mortgage rate when SORA dips below 3%.`;
    case "BR": return `Inflation linkage matters — favor IPCA+ bonds over pre-fixados for any horizon beyond 12 months.`;
    case "AE": return `Build a 6-month emergency fund in a global currency; visa-tied income means liquidity > yield.`;
    case "AU": return `Negative gearing on property is powerful but illiquid; balance with low-cost ETFs (VAS/VGS).`;
    case "CA": return `Lock in fixed mortgage rates during BoC pauses; carbon rebate can fund a TFSA contribution every quarter.`;
    default:   return `Diversify across asset classes and review allocations quarterly.`;
  }
}