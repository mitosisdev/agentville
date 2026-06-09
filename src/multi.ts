// src/multi.ts
// Multi-repo skyline view. Reads the mito registry, fetches PRs for every repo
// in parallel, and renders each repo as one horizontal skyline row stacked
// vertically on a single SVG canvas. Building rendering is reused verbatim from
// skyline.ts — no geometry is duplicated here.

import { readFileSync } from "fs";
import type { PullRequest } from "./types.js";
import { fetchPRs } from "./fetcher.js";
import {
  SKYLINE_DIMS,
  renderBuilding,
  animationStyles,
  maxLinesOf,
} from "./skyline.js";

const {
  CANVAS_W,
  BG,
  GROUND_H,
  GROUND_COLOR,
} = SKYLINE_DIMS;

/** Horizontal space reserved on the left of each row for the repo label. */
const LABEL_GUTTER = 150;
/** Vertical space allotted to a single repo's skyline row. */
const ROW_HEIGHT = 320;
/** Padding between the row's top edge and the title text baseline area. */
const ROW_TOP_PAD = 24;
/** Where the ground line sits inside a row (buildings rest on it). */
const ROW_GROUND_Y = ROW_HEIGHT - 30;

/** A single entry in the mito registry (`projects/registry.json`). */
export interface RegistryEntry {
  repo: string;
  name: string;
  description?: string;
  createdAt?: string;
}

/** Resolved per-repo data: registry metadata plus its fetched PRs. */
export interface RepoSkyline {
  name: string;
  repo: string;
  prs: PullRequest[];
}

/** Shape of the registry file. */
interface RegistryFile {
  projects: RegistryEntry[];
}

/**
 * Read and parse the mito registry JSON, returning the `projects` array.
 * Throws if the file is missing or malformed — callers decide how to surface it.
 *
 * @param path Absolute path to `registry.json`.
 */
export function loadRegistry(path: string): RegistryEntry[] {
  const raw = readFileSync(path, "utf8");
  const parsed = JSON.parse(raw) as RegistryFile;
  if (!parsed || !Array.isArray(parsed.projects)) {
    throw new Error(`Registry at ${path} has no "projects" array`);
  }
  return parsed.projects;
}

/** XML-escape a string for safe inclusion in SVG text/attribute content. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Render a single repo as one skyline row group. The row is a `<g>` translated
 * to its vertical slot; buildings are produced by the shared `renderBuilding`
 * primitive (offset past the label gutter and anchored to the row's ground).
 *
 * @param row     Repo metadata + its PRs.
 * @param yOffset Vertical translation for this row.
 */
function renderRow(row: RepoSkyline, yOffset: number): string {
  const maxLines = maxLinesOf(row.prs);
  const buildings = row.prs
    .map((pr, i) => renderBuilding(pr, i, maxLines, ROW_GROUND_Y, LABEL_GUTTER))
    .join("\n");

  const prCount = row.prs.length;
  const label = esc(row.name);
  const sub = `${prCount} PR${prCount === 1 ? "" : "s"}`;

  return `  <g class="skyline-row" transform="translate(0, ${yOffset.toFixed(1)})">
    <!-- row separator -->
    <rect x="0" y="0" width="${CANVAS_W}" height="${ROW_HEIGHT}" fill="none"/>
    <!-- repo label -->
    <text x="16" y="${ROW_TOP_PAD}" font-family="Courier New, monospace" font-size="16" font-weight="bold" fill="#ffffff">${label}</text>
    <text x="16" y="${ROW_TOP_PAD + 18}" font-family="Courier New, monospace" font-size="11" fill="#8A2BE2">${sub}</text>
${buildings}
    <!-- ground -->
    <rect x="0" y="${ROW_GROUND_Y}" width="${CANVAS_W}" height="${GROUND_H}" fill="${GROUND_COLOR}"/>
  </g>`;
}

/**
 * Render every repo as a stacked skyline row on one SVG canvas. Canvas height
 * scales with the number of rows. The shared rise-animation keyframes are
 * emitted once, sized to the widest row.
 *
 * @param rows Per-repo resolved skylines, rendered top-to-bottom in order.
 */
export function generateMultiSkyline(rows: RepoSkyline[]): string {
  const canvasH = Math.max(ROW_HEIGHT, rows.length * ROW_HEIGHT);
  const maxBuildings = rows.reduce((m, r) => Math.max(m, r.prs.length), 0);
  const styles = animationStyles(maxBuildings);

  const rowSvg = rows
    .map((row, i) => renderRow(row, i * ROW_HEIGHT))
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_W}" height="${canvasH}" viewBox="0 0 ${CANVAS_W} ${canvasH}">
  <style>
    ${styles}
  </style>
  <!-- background -->
  <rect width="${CANVAS_W}" height="${canvasH}" fill="${BG}"/>
${rowSvg}
</svg>`;
}

/**
 * Fetch PRs for every registry entry in parallel. A failed fetch for one repo
 * degrades to an empty skyline for that repo rather than failing the whole run.
 *
 * @param entries Registry entries to fetch.
 * @param token   Optional GitHub token (raises rate limits 60→5000/hr).
 */
export async function fetchAllSkylines(
  entries: RegistryEntry[],
  token?: string
): Promise<RepoSkyline[]> {
  return Promise.all(
    entries.map(async (entry): Promise<RepoSkyline> => {
      try {
        const prs = await fetchPRs(entry.repo, token);
        return { name: entry.name, repo: entry.repo, prs };
      } catch (err) {
        console.warn(`  fetch failed for ${entry.repo} (${err}) — empty row`);
        return { name: entry.name, repo: entry.repo, prs: [] };
      }
    })
  );
}

/**
 * End-to-end driver for `agentville --all`: load the registry, fetch all repos
 * in parallel, and return the rendered multi-skyline SVG.
 *
 * @param registryPath Absolute path to the mito registry JSON.
 * @param token        Optional GitHub token.
 */
export async function buildAllSkylinesSvg(
  registryPath: string,
  token?: string
): Promise<string> {
  const entries = loadRegistry(registryPath);
  console.log(`Loaded ${entries.length} repos from registry`);
  const rows = await fetchAllSkylines(entries, token);
  return generateMultiSkyline(rows);
}
