import { describe, it, expect } from "bun:test";
import { generateSkyline } from "./agentville";
import type { PR } from "./agentville";

// Helper: extract all building rect elements from SVG
function getBuildings(svg: string): string[] {
  // Match rect elements that have class="building" or data-pr attribute
  const matches = svg.match(/<rect[^>]+class="building"[^>]*\/?>/g) || [];
  return matches;
}

// Helper: extract all building groups
function getBuildingGroups(svg: string): string[] {
  const matches = svg.match(/<g[^>]+class="building[^"]*"[^>]*>/g) || [];
  return matches;
}

const sampleMergedPR: PR = {
  number: 1,
  linesChanged: 100,
  merged: true,
  repoName: "mitosisdev/agentville",
};

const sampleOpenPR: PR = {
  number: 2,
  linesChanged: 50,
  merged: false,
  repoName: "mitosisdev/agentville",
};

describe("columnCount", () => {
  it("SVG contains exactly N building columns for N PRs", () => {
    const prs: PR[] = [
      { number: 1, linesChanged: 100, merged: true, repoName: "test/repo" },
      { number: 2, linesChanged: 200, merged: true, repoName: "test/repo" },
      { number: 3, linesChanged: 50, merged: false, repoName: "test/repo" },
    ];
    const svg = generateSkyline(prs, "test/repo");
    const buildings = getBuildings(svg);
    expect(buildings.length).toBe(3);
  });

  it("SVG with 1 PR has exactly 1 building", () => {
    const prs: PR[] = [sampleMergedPR];
    const svg = generateSkyline(prs, "mitosisdev/agentville");
    const buildings = getBuildings(svg);
    expect(buildings.length).toBe(1);
  });

  it("SVG with 0 PRs has 0 buildings", () => {
    const svg = generateSkyline([], "empty/repo");
    const buildings = getBuildings(svg);
    expect(buildings.length).toBe(0);
  });
});

describe("buildingHeight", () => {
  it("linesChanged=0 → height=40 (minimum)", () => {
    const prs: PR[] = [{ number: 1, linesChanged: 0, merged: true, repoName: "r" }];
    const svg = generateSkyline(prs, "r");
    const buildings = getBuildings(svg);
    expect(buildings.length).toBe(1);
    // height attribute should be 40
    expect(buildings[0]).toMatch(/height="40"/);
  });

  it("linesChanged=10000 → height=400 (maximum)", () => {
    const prs: PR[] = [{ number: 1, linesChanged: 10000, merged: true, repoName: "r" }];
    const svg = generateSkyline(prs, "r");
    const buildings = getBuildings(svg);
    expect(buildings.length).toBe(1);
    expect(buildings[0]).toMatch(/height="400"/);
  });

  it("linesChanged=400 → proportional height between 40 and 400", () => {
    const prs: PR[] = [{ number: 1, linesChanged: 400, merged: true, repoName: "r" }];
    const svg = generateSkyline(prs, "r");
    const buildings = getBuildings(svg);
    expect(buildings.length).toBe(1);
    // Extract height value
    const heightMatch = buildings[0].match(/height="(\d+(?:\.\d+)?)"/);
    expect(heightMatch).not.toBeNull();
    const h = parseFloat(heightMatch![1]);
    expect(h).toBeGreaterThan(40);
    expect(h).toBeLessThan(400);
  });
});

describe("buildingColor", () => {
  it("merged PR → fill color #8A2BE2 (purple)", () => {
    const prs: PR[] = [{ number: 1, linesChanged: 100, merged: true, repoName: "r" }];
    const svg = generateSkyline(prs, "r");
    const buildings = getBuildings(svg);
    expect(buildings.length).toBe(1);
    expect(buildings[0]).toMatch(/#8A2BE2/i);
  });

  it("open PR → stroke color #FF6B35 (orange scaffolding, no fill)", () => {
    const prs: PR[] = [{ number: 2, linesChanged: 100, merged: false, repoName: "r" }];
    const svg = generateSkyline(prs, "r");
    const buildings = getBuildings(svg);
    expect(buildings.length).toBe(1);
    // Should have orange stroke
    expect(buildings[0]).toMatch(/#FF6B35/i);
    // Should have no fill (fill="none" or fill="transparent")
    expect(buildings[0]).toMatch(/fill="none"|fill="transparent"/);
  });
});
