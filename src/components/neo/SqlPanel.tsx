import { useMemo, useState } from "react";
import { Panel } from "./Panel";
import { useDataset } from "@/lib/dataset-store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CodeBlock } from "./CodeBlock";

const OPS = [
  { id: "select_all",  label: "SELECT all rows" },
  { id: "count",       label: "COUNT total rows" },
  { id: "distinct",    label: "DISTINCT categories" },
  { id: "agg_sum",     label: "SUM by category" },
  { id: "agg_avg",     label: "AVG by category" },
  { id: "agg_full",    label: "SUM / AVG / MIN / MAX by category" },
  { id: "top10",       label: "TOP 10 by metric" },
  { id: "bottom10",    label: "BOTTOM 10 by metric" },
  { id: "filter",      label: "Filter where metric > AVG" },
  { id: "percentile",  label: "Percentile / quartile buckets (NTILE)" },
  { id: "rank",        label: "RANK within category" },
  { id: "running",     label: "Running total (window SUM)" },
  { id: "moving_avg",  label: "7-row moving average" },
  { id: "pct_change",  label: "Period-over-period % change" },
  { id: "pivot",       label: "Pivot category → columns (CASE)" },
  { id: "cte",         label: "CTE: top category share of total" },
  { id: "having",      label: "GROUP BY + HAVING outliers" },
  { id: "join",        label: "Self-join (cohort comparison)" },
  { id: "upsert",      label: "Upsert (INSERT … ON CONFLICT)" },
  { id: "create_view", label: "CREATE MATERIALIZED VIEW" },
  { id: "create_idx",  label: "CREATE INDEX for fast lookups" },
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
      case "count": return `SELECT COUNT(*) AS total_rows,\n       COUNT(DISTINCT "${c}") AS unique_${c}\nFROM ${tbl};`;
      case "distinct": return `SELECT DISTINCT "${c}"\nFROM ${tbl}\nORDER BY "${c}";`;
      case "agg_sum": return `SELECT "${c}",\n       SUM("${m}") AS total_${m}\nFROM ${tbl}\nGROUP BY "${c}"\nORDER BY total_${m} DESC;`;
      case "agg_avg": return `SELECT "${c}",\n       AVG("${m}") AS avg_${m},\n       COUNT(*) AS n\nFROM ${tbl}\nGROUP BY "${c}";`;
      case "agg_full": return `SELECT "${c}",\n       SUM("${m}")  AS total_${m},\n       AVG("${m}")  AS avg_${m},\n       MIN("${m}")  AS min_${m},\n       MAX("${m}")  AS max_${m},\n       STDDEV("${m}") AS stddev_${m},\n       COUNT(*)      AS n\nFROM ${tbl}\nGROUP BY "${c}"\nORDER BY total_${m} DESC;`;
      case "top10": return `SELECT *\nFROM ${tbl}\nORDER BY "${m}" DESC\nLIMIT 10;`;
      case "bottom10": return `SELECT *\nFROM ${tbl}\nORDER BY "${m}" ASC\nLIMIT 10;`;
      case "filter": return `SELECT *\nFROM ${tbl}\nWHERE "${m}" > (SELECT AVG("${m}") FROM ${tbl});`;
      case "percentile": return `SELECT "${c}", "${m}",\n       NTILE(4) OVER (ORDER BY "${m}") AS quartile,\n       PERCENT_RANK() OVER (ORDER BY "${m}") AS pct_rank\nFROM ${tbl};`;
      case "rank": return `SELECT "${c}", "${m}",\n       RANK()       OVER (PARTITION BY "${c}" ORDER BY "${m}" DESC) AS rank_in_cat,\n       DENSE_RANK() OVER (PARTITION BY "${c}" ORDER BY "${m}" DESC) AS dense_rank\nFROM ${tbl};`;
      case "running": return `SELECT "${c}", "${m}",\n       SUM("${m}") OVER (PARTITION BY "${c}" ORDER BY "${m}"\n                         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total\nFROM ${tbl};`;
      case "moving_avg": return `SELECT "${c}", "${m}",\n       AVG("${m}") OVER (ORDER BY "${m}"\n                         ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS moving_avg_7\nFROM ${tbl};`;
      case "pct_change": return `SELECT "${c}", "${m}",\n       LAG("${m}") OVER (ORDER BY "${c}") AS prev_${m},\n       ROUND(100.0 * ("${m}" - LAG("${m}") OVER (ORDER BY "${c}"))\n             / NULLIF(LAG("${m}") OVER (ORDER BY "${c}"), 0), 2) AS pct_change\nFROM ${tbl};`;
      case "pivot": return `SELECT\n  SUM(CASE WHEN "${c}" = 'A' THEN "${m}" ELSE 0 END) AS "${m}_A",\n  SUM(CASE WHEN "${c}" = 'B' THEN "${m}" ELSE 0 END) AS "${m}_B",\n  SUM(CASE WHEN "${c}" = 'C' THEN "${m}" ELSE 0 END) AS "${m}_C"\nFROM ${tbl};`;
      case "cte": return `WITH category_totals AS (\n  SELECT "${c}", SUM("${m}") AS total_${m}\n  FROM ${tbl}\n  GROUP BY "${c}"\n),\ngrand AS (\n  SELECT SUM(total_${m}) AS grand_total FROM category_totals\n)\nSELECT ct."${c}",\n       ct.total_${m},\n       ROUND(100.0 * ct.total_${m} / g.grand_total, 2) AS pct_of_total\nFROM category_totals ct CROSS JOIN grand g\nORDER BY ct.total_${m} DESC;`;
      case "having": return `SELECT "${c}",\n       AVG("${m}") AS avg_${m},\n       COUNT(*)    AS n\nFROM ${tbl}\nGROUP BY "${c}"\nHAVING AVG("${m}") > (SELECT AVG("${m}") FROM ${tbl}) * 1.5\n    OR COUNT(*) < 5;`;
      case "join": return `SELECT a."${c}" AS cat_a,\n       b."${c}" AS cat_b,\n       SUM(a."${m}") AS total_a,\n       SUM(b."${m}") AS total_b\nFROM ${tbl} a\nJOIN ${tbl} b ON a."${c}" < b."${c}"\nGROUP BY a."${c}", b."${c}";`;
      case "upsert": return `INSERT INTO ${tbl} ("${c}", "${m}")\nVALUES ('new_value', 100)\nON CONFLICT ("${c}")\nDO UPDATE SET "${m}" = EXCLUDED."${m}",\n              updated_at = NOW();`;
      case "create_view": return `CREATE MATERIALIZED VIEW ${tbl}_summary AS\nSELECT "${c}",\n       SUM("${m}") AS total_${m},\n       AVG("${m}") AS avg_${m}\nFROM ${tbl}\nGROUP BY "${c}"\nWITH DATA;\n\n-- Refresh: REFRESH MATERIALIZED VIEW CONCURRENTLY ${tbl}_summary;`;
      case "create_idx": return `CREATE INDEX IF NOT EXISTS idx_${tbl}_${c} ON ${tbl} ("${c}");\nCREATE INDEX IF NOT EXISTS idx_${tbl}_${m} ON ${tbl} ("${m}" DESC);\n\n-- Composite for filtered aggregates:\nCREATE INDEX IF NOT EXISTS idx_${tbl}_${c}_${m} ON ${tbl} ("${c}", "${m}" DESC);`;
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