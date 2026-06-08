#!/usr/bin/env bun
import { generateSkyline } from "./skyline.js";
import type { PullRequest } from "./types.js";
import { writeFileSync } from "fs";

const repoName = process.argv[2] ?? "demo/repo";

// Demo data — used when no GitHub token is available
const demoPRs: PullRequest[] = [
  { number: 1, title: "Initial scaffold", state: "merged", linesChanged: 120, mergedAt: "2024-01-01" },
  { number: 2, title: "Add core types", state: "merged", linesChanged: 45, mergedAt: "2024-01-05" },
  { number: 3, title: "Skyline generator", state: "merged", linesChanged: 310, mergedAt: "2024-01-10" },
  { number: 4, title: "CLI entrypoint", state: "merged", linesChanged: 80, mergedAt: "2024-01-12" },
  { number: 5, title: "Tests + SPEC", state: "open", linesChanged: 150 },
];

const svg = generateSkyline(demoPRs, repoName);
const outPath = "skyline.svg";
writeFileSync(outPath, svg, "utf8");
console.log(`✓ wrote ${outPath}`);
