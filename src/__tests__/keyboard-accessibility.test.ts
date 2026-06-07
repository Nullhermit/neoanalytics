/**
 * Keyboard accessibility audit — static source scan that asserts the
 * intro cards expose role+tabIndex+onKeyDown, the header hamburger has
 * an aria-label, and the Pager nav uses semantic <nav aria-label>.
 * Static (no DOM) so it runs under bun without testing-library.
 */
import { test, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

test("Intro setup cards are keyboard-activatable", () => {
  const src = read("src/components/neo/Intro.tsx");
  // both option cards must have role+tabIndex+onKeyDown for Enter/Space
  const roleCount = (src.match(/role="button"/g) ?? []).length;
  const tabIdx = (src.match(/tabIndex=\{0\}/g) ?? []).length;
  const keyDown = (src.match(/onKeyDown=\{/g) ?? []).length;
  expect(roleCount).toBeGreaterThanOrEqual(2);
  expect(tabIdx).toBeGreaterThanOrEqual(2);
  expect(keyDown).toBeGreaterThanOrEqual(2);
  expect(src).toMatch(/e\.key === "Enter"/);
  expect(src).toMatch(/e\.key === " "/);
});

test("Header hamburger has accessible label and mobile-only visibility", () => {
  const src = read("src/components/neo/Header.tsx");
  expect(src).toMatch(/aria-label="Open workspace menu"/);
  expect(src).toMatch(/md:hidden/);
  // mode buttons in the sheet expose aria-current for the active mode
  expect(src).toMatch(/aria-current=\{mode === m \? "true" : undefined\}/);
});

test("Pager exposes nav landmark + per-button aria-labels", () => {
  const src = read("src/components/neo/Pager.tsx");
  expect(src).toMatch(/aria-label="Workspace pagination"/);
  expect(src).toMatch(/aria-label=\{`Previous page:/);
  expect(src).toMatch(/aria-label=\{`Next page:/);
  expect(src).toMatch(/aria-current=\{m === mode \? "page" : undefined\}/);
});

test("Intro demo buttons all carry data-testid for click regression coverage", () => {
  const src = read("src/components/neo/Intro.tsx");
  expect(src).toMatch(/data-testid=\{`demo-\$\{d\.id\}`\}/);
});