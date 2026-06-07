import { test, expect, describe } from "bun:test";
import { generateSkyline } from "../src/generate";
import type { PR } from "../src/generate";

const mergedPR = (number: number, linesChanged: number): PR => ({
  number,
  linesChanged,
  state: "merged",
});

const openPR = (number: number, linesChanged: number): PR => ({
  number,
  linesChanged,
  state: "open",
});

/** Extract building heights from building-rect elements only */
function buildingHeights(svg: string): number[] {
  // Match <rect class="building-rect" ... height="NNN" ...>
  return [...svg.matchAll(/class="building-rect"[^>]*height="(\d+(?:\.\d+)?)"/g)].map(
    (m) => parseFloat(m[1])
  );
}

describe("generateSkyline", () => {
  test("output is valid SVG: starts with <svg and ends with </svg>", () => {
    const svg = generateSkyline([mergedPR(1, 100)], "test-repo");
    expect(svg.trimStart().startsWith("<svg")).toBe(true);
    expect(svg.trimEnd().endsWith("</svg>")).toBe(true);
  });

  test("correct number of building columns for a given PR list", () => {
    const prs: PR[] = [mergedPR(1, 100), mergedPR(2, 200), openPR(3, 50)];
    const svg = generateSkyline(prs, "my-repo");
    // Each PR gets one <g class="building"> group
    const matches = svg.match(/class="building"/g);
    expect(matches?.length).toBe(3);
  });

  test("single PR produces exactly one building", () => {
    const svg = generateSkyline([mergedPR(42, 500)], "solo-repo");
    const matches = svg.match(/class="building"/g);
    expect(matches?.length).toBe(1);
  });

  test("empty PR list produces valid SVG with no buildings", () => {
    const svg = generateSkyline([], "empty-repo");
    expect(svg.trimStart().startsWith("<svg")).toBe(true);
    expect(svg.trimEnd().endsWith("</svg>")).toBe(true);
    expect(svg.match(/class="building"/g)).toBeNull();
  });

  test("height is clamped to min 40px", () => {
    // Very small linesChanged relative to max → should still be at least 40
    const prs: PR[] = [mergedPR(1, 1000), mergedPR(2, 1)]; // PR2 is tiny
    const svg = generateSkyline(prs, "clamp-min-repo");
    const heights = buildingHeights(svg);
    expect(heights.length).toBe(2);
    expect(heights.every((h) => h >= 40)).toBe(true);
  });

  test("height is clamped to max 400px", () => {
    const prs: PR[] = [mergedPR(1, 99999)];
    const svg = generateSkyline(prs, "clamp-max-repo");
    const heights = buildingHeights(svg);
    expect(heights.every((h) => h <= 400)).toBe(true);
  });

  test("merged PRs use purple fill (#8A2BE2)", () => {
    const svg = generateSkyline([mergedPR(1, 100)], "purple-repo");
    expect(svg).toContain("#8A2BE2");
  });

  test("open PRs use orange stroke (#FF6B35) and have stroke-dasharray", () => {
    const svg = generateSkyline([openPR(1, 100)], "scaffold-repo");
    expect(svg).toContain("#FF6B35");
    expect(svg).toContain("stroke-dasharray");
  });

  test("open PRs have no fill (fill=none)", () => {
    const svg = generateSkyline([openPR(5, 200)], "no-fill-repo");
    expect(svg).toContain('fill="none"');
  });

  test("merged PRs have no stroke-dasharray", () => {
    const svg = generateSkyline([mergedPR(1, 100)], "solid-repo");
    // Should not have dasharray — it's a solid building
    expect(svg).not.toContain("stroke-dasharray");
  });

  test("repo name appears in the SVG label", () => {
    const svg = generateSkyline([mergedPR(1, 100)], "my-cool-project");
    expect(svg).toContain("my-cool-project");
  });

  test("SVG contains embedded <style> block with @keyframes rise animation", () => {
    const svg = generateSkyline([mergedPR(1, 100)], "anim-repo");
    expect(svg).toContain("<style>");
    expect(svg).toContain("@keyframes rise");
    expect(svg).toContain("ease-out");
  });

  test("buildings have animation-delay staggered by index", () => {
    const prs: PR[] = [mergedPR(1, 100), mergedPR(2, 200), mergedPR(3, 300)];
    const svg = generateSkyline(prs, "stagger-repo");
    // Expect delay values: 0ms, 50ms, 100ms
    expect(svg).toContain("0ms");
    expect(svg).toContain("50ms");
    expect(svg).toContain("100ms");
  });

  test("ground strip is present at y=660 with height=10", () => {
    const svg = generateSkyline([mergedPR(1, 100)], "ground-repo");
    expect(svg).toContain('y="660"');
    // The ground rect should have fill #1a1a2e
    expect(svg).toContain("#1a1a2e");
  });

  test("windows are present for merged PRs (deterministic based on PR number)", () => {
    const svg = generateSkyline([mergedPR(7, 300)], "window-repo");
    // PR 7: rows = (7*7)%3+1 = 49%3+1 = 1+1 = 2, cols = (7*13)%4+2 = 91%4+2 = 3+2 = 5
    // So 2*5 = 10 windows expected
    const windowMatches = svg.match(/class="window"/g);
    expect(windowMatches?.length).toBe(10);
  });

  test("open PRs have no windows", () => {
    const svg = generateSkyline([openPR(7, 300)], "scaffold-no-windows");
    const windowMatches = svg.match(/class="window"/g);
    expect(windowMatches).toBeNull();
  });
});
