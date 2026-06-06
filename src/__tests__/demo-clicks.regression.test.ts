/**
 * Regression: every demo dataset id wired into Intro/IntroGalaxy click handlers
 * must resolve to a real dataset builder and produce a non-empty dataset.
 *
 * Run with:   bun test src/__tests__/demo-clicks.regression.test.ts
 */
import { test, expect } from "bun:test";
import { DEMO_DATASETS } from "@/lib/data/demo";

// click ids fired by Intro setup card "Run System Example Simulation" and per-button onDemo calls
const CLICK_TARGETS = ["sales", ...DEMO_DATASETS.map((d) => d.id)];

test("every clickable demo id resolves to a builder", () => {
  for (const id of CLICK_TARGETS) {
    const found = DEMO_DATASETS.find((d) => d.id === id);
    expect(found, `missing demo for click id "${id}"`).toBeDefined();
  }
});

test("each demo builder produces a non-empty dataset", () => {
  for (const d of DEMO_DATASETS) {
    const ds = d.build();
    expect(ds.rows.length, `${d.id} rows`).toBeGreaterThan(0);
    expect(ds.columns.length, `${d.id} columns`).toBeGreaterThan(0);
    // every column referenced in a row
    for (const c of ds.columns) {
      expect(ds.rows[0]).toHaveProperty(c.name);
    }
  }
});

test("demo labels are unique (UI regression)", () => {
  const labels = DEMO_DATASETS.map((d) => d.label);
  expect(new Set(labels).size).toBe(labels.length);
});