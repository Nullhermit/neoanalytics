import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { Column, Dataset, Row } from "./types";

function detectType(values: unknown[]): "numeric" | "categorical" | "date" {
  let num = 0, total = 0;
  for (const v of values) {
    if (v === null || v === undefined || v === "") continue;
    total++;
    const n = typeof v === "number" ? v : Number(String(v).replace(/[,₹$%\s]/g, ""));
    if (Number.isFinite(n)) num++;
  }
  if (total > 0 && num / total > 0.7) return "numeric";
  return "categorical";
}

function coerce(rows: Row[], cols: Column[]): Row[] {
  return rows.map((r) => {
    const out: Row = {};
    for (const c of cols) {
      const raw = r[c.name];
      if (c.type === "numeric") {
        if (raw === null || raw === undefined || raw === "") { out[c.name] = null; continue; }
        const n = typeof raw === "number" ? raw : Number(String(raw).replace(/[,₹$%\s]/g, ""));
        out[c.name] = Number.isFinite(n) ? n : null;
      } else {
        out[c.name] = raw == null ? null : String(raw);
      }
    }
    return out;
  });
}

export function buildDataset(name: string, rawRows: Record<string, unknown>[]): Dataset {
  if (rawRows.length === 0) return { name, rows: [], columns: [] };
  const colNames = Object.keys(rawRows[0]);
  const columns: Column[] = colNames.map((cn) => ({
    name: cn,
    type: detectType(rawRows.map((r) => r[cn])),
  }));
  const rows = coerce(rawRows as Row[], columns);
  return { name, rows, columns };
}

export function parseCSV(text: string, name: string): Dataset {
  const result = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });
  return buildDataset(name, result.data);
}

export async function parseFile(file: File): Promise<Dataset> {
  const name = file.name;
  if (name.toLowerCase().endsWith(".csv")) {
    const text = await file.text();
    return parseCSV(text, name);
  }
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });
  return buildDataset(name, json);
}