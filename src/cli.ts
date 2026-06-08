#!/usr/bin/env bun
import { generateSkyline } from "./skyline.js";
import { generatePortfolioSkyline } from "./portfolio.js";
import { fetchPRs } from "./fetcher.js";
import type { PullRequest } from "./types.js";
import { writeFileSync, readFileSync } from "fs";

// Parse args: [repo] [--all] [--out <path>]
const args = process.argv.slice(2);
const allMode = args.includes("--all");
const outFlagIdx = args.indexOf("--out");
const outPath =
  outFlagIdx !== -1
    ? args[outFlagIdx + 1] ?? (allMode ? "portfolio.svg" : "skyline.svg")
    : allMode
      ? "portfolio.svg"
      : "skyline.svg";
const repoName =
  args.filter(
    (a, i) => a !== "--all" && i !== outFlagIdx && i !== outFlagIdx + 1
  )[0] ?? "demo/repo";

const REGISTRY_PATH = "/home/sverre/mito/projects/registry.json";

// Demo data — used when no GitHub token is available, or per-repo on fetch failure.
const demoPRs: PullRequest[] = [
  { number: 1, title: "Initial scaffold", state: "merged", linesChanged: 120, mergedAt: "2024-01-01" },
  { number: 2, title: "Add core types", state: "merged", linesChanged: 45, mergedAt: "2024-01-05" },
  { number: 3, title: "Skyline generator", state: "merged", linesChanged: 310, mergedAt: "2024-01-10" },
  { number: 4, title: "CLI entrypoint", state: "merged", linesChanged: 80, mergedAt: "2024-01-12" },
  { number: 5, title: "Tests + SPEC", state: "open", linesChanged: 150 },
];

const ghAuth = process.env.GITHUB_TOKEN;

/**
 * Read the mito portfolio registry and return the list of "owner/repo" strings.
 * Handles both the `{ projects: [{ repo }] }` shape and a bare array of
 * `{ github }` / `{ repo }` objects.
 */
function loadRegistryRepos(): string[] {
  const raw = JSON.parse(readFileSync(REGISTRY_PATH, "utf8"));
  const entries: Array<{ github?: string; repo?: string }> = Array.isArray(raw)
    ? raw
    : (raw.projects ?? []);
  return entries
    .map((e) => e.github ?? e.repo)
    .filter((r): r is string => typeof r === "string" && r.length > 0);
}

/** Fetch a repo's PRs, falling back to demo data (with a warning) on any failure. */
async function prsForRepo(repo: string): Promise<PullRequest[]> {
  if (!ghAuth) return demoPRs;
  try {
    return await fetchPRs(repo, ghAuth);
  } catch (err) {
    console.warn(`  ⚠ ${repo}: fetch failed (${err}), using demo data`);
    return demoPRs;
  }
}

async function runAll() {
  const repos = loadRegistryRepos();
  console.log(`Rendering portfolio of ${repos.length} repos…`);
  const rows = [];
  for (const repo of repos) {
    console.log(`  • ${repo}`);
    rows.push({ repoName: repo, prs: await prsForRepo(repo) });
  }
  const svg = generatePortfolioSkyline(rows);
  writeFileSync(outPath, svg, "utf8");
  console.log(`✓ wrote ${outPath} (${rows.length} skyline rows)`);
}

async function runSingle() {
  let prs: PullRequest[];
  if (ghAuth && repoName !== "demo/repo") {
    try {
      console.log(`Fetching PRs for ${repoName}…`);
      prs = await fetchPRs(repoName, ghAuth);
      console.log(`  fetched ${prs.length} PRs`);
    } catch (err) {
      console.warn(`  fetch failed (${err}), falling back to demo data`);
      prs = demoPRs;
    }
  } else {
    prs = demoPRs;
  }

  const svg = generateSkyline(prs, repoName);
  writeFileSync(outPath, svg, "utf8");
  console.log(`✓ wrote ${outPath}`);
}

async function main() {
  if (allMode) {
    await runAll();
  } else {
    await runSingle();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
