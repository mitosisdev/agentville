#!/usr/bin/env bun
import { generateSkyline } from "./skyline.js";
import { generateGif } from "./gif.js";
import { fetchPRs } from "./fetcher.js";
import { buildAllSkylinesSvg } from "./multi.js";
import type { PullRequest } from "./types.js";
import { writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Parse args: [repo] [--out <path>] [--gif [outfile]] [--all]
const args = process.argv.slice(2);

const allMode = args.includes("--all");

const outFlagIdx = args.indexOf("--out");
const defaultOut = allMode ? "skyline-all.svg" : "skyline.svg";
const outPath = outFlagIdx !== -1 ? args[outFlagIdx + 1] ?? defaultOut : defaultOut;

const gifFlagIdx = args.indexOf("--gif");
const gifMode = gifFlagIdx !== -1;
// Optional positional path immediately after --gif (skip if it's another flag).
const gifArg = gifMode ? args[gifFlagIdx + 1] : undefined;
const gifPath = gifArg && !gifArg.startsWith("--") ? gifArg : "agentville.gif";

// The repo name is the first positional arg that isn't consumed by a flag.
const consumed = new Set<number>();
if (outFlagIdx !== -1) consumed.add(outFlagIdx).add(outFlagIdx + 1);
if (gifMode) {
  consumed.add(gifFlagIdx);
  if (gifArg && !gifArg.startsWith("--")) consumed.add(gifFlagIdx + 1);
}
const repoName =
  args.filter((a, i) => !consumed.has(i) && !a.startsWith("--"))[0] ?? "demo/repo";

// Demo data — used when no GitHub token is available
const demoPRs: PullRequest[] = [
  { number: 1, title: "Initial scaffold", state: "merged", linesChanged: 120, mergedAt: "2024-01-01" },
  { number: 2, title: "Add core types", state: "merged", linesChanged: 45, mergedAt: "2024-01-05" },
  { number: 3, title: "Skyline generator", state: "merged", linesChanged: 310, mergedAt: "2024-01-10" },
  { number: 4, title: "CLI entrypoint", state: "merged", linesChanged: 80, mergedAt: "2024-01-12" },
  { number: 5, title: "Tests + SPEC", state: "open", linesChanged: 150 },
];

const ghAuth = process.env.GITHUB_TOKEN;

/**
 * Resolve the mito registry path. Precedence:
 *  1. MITO_REGISTRY env var (explicit override)
 *  2. ../../projects/registry.json relative to this repo (.workspace/agentville → mito root)
 *  3. /home/sverre/mito/projects/registry.json (documented default)
 */
function resolveRegistryPath(): string {
  if (process.env.MITO_REGISTRY) return process.env.MITO_REGISTRY;
  const here = dirname(fileURLToPath(import.meta.url)); // .../agentville/src
  const sibling = resolve(here, "../../../projects/registry.json");
  if (existsSync(sibling)) return sibling;
  return "/home/sverre/mito/projects/registry.json";
}

/** Sort PRs oldest-first by merge date so the timelapse grows chronologically.
 *  Open PRs (no mergedAt) sort to the end, preserving fetch order among them. */
function sortByMergeDate(prs: PullRequest[]): PullRequest[] {
  return [...prs].sort((a, b) => {
    if (a.mergedAt && b.mergedAt) return a.mergedAt.localeCompare(b.mergedAt);
    if (a.mergedAt) return -1;
    if (b.mergedAt) return 1;
    return 0;
  });
}

async function loadPRs(): Promise<PullRequest[]> {
  if (ghAuth && repoName !== "demo/repo") {
    try {
      console.log(`Fetching PRs for ${repoName}…`);
      const prs = await fetchPRs(repoName, ghAuth);
      console.log(`  fetched ${prs.length} PRs`);
      return prs;
    } catch (err) {
      console.warn(`  fetch failed (${err}), falling back to demo data`);
      return demoPRs;
    }
  }
  return demoPRs;
}

async function main() {
  if (allMode) {
    const registryPath = resolveRegistryPath();
    console.log(`Building multi-repo skyline from ${registryPath}…`);
    const svg = await buildAllSkylinesSvg(registryPath, ghAuth);
    writeFileSync(outPath, svg, "utf8");
    console.log(`✓ wrote ${outPath}`);
    return;
  }

  const prs = await loadPRs();

  if (gifMode) {
    const ordered = sortByMergeDate(prs);
    console.log(`Rendering ${ordered.length} timelapse frames…`);
    const gif = await generateGif(ordered, repoName);
    writeFileSync(gifPath, gif);
    console.log(`✓ wrote ${gifPath} (${gif.length} bytes, ${ordered.length} frames)`);
    return;
  }

  const svg = generateSkyline(prs, repoName);
  writeFileSync(outPath, svg, "utf8");
  console.log(`✓ wrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
