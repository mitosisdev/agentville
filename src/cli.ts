#!/usr/bin/env bun
import { generateSkyline } from "./skyline.js";
import { fetchPRs } from "./fetcher.js";
import type { PullRequest } from "./types.js";
import { writeFileSync } from "fs";

// Parse args: [repo] [--out <path>]
const args = process.argv.slice(2);
const outFlagIdx = args.indexOf("--out");
const outPath = outFlagIdx !== -1 ? args[outFlagIdx + 1] ?? "skyline.svg" : "skyline.svg";
const repoName = args.filter((_, i) => i !== outFlagIdx && i !== outFlagIdx + 1)[0] ?? "demo/repo";

// Demo data — used when no GitHub token is available
const demoPRs: PullRequest[] = [
  { number: 1, title: "Initial scaffold", state: "merged", linesChanged: 120, mergedAt: "2024-01-01" },
  { number: 2, title: "Add core types", state: "merged", linesChanged: 45, mergedAt: "2024-01-05" },
  { number: 3, title: "Skyline generator", state: "merged", linesChanged: 310, mergedAt: "2024-01-10" },
  { number: 4, title: "CLI entrypoint", state: "merged", linesChanged: 80, mergedAt: "2024-01-12" },
  { number: 5, title: "Tests + SPEC", state: "open", linesChanged: 150 },
];

const ghAuth = process.env.GITHUB_TOKEN;

async function main() {
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

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
