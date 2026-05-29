import { useMemo, useState } from "react";
import { Panel } from "./Panel";
import { useDataset } from "@/lib/dataset-store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CodeBlock } from "./CodeBlock";

const OPS = [
  { id: "select_all", label: "SELECT all rows" },
  { id: "agg_sum", label: "SUM by category" },
  { id: "agg_avg", label: "AVG by category" },
  { id: "top10", label: "TOP 10 by metric" },
  { id: "filter", label: "Filter where metric > threshold" },
];

export function SqlPanel() {
  const { dataset } = useDataset();
  const [op, setOp] = useState("agg_sum");
  const [cat, setCat] = useState("");
  const [metric, setMetric] = useState("");

  const cats = dataset?.columns.filter((c) => c.type !== "numeric") ?? [];
  const nums = dataset?.columns.filter((c) => c.type === "numeric") ?? [];
  const c = cat || cats[0]?.name || "category";
  const m = metric || nums[0]?.name || "metric";
  const tbl = dataset ? dataset.name.replace(/\.[^.]+$/, "").replace(/\W+/g, "_") : "your_table";

  const sql = useMemo(() => {
    switch (op) {
      case "select_all": return `SELECT *\nFROM ${tbl}\nLIMIT 100;`;
      case "agg_sum": return `SELECT "${c}",\n       SUM("${m}") AS total_${m}\nFROM ${tbl}\nGROUP BY "${c}"\nORDER BY total_${m} DESC;`;
      case "agg_avg": return `SELECT "${c}",\n       AVG("${m}") AS avg_${m},\n       COUNT(*) AS n\nFROM ${tbl}\nGROUP BY "${c}";`;
      case "top10": return `SELECT *\nFROM ${tbl}\nORDER BY "${m}" DESC\nLIMIT 10;`;
      case "filter": return `SELECT *\nFROM ${tbl}\nWHERE "${m}" > (SELECT AVG("${m}") FROM ${tbl});`;
    }
    return "";
  }, [op, c, m, tbl]);

  return (
    <Panel title="SQL Query Generator" subtitle="Production-ready, copy-pasteable">
      <div className="grid gap-2 sm:grid-cols-3 mb-3">
        <Select value={op} onValueChange={setOp}>
          <SelectTrigger className="bg-card/60"><SelectValue /></SelectTrigger>
          <SelectContent>{OPS.map((o) => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={c} onValueChange={setCat}>
          <SelectTrigger className="bg-card/60"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>{(cats.length ? cats : nums).map((x) => <SelectItem key={x.name} value={x.name}>{x.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={m} onValueChange={setMetric}>
          <SelectTrigger className="bg-card/60"><SelectValue placeholder="Metric" /></SelectTrigger>
          <SelectContent>{nums.map((x) => <SelectItem key={x.name} value={x.name}>{x.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <CodeBlock language="sql" code={sql} />
    </Panel>
  );
}