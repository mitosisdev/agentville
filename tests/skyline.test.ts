import { test, expect } from "bun:test";
import { generateSkyline } from "../src/skyline";
import type { PullRequest } from "../src/types";

const samplePRs: PullRequest[] = [
  { number: 1, title: "Init repo", state: "merged", linesChanged: 50, mergedAt: "2024-01-01" },
  { number: 2, title: "Add feature", state: "merged", linesChanged: 200, mergedAt: "2024-01-02" },
  { number: 3, title: "WIP feature", state: "open", linesChanged: 30 },
];

test("SVG string wraps in <svg> tags", () => {
  const svg = generateSkyline(samplePRs, "test/repo");
  expect(svg).toContain("<svg");
  expect(svg).toContain("</svg>");
});

test("output has correct column count (one per PR)", () => {
  const svg = generateSkyline(samplePRs, "test/repo");
  // Each building gets a unique g.building-N class
  const buildingMatches = [...svg.matchAll(/class="building-\d+"/g)];
  expect(buildingMatches.length).toBe(samplePRs.length);
});

test("building height is within [40, 400] range", () => {
  // Extract all rect height attributes — look for height="NNN" on building rects
  const prs: PullRequest[] = [
    { number: 1, title: "tiny", state: "merged", linesChanged: 1 },
    { number: 2, title: "massive", state: "merged", linesChanged: 9999 },
  ];
  const svg = generateSkyline(prs, "test/repo");
  // Find height values from building rect elements (they have a data-h attribute)
  const heightMatches = [...svg.matchAll(/data-h="(\d+(?:\.\d+)?)"/g)];
  expect(heightMatches.length).toBeGreaterThan(0);
  for (const m of heightMatches) {
    const h = parseFloat(m[1]);
    expect(h).toBeGreaterThanOrEqual(40);
    expect(h).toBeLessThanOrEqual(400);
  }
});

test("merged PR gets purple color #8A2BE2", () => {
  const prs: PullRequest[] = [
    { number: 1, title: "merged", state: "merged", linesChanged: 100, mergedAt: "2024-01-01" },
  ];
  const svg = generateSkyline(prs, "test/repo");
  expect(svg.toLowerCase()).toContain("#8a2be2");
});

test("open PR gets orange scaffolding color #FF6B35", () => {
  const prs: PullRequest[] = [
    { number: 1, title: "open", state: "open", linesChanged: 100 },
  ];
  const svg = generateSkyline(prs, "test/repo");
  expect(svg.toLowerCase()).toContain("#ff6b35");
});

test("canvas is 1400x700", () => {
  const svg = generateSkyline(samplePRs, "test/repo");
  expect(svg).toContain('width="1400"');
  expect(svg).toContain('height="700"');
});

test("repo name label is present in SVG", () => {
  const svg = generateSkyline(samplePRs, "mitosisdev/agentville");
  expect(svg).toContain("mitosisdev/agentville");
});

test("empty PR list still produces valid SVG", () => {
  const svg = generateSkyline([], "empty/repo");
  expect(svg).toContain("<svg");
  expect(svg).toContain("</svg>");
});
