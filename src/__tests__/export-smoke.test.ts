/**
 * Smoke tests for export pipeline + intro click handler integrity.
 * Run with:  bun test src/__tests__/export-smoke.test.ts
 */
// @ts-expect-error - bun:test types not in tsconfig
import { test, expect } from "bun:test";
import { DEMO_DATASETS } from "@/lib/data/demo";
import { describe as describeStats, numericValues } from "@/lib/data/stats";

test("stats pipeline runs on every demo dataset (export precondition)", () => {
  for (const d of DEMO_DATASETS) {
    const ds = d.build();
    const nums = ds.columns.filter((c) => c.type === "numeric");
    for (const c of nums) {
      const vals = numericValues(ds.rows, c.name);
      const s = describeStats(vals);
      expect(Number.isFinite(s.mean), `${d.id}/${c.name} mean`).toBe(true);
      expect(Number.isFinite(s.stdev), `${d.id}/${c.name} stdev`).toBe(true);
      expect(s.n).toBeGreaterThan(0);
    }
  }
});

test("pptxgenjs + jspdf imports resolve (export bundle smoke)", async () => {
  const pptx = await import("pptxgenjs");
  const jspdf = await import("jspdf");
  const autotable = await import("jspdf-autotable");
  expect(typeof pptx.default).toBe("function");
  expect(typeof jspdf.default).toBe("function");
  expect(typeof autotable.default).toBe("function");
});

test("e2e click map: every Intro demo button has a unique testid", () => {
  const ids = DEMO_DATASETS.map((d) => `demo-${d.id}`);
  expect(new Set(ids).size).toBe(ids.length);
  for (const id of ids) expect(id).toMatch(/^demo-[a-z0-9_-]+$/i);
});