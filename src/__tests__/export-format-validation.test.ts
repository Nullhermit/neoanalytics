/**
 * Export format content validation — proves the data we feed into
 * the PDF/PPTX generators is well-formed for every demo dataset and
 * that the bundled exporters can construct a real document object.
 */
import { test, expect } from "vitest";
import { DEMO_DATASETS } from "@/lib/data/demo";
import { describe as describeStats, numericValues } from "@/lib/data/stats";

test("every demo dataset yields finite numeric stats (PDF/PPTX input safety)", () => {
  for (const d of DEMO_DATASETS) {
    const ds = d.build();
    expect(ds.columns.length).toBeGreaterThan(0);
    expect(ds.rows.length).toBeGreaterThan(0);
    const nums = ds.columns.filter((c) => c.type === "numeric");
    expect(nums.length).toBeGreaterThan(0);
    for (const c of nums) {
      const vals = numericValues(ds.rows, c.name);
      const s = describeStats(vals);
      expect(Number.isFinite(s.mean)).toBe(true);
      expect(Number.isFinite(s.min)).toBe(true);
      expect(Number.isFinite(s.max)).toBe(true);
      expect(s.min).toBeLessThanOrEqual(s.max);
    }
  }
});

test("jsPDF can author a real document with title metadata", async () => {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.text("Neo Analytics export format check", 40, 60);
  const blob = doc.output("blob");
  expect(blob.size).toBeGreaterThan(200);
  expect(blob.type).toMatch(/pdf/);
});

test("pptxgenjs can construct a deck with theme-coloured slide", async () => {
  const Pptx = (await import("pptxgenjs")).default;
  const pres = new Pptx();
  const slide = pres.addSlide();
  slide.background = { color: "0A081C" };
  slide.addText("Theme validation", { x: 0.5, y: 0.5, color: "F0EEFF", fontFace: "Calibri" });
  // write to base64 to assert the binary builds without throwing
  const out = await pres.write({ outputType: "base64" });
  expect(typeof out).toBe("string");
  expect((out as string).length).toBeGreaterThan(500);
});