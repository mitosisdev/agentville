// tests/skyline.test.ts
import { describe, it, expect } from "bun:test";
import { generateSkyline } from "../src/skyline";
import type { PR } from "../src/skyline";

// Helpers
function countMatches(str: string, pattern: RegExp): number {
  return (str.match(pattern) ?? []).length;
}

const mergedPRs: PR[] = [
  { number: 1, title: "Add auth", state: "merged", linesChanged: 200, mergedAt: "2024-01-01T00:00:00Z" },
  { number: 2, title: "Fix bug", state: "merged", linesChanged: 50, mergedAt: "2024-01-02T00:00:00Z" },
  { number: 3, title: "Add tests", state: "merged", linesChanged: 800, mergedAt: "2024-01-03T00:00:00Z" },
  { number: 4, title: "Refactor", state: "merged", linesChanged: 10, mergedAt: "2024-01-04T00:00:00Z" },
  { number: 5, title: "Deploy", state: "merged", linesChanged: 150, mergedAt: "2024-01-05T00:00:00Z" },
];

const openPRs: PR[] = [
  { number: 6, title: "New feature", state: "open", linesChanged: 300 },
  { number: 7, title: "Another feature", state: "open", linesChanged: 100 },
];

describe("generateSkyline", () => {
  it("returns a string starting with <svg", () => {
    const svg = generateSkyline([]);
    expect(svg.trimStart()).toMatch(/^<svg/);
  });

  it("SVG has 1400x700 dimensions", () => {
    const svg = generateSkyline([]);
    expect(svg).toContain('width="1400"');
    expect(svg).toContain('height="700"');
  });

  it("SVG has dark background #0b0d10", () => {
    const svg = generateSkyline([]);
    expect(svg).toContain("#0b0d10");
  });

  it("with 5 merged PRs, output contains exactly 5 purple building rects", () => {
    const svg = generateSkyline(mergedPRs);
    // Count rect elements with fill="#8A2BE2"
    const purpleRects = countMatches(svg, /fill="#8A2BE2"/g);
    expect(purpleRects).toBe(5);
  });

  it("with 2 open PRs, output contains 2 dashed-outline elements with stroke #FF6B35", () => {
    const svg = generateSkyline(openPRs);
    const orangeOutlines = countMatches(svg, /stroke="#FF6B35"/g);
    expect(orangeOutlines).toBe(2);
  });

  it("open PR rects have no fill (fill=none)", () => {
    const svg = generateSkyline(openPRs);
    expect(svg).toContain('fill="none"');
  });

  it("open PR rects have stroke-dasharray", () => {
    const svg = generateSkyline(openPRs);
    expect(svg).toContain("stroke-dasharray");
  });

  it("building height is proportional to linesChanged, clamped to min 40 max 400", () => {
    // PR with 10 lines → min height 40
    const smallPR: PR[] = [{ number: 1, title: "tiny", state: "merged", linesChanged: 1, mergedAt: "2024-01-01T00:00:00Z" }];
    const svgSmall = generateSkyline(smallPR);
    expect(svgSmall).toContain('height="40"');

    // PR with huge lines → max height 400
    const hugePR: PR[] = [{ number: 2, title: "huge", state: "merged", linesChanged: 999999, mergedAt: "2024-01-01T00:00:00Z" }];
    const svgHuge = generateSkyline(hugePR);
    expect(svgHuge).toContain('height="400"');
  });

  it("column width is 20px", () => {
    const svg = generateSkyline(mergedPRs);
    expect(svg).toContain('width="20"');
  });

  it("output contains @keyframes rise animation", () => {
    const svg = generateSkyline(mergedPRs);
    expect(svg).toContain("@keyframes rise");
  });

  it("each building has a staggered animation delay", () => {
    const svg = generateSkyline(mergedPRs);
    // 5 buildings → delays 0ms, 50ms, 100ms, 150ms, 200ms
    expect(svg).toContain("0ms");
    expect(svg).toContain("50ms");
    expect(svg).toContain("100ms");
  });

  it("output contains ground rect at y=660 with color #1a1a2e", () => {
    const svg = generateSkyline([]);
    expect(svg).toContain('y="660"');
    expect(svg).toContain("#1a1a2e");
  });

  it("output contains ground rect height 10", () => {
    const svg = generateSkyline([]);
    // The ground strip height=10
    expect(svg).toMatch(/y="660"[^/]*height="10"/s);
  });

  it("output contains repo name label in Courier New", () => {
    const svg = generateSkyline([], "my-repo");
    expect(svg).toContain("my-repo");
    expect(svg).toContain("Courier New");
  });

  it("mixed PRs: merged get purple, open get orange", () => {
    const mixed: PR[] = [
      { number: 1, title: "merged", state: "merged", linesChanged: 100, mergedAt: "2024-01-01T00:00:00Z" },
      { number: 2, title: "open", state: "open", linesChanged: 100 },
    ];
    const svg = generateSkyline(mixed);
    expect(svg).toContain("#8A2BE2");
    expect(svg).toContain("#FF6B35");
  });

  it("windows (white dots) appear on merged buildings", () => {
    const svg = generateSkyline(mergedPRs);
    expect(svg).toContain("#ffffff");
  });

  it("buildings are positioned using 20px column width and 4px gap", () => {
    // Second building x = 1 * (20 + 4) = 24
    const twoMerged: PR[] = [
      { number: 1, title: "first", state: "merged", linesChanged: 100, mergedAt: "2024-01-01T00:00:00Z" },
      { number: 2, title: "second", state: "merged", linesChanged: 100, mergedAt: "2024-01-02T00:00:00Z" },
    ];
    const svg = generateSkyline(twoMerged);
    // x="0" for first, x="24" for second
    expect(svg).toContain('x="0"');
    expect(svg).toContain('x="24"');
  });

  it("SVG is self-contained with embedded styles", () => {
    const svg = generateSkyline(mergedPRs);
    expect(svg).toContain("<style>");
    expect(svg).toContain("</style>");
  });

  it("SVG closes properly", () => {
    const svg = generateSkyline(mergedPRs);
    expect(svg.trimEnd()).toMatch(/<\/svg>$/);
  });
});
