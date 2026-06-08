import { test, expect } from "bun:test";
import { renderMultiSkyline } from "./multi-skyline.js";

// ── helpers ───────────────────────────────────────────────────────────────────

/** Minimal stub of a single-skyline SVG (1400 × 700 like the real renderer) */
function stubSvg(label: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="700" viewBox="0 0 1400 700"><rect width="1400" height="700" fill="#0b0d10"/><text>${label}</text></svg>`;
}

// ── empty input ───────────────────────────────────────────────────────────────

test("renderMultiSkyline([]) returns valid empty SVG", () => {
  const result = renderMultiSkyline([]);
  expect(result).toContain("<svg");
  expect(result).toContain("</svg>");
  const openTags = (result.match(/<svg\b/g) ?? []).length;
  const closeTags = (result.match(/<\/svg>/g) ?? []).length;
  expect(openTags).toBe(1);
  expect(closeTags).toBe(1);
});

test("renderMultiSkyline([]) has non-negative dimensions", () => {
  const result = renderMultiSkyline([]);
  const heightMatch = result.match(/height="(\d+)"/);
  expect(heightMatch).not.toBeNull();
  expect(parseInt(heightMatch![1], 10)).toBeGreaterThanOrEqual(0);
});

// ── single entry ──────────────────────────────────────────────────────────────

test("renderMultiSkyline with one entry contains the repo label", () => {
  const result = renderMultiSkyline([{ repo: "a/b", svg: stubSvg("a/b") }]);
  expect(result).toContain("a/b");
});

test("renderMultiSkyline with one entry contains the skyline SVG content", () => {
  const inner = stubSvg("a/b");
  const result = renderMultiSkyline([{ repo: "a/b", svg: inner }]);
  expect(result).toContain("#0b0d10");
});

test("renderMultiSkyline with one entry is a single valid SVG root", () => {
  const result = renderMultiSkyline([{ repo: "a/b", svg: stubSvg("a/b") }]);
  const openCount = (result.match(/<svg\b/g) ?? []).length;
  expect(openCount).toBe(1);
  const closeCount = (result.match(/<\/svg>/g) ?? []).length;
  expect(closeCount).toBe(1);
});

// ── two entries — height stacking ─────────────────────────────────────────────

const SKYLINE_H = 700;
const LABEL_H = 24;
const PADDING = 16;

test("renderMultiSkyline with two entries has combined height >= sum of skyline heights", () => {
  const entries = [
    { repo: "x/one", svg: stubSvg("x/one") },
    { repo: "x/two", svg: stubSvg("x/two") },
  ];
  const result = renderMultiSkyline(entries);
  const heightMatch = result.match(/<svg[^>]+height="(\d+(?:\.\d+)?)"/);
  expect(heightMatch).not.toBeNull();
  const totalHeight = parseFloat(heightMatch![1]);
  expect(totalHeight).toBeGreaterThanOrEqual(2 * SKYLINE_H);
});

test("renderMultiSkyline with two entries has height equal to (label+skyline)x2 + padding", () => {
  const entries = [
    { repo: "x/one", svg: stubSvg("x/one") },
    { repo: "x/two", svg: stubSvg("x/two") },
  ];
  const result = renderMultiSkyline(entries);
  const heightMatch = result.match(/<svg[^>]+height="(\d+(?:\.\d+)?)"/);
  expect(heightMatch).not.toBeNull();
  const totalHeight = parseFloat(heightMatch![1]);
  const expectedHeight = 2 * (LABEL_H + SKYLINE_H) + (2 - 1) * PADDING + PADDING * 2;
  expect(totalHeight).toBe(expectedHeight);
});

test("renderMultiSkyline with two entries contains both repo labels", () => {
  const entries = [
    { repo: "x/one", svg: stubSvg("x/one") },
    { repo: "x/two", svg: stubSvg("x/two") },
  ];
  const result = renderMultiSkyline(entries);
  expect(result).toContain("x/one");
  expect(result).toContain("x/two");
});

test("renderMultiSkyline with two entries is still a single SVG root", () => {
  const entries = [
    { repo: "x/one", svg: stubSvg("x/one") },
    { repo: "x/two", svg: stubSvg("x/two") },
  ];
  const result = renderMultiSkyline(entries);
  const openCount = (result.match(/<svg\b/g) ?? []).length;
  expect(openCount).toBe(1);
});
