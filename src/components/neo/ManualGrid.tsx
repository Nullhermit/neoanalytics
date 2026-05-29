import { useState } from "react";
import { Panel } from "./Panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDataset } from "@/lib/dataset-store";
import { buildDataset } from "@/lib/data/parse";
import { Plus, Save } from "lucide-react";
import { toast } from "sonner";

export function ManualGrid() {
  const { setDataset } = useDataset();
  const [cols, setCols] = useState<string[]>(["x", "y"]);
  const [rows, setRows] = useState<string[][]>(Array.from({ length: 5 }, () => ["", ""]));

  const addCol = () => { setCols([...cols, `col${cols.length + 1}`]); setRows(rows.map((r) => [...r, ""])); };
  const addRow = () => setRows([...rows, cols.map(() => "")]);

  const commit = () => {
    const data = rows
      .filter((r) => r.some((v) => v.trim() !== ""))
      .map((r) => Object.fromEntries(cols.map((c, i) => [c, r[i] === "" ? null : r[i]])));
    if (data.length === 0) { toast.error("Add at least one row"); return; }
    const ds = buildDataset("manual_entry.csv", data);
    setDataset(ds);
    toast.success(`Loaded manual dataset (${data.length} rows)`);
  };

  return (
    <Panel title="Manual Grid Editor" subtitle="Type small homework problems directly">
      <div className="overflow-auto scrollbar-thin max-h-[260px] rounded border border-border">
        <table className="w-full text-xs">
          <thead className="bg-card/60 sticky top-0">
            <tr>{cols.map((c, i) => (
              <th key={i} className="p-1">
                <Input value={c} onChange={(e) => { const n = [...cols]; n[i] = e.target.value; setCols(n); }} className="h-7 bg-background/60 font-mono text-xs" />
              </th>
            ))}</tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={ri}>
                {r.map((v, ci) => (
                  <td key={ci} className="p-1">
                    <Input value={v} onChange={(e) => { const n = rows.map((rr) => [...rr]); n[ri][ci] = e.target.value; setRows(n); }} className="h-7 bg-background/40 font-mono text-xs" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex gap-2">
        <Button size="sm" variant="outline" onClick={addCol}><Plus className="size-3 mr-1" /> Column</Button>
        <Button size="sm" variant="outline" onClick={addRow}><Plus className="size-3 mr-1" /> Row</Button>
        <Button size="sm" onClick={commit} className="bg-[image:var(--gradient-hero)] text-primary-foreground ml-auto">
          <Save className="size-3 mr-1" /> Load as Dataset
        </Button>
      </div>
    </Panel>
  );
}