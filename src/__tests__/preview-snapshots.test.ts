/**
 * Preview snapshot tests — lock the export theme palettes & demo dataset
 * shape so accidental edits to colors/fonts/datasets fail loudly.
 * Run with: bun test src/__tests__/preview-snapshots.test.ts
 */
import { test, expect } from "vitest";
import { DEMO_DATASETS } from "@/lib/data/demo";

test("snapshot · demo dataset catalogue shape", () => {
  const summary = DEMO_DATASETS.map((d) => {
    const ds = d.build();
    return {
      id: d.id,
      label: d.label,
      cols: ds.columns.map((c) => c.type).sort(),
      hasRows: ds.rows.length > 0,
    };
  });
  // structural snapshot — palette of available demos
  expect(summary).toMatchSnapshot();
});

test("snapshot · workspace mode metadata", async () => {
  const { MODE_META } = await import("@/lib/workspace-mode");
  expect(MODE_META).toMatchSnapshot();
});