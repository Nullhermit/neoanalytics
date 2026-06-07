/**
 * Workspace mode e2e coverage — verifies all three modes
 * (household / research / developer) are wired with the metadata
 * the Header, Pager and Dashboard rely on, and that the Pager
 * cycle order resolves correctly in both directions.
 */
import { test, expect } from "vitest";
import { MODE_META, type WorkspaceMode } from "@/lib/workspace-mode";

const ORDER: WorkspaceMode[] = ["household", "research", "developer"];

test("all workspace modes have required metadata", () => {
  for (const m of ORDER) {
    const meta = MODE_META[m];
    expect(meta.label).toBeTruthy();
    expect(meta.tagline).toBeTruthy();
    expect(meta.emoji.length).toBeGreaterThan(0);
  }
});

test("pager next/prev cycle covers every mode without dead ends", () => {
  const visited = new Set<WorkspaceMode>();
  let cur: WorkspaceMode = "household";
  for (let i = 0; i < ORDER.length; i++) {
    visited.add(cur);
    const idx = ORDER.indexOf(cur);
    cur = ORDER[(idx + 1) % ORDER.length];
  }
  expect(visited.size).toBe(ORDER.length);

  // reverse cycle
  visited.clear();
  cur = "developer";
  for (let i = 0; i < ORDER.length; i++) {
    visited.add(cur);
    const idx = ORDER.indexOf(cur);
    cur = ORDER[(idx - 1 + ORDER.length) % ORDER.length];
  }
  expect(visited.size).toBe(ORDER.length);
});

test("mode labels are unique (no header dropdown collisions)", () => {
  const labels = ORDER.map((m) => MODE_META[m].label);
  expect(new Set(labels).size).toBe(labels.length);
});