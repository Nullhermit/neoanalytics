import { useMemo, useState } from "react";
import { Panel } from "./Panel";
import { useDataset } from "@/lib/dataset-store";
import { numericValues, tTestOneSample } from "@/lib/data/stats";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Beaker } from "lucide-react";

export function HypothesisWizard() {
  const { dataset } = useDataset();
  const numCols = dataset?.columns.filter((c) => c.type === "numeric") ?? [];
  const [col, setCol] = useState("");
  const [mu, setMu] = useState("0");
  const [run, setRun] = useState(false);
  const active = col || numCols[0]?.name || "";

  const result = useMemo(() => {
    if (!run || !dataset || !active) return null;
    return tTestOneSample(numericValues(dataset.rows, active), Number(mu));
  }, [run, dataset, active, mu]);

  if (!dataset) return null;
  return (
    <Panel title="Hypothesis Assistant" subtitle="One-sample t-test wizard">
      <div className="grid gap-3 sm:grid-cols-3 items-end">
        <div>
          <label className="text-xs text-muted-foreground">Column</label>
          <Select value={active} onValueChange={setCol}>
            <SelectTrigger className="bg-card/60"><SelectValue /></SelectTrigger>
            <SelectContent>{numCols.map((c) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">μ₀ (hypothesized mean)</label>
          <Input value={mu} onChange={(e) => setMu(e.target.value)} className="bg-card/60" />
        </div>
        <Button onClick={() => setRun(true)} className="bg-[image:var(--gradient-hero)] text-primary-foreground glow-primary">
          <Beaker className="size-4 mr-2" /> Run Test
        </Button>
      </div>
      <div className="mt-4 grid gap-2 text-sm">
        <div className="rounded-md border border-border bg-card/40 p-3">
          <div><span className="text-accent font-mono">H₀:</span> μ = {mu} — the true mean equals the hypothesized value.</div>
          <div><span className="text-accent font-mono">H₁:</span> μ ≠ {mu} — the true mean is different (two-tailed).</div>
        </div>
        {result && (
          <div className="rounded-md border border-border bg-card/40 p-3 font-mono text-xs space-y-1">
            <div>t = (x̄ − μ₀) / SE = ({result.mean.toFixed(3)} − {mu}) / {result.sem.toFixed(3)} = <span className="text-glow text-accent">{result.t.toFixed(3)}</span></div>
            <div>df = n − 1 = {result.df}</div>
            <div>p-value (two-tailed, normal approx) ≈ <span className="text-glow text-accent">{result.p.toFixed(4)}</span></div>
            <div className={result.p < 0.05 ? "text-[var(--neon-cyan)]" : "text-muted-foreground"}>
              {result.p < 0.05 ? "→ Reject H₀ at α = 0.05. The difference is statistically significant." : "→ Fail to reject H₀. Insufficient evidence of a difference."}
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}