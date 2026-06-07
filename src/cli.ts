#!/usr/bin/env bun
import { readFileSync } from "fs";
import { generateSkyline } from "./agentville";
import type { PR } from "./agentville";

export function main(): void {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("Usage: agentville <prs.json> [repo-name]");
    console.error("");
    console.error("prs.json should be an array of PR objects:");
    console.error(
      '  [{"number": 1, "linesChanged": 200, "merged": true, "repoName": "org/repo"}]'
    );
    process.exit(1);
  }

  const filePath = args[0];
  let prs: PR[];

  try {
    const raw = readFileSync(filePath, "utf8");
    prs = JSON.parse(raw) as PR[];
  } catch (err) {
    console.error(`Failed to read/parse ${filePath}: ${err}`);
    process.exit(1);
  }

  // Infer repo name from first PR or second arg
  const repoName = args[1] ?? (prs[0]?.repoName ?? "unknown/repo");

  const svg = generateSkyline(prs, repoName);
  process.stdout.write(svg);
}

main();
