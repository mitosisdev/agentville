// src/multi.test.ts
import { test, expect } from "bun:test";
import { writeFileSync, rmSync, mkdtempSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import type { PullRequest } from "./types.js";
import {
  generateMultiSkyline,
  loadRegistry,
  type RepoSkyline,
  type RegistryEntry,
} from "./multi.js";

function prs(...lines: number[]): PullRequest[] {
  return lines.map((linesChanged, i) => ({
    number: i + 1,
    title: `PR ${i + 1}`,
    state: i % 2 === 0 ? ("merged" as const) : ("open" as const),
    linesChanged,
  }));
}

const sampleRows: RepoSkyline[] = [
  { name: "gitstory", repo: "mitosisdev/gitstory", prs: prs(50, 200, 30) },
  { name: "changeloom", repo: "mitosisdev/changeloom", prs: prs(120, 45) },
  { name: "agentville", repo: "mitosisdev/agentville", prs: prs(310, 80, 150, 20) },
];

test("output wraps in <svg> tags", () => {
  const svg = generateMultiSkyline(sampleRows);
  expect(svg).toContain("<svg");
  expect(svg).toContain("</svg>");
});

test("renders one row group per repo", () => {
  const svg = generateMultiSkyline(sampleRows);
  const rowMatches = [...svg.matchAll(/class="skyline-row"/g)];
  expect(rowMatches.length).toBe(sampleRows.length);
});

test("each row is labeled with its repo name", () => {
  const svg = generateMultiSkyline(sampleRows);
  for (const row of sampleRows) {
    expect(svg).toContain(row.name);
  }
});

test("rows are stacked vertically (increasing y translate)", () => {
  const svg = generateMultiSkyline(sampleRows);
  const translates = [...svg.matchAll(/translate\(0,\s*([\d.]+)\)/g)].map((m) =>
    parseFloat(m[1])
  );
  expect(translates.length).toBe(sampleRows.length);
  for (let i = 1; i < translates.length; i++) {
    expect(translates[i]).toBeGreaterThan(translates[i - 1]);
  }
});

test("canvas height grows with the number of rows", () => {
  const one = generateMultiSkyline([sampleRows[0]]);
  const three = generateMultiSkyline(sampleRows);
  const h1 = parseInt(one.match(/<svg[^>]*height="(\d+)"/)![1], 10);
  const h3 = parseInt(three.match(/<svg[^>]*height="(\d+)"/)![1], 10);
  expect(h3).toBeGreaterThan(h1);
});

test("reuses building rendering — each PR yields a building element", () => {
  const svg = generateMultiSkyline(sampleRows);
  const totalPRs = sampleRows.reduce((n, r) => n + r.prs.length, 0);
  const buildingMatches = [...svg.matchAll(/class="building-\d+"/g)];
  expect(buildingMatches.length).toBe(totalPRs);
});

test("merged PRs render purple, open PRs render orange scaffolding", () => {
  const svg = generateMultiSkyline(sampleRows).toLowerCase();
  expect(svg).toContain("#8a2be2");
  expect(svg).toContain("#ff6b35");
});

test("empty registry still produces a valid SVG", () => {
  const svg = generateMultiSkyline([]);
  expect(svg).toContain("<svg");
  expect(svg).toContain("</svg>");
});

test("a repo with no PRs still renders a labeled row", () => {
  const rows: RepoSkyline[] = [
    { name: "empty-repo", repo: "owner/empty-repo", prs: [] },
  ];
  const svg = generateMultiSkyline(rows);
  expect(svg).toContain("empty-repo");
  expect([...svg.matchAll(/class="skyline-row"/g)].length).toBe(1);
});

test("loadRegistry parses the registry projects array", () => {
  const dir = mkdtempSync(join(tmpdir(), "agentville-reg-"));
  const file = join(dir, "registry.json");
  const fixture = {
    projects: [
      { repo: "owner/a", name: "a", description: "first" },
      { repo: "owner/b", name: "b", description: "second" },
    ],
  };
  writeFileSync(file, JSON.stringify(fixture), "utf8");
  try {
    const entries: RegistryEntry[] = loadRegistry(file);
    expect(entries.length).toBe(2);
    expect(entries[0].repo).toBe("owner/a");
    expect(entries[0].name).toBe("a");
    expect(entries[1].name).toBe("b");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
