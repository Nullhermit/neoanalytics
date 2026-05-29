import { useRef, useState } from "react";
import { Panel } from "./Panel";
import { Button } from "@/components/ui/button";
import { useDataset } from "@/lib/dataset-store";
import { parseFile } from "@/lib/data/parse";
import { DEMO_DATASETS } from "@/lib/data/demo";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useWorkspaceMode } from "@/lib/workspace-mode";

export function DataPanel() {
  const { dataset, setDataset } = useDataset();
  const { mode } = useWorkspaceMode();
  const ref = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const loadDemo = (id: string) => {
    const d = DEMO_DATASETS.find((x) => x.id === id);
    if (!d) return;
    const start = performance.now();
    setDataset(d.build());
    const ms = (performance.now() - start).toFixed(1);
    toast.success(`Loaded ${d.label} in ${ms}ms`);
  };

  const onFile = async (file: File) => {
    setLoading(true);
    const start = performance.now();
    try {
      const ds = await parseFile(file);
      const ms = (performance.now() - start).toFixed(1);
      setDataset(ds);
      toast.success(`Parsed ${ds.rows.length.toLocaleString()} rows × ${ds.columns.length} cols in ${ms}ms`);
    } catch (e) {
      toast.error("Failed to parse: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const defaultDemo = mode === "household" ? "household" : mode === "developer" ? "sales" : "sales";

  return (
    <Panel title="Data Source" subtitle="Client-side · zero server lag">
      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          onClick={() => loadDemo(defaultDemo)}
          className="bg-[image:var(--gradient-hero)] hover:opacity-90 glow-primary text-primary-foreground font-semibold"
        >
          <Sparkles className="size-4 mr-2" /> Instant Simulation
        </Button>
        <Button variant="outline" onClick={() => ref.current?.click()} disabled={loading} className="neon-border">
          <Upload className="size-4 mr-2" /> {loading ? "Parsing…" : "Upload CSV / XLSX"}
        </Button>
      </div>
      <input ref={ref} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />

      <div className="mt-4 grid gap-2">
        <label className="text-xs uppercase tracking-wider text-muted-foreground">Industry Case Study</label>
        <Select onValueChange={loadDemo}>
          <SelectTrigger className="bg-card/60"><SelectValue placeholder="Choose a real-world template…" /></SelectTrigger>
          <SelectContent>
            {DEMO_DATASETS.map((d) => <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {dataset && (
        <div className="mt-4 flex items-center justify-between rounded-md border border-border bg-card/50 px-3 py-2 text-xs">
          <div>
            <div className="font-mono text-foreground">{dataset.name}</div>
            <div className="text-muted-foreground">{dataset.rows.length.toLocaleString()} rows · {dataset.columns.length} cols</div>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setDataset(null)}><Trash2 className="size-3" /></Button>
        </div>
      )}
    </Panel>
  );
}