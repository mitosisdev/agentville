import { test, expect } from "bun:test";
import { generatePortfolioSkyline } from "../src/portfolio";
import type { PullRequest } from "../src/types";

const prsA: PullRequest[] = [
  { number: 1, title: "Init", state: "merged", linesChanged: 50, mergedAt: "2024-01-01" },
  { number: 2, title: "Feature", state: "merged", linesChanged: 200, mergedAt: "2024-01-02" },
];

const prsB: PullRequest[] = [
  { number: 1, title: "Bootstrap", state: "merged", linesChanged: 80, mergedAt: "2024-02-01" },
  { number: 2, title: "WIP", state: "open", linesChanged: 30 },
];

test("single-row portfolio contains that repo's name and is valid SVG", () => {
  const svg = generatePortfolioSkyline([{ repoName: "mitosisdev/gitstory", prs: prsA }]);
  expect(svg).toContain("<svg");
  expect(svg).toContain("</svg>");
  expect(svg).toContain("mitosisdev/gitstory");
});

test("two-row portfolio SVG contains both repo names", () => {
  const svg = generatePortfolioSkyline([
    { repoName: "mitosisdev/gitstory", prs: prsA },
    { repoName: "mitosisdev/changeloom", prs: prsB },
  ]);
  expect(svg).toContain("mitosisdev/gitstory");
  expect(svg).toContain("mitosisdev/changeloom");
});

test("empty rows returns a valid SVG (no crash)", () => {
  const svg = generatePortfolioSkyline([]);
  expect(svg).toContain("<svg");
  expect(svg).toContain("</svg>");
});

test("stacking: each row wrapped in a translate group; second row Y > 0", () => {
  const svg = generatePortfolioSkyline([
    { repoName: "mitosisdev/gitstory", prs: prsA },
    { repoName: "mitosisdev/changeloom", prs: prsB },
  ]);
  const translates = [...svg.matchAll(/translate\(0,\s*(\d+(?:\.\d+)?)\)/g)].map((m) =>
    parseFloat(m[1])
  );
  expect(translates.length).toBe(2);
  expect(translates[0]).toBe(0);
  expect(translates[1]).toBeGreaterThan(0);
});

test("a row with no PRs does not crash and still labels the repo", () => {
  const svg = generatePortfolioSkyline([{ repoName: "empty/repo", prs: [] }]);
  expect(svg).toContain("<svg");
  expect(svg).toContain("empty/repo");
});

test("portfolio SVG height grows with the number of rows", () => {
  const one = generatePortfolioSkyline([{ repoName: "a/one", prs: prsA }]);
  const two = generatePortfolioSkyline([
    { repoName: "a/one", prs: prsA },
    { repoName: "b/two", prs: prsB },
  ]);
  const h1 = parseFloat(one.match(/<svg[^>]*\bheight="(\d+(?:\.\d+)?)"/)![1]);
  const h2 = parseFloat(two.match(/<svg[^>]*\bheight="(\d+(?:\.\d+)?)"/)![1]);
  expect(h2).toBeGreaterThan(h1);
});
