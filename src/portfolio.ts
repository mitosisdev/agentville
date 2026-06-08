import type { PullRequest } from "./types.js";
import { generateSkyline } from "./skyline.js";

/** Must match CANVAS_W / CANVAS_H in skyline.ts. */
const ROW_W = 1400;
const ROW_H = 700;
/** Vertical gap between stacked skyline rows, in px. */
const ROW_GAP = 20;
const BG = "#0b0d10";

export interface PortfolioRow {
  repoName: string;
  prs: PullRequest[];
}

/**
 * Extract the inner content of a single-skyline SVG — everything between the
 * opening `<svg ...>` tag and the closing `</svg>`. The per-row skyline is
 * rendered by `generateSkyline`, then unwrapped so it can be re-anchored inside
 * a `<g transform>` group in the combined portfolio document.
 */
function innerSvg(svg: string): string {
  const open = svg.indexOf(">", svg.indexOf("<svg"));
  const close = svg.lastIndexOf("</svg>");
  if (open === -1 || close === -1) return svg;
  return svg.slice(open + 1, close).trim();
}

/**
 * Render every repo in the portfolio as its own skyline row, stacked
 * vertically into a single SVG. Each row is the full single-repo skyline
 * (label + buildings + ground), re-anchored with
 * `<g transform="translate(0, Y)">` where Y = rowIndex * (ROW_H + ROW_GAP).
 *
 * An empty `rows` array yields a valid (empty) SVG canvas — no crash.
 * A row with no PRs renders its label and ground line only.
 */
export function generatePortfolioSkyline(rows: PortfolioRow[]): string {
  const totalW = ROW_W;
  const totalH =
    rows.length === 0 ? ROW_H : rows.length * ROW_H + (rows.length - 1) * ROW_GAP;

  const groups = rows.map((row, i) => {
    const y = i * (ROW_H + ROW_GAP);
    const content = innerSvg(generateSkyline(row.prs, row.repoName));
    return `  <g transform="translate(0, ${y})">
${content}
  </g>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}">
  <rect width="${totalW}" height="${totalH}" fill="${BG}"/>
${groups.join("\n")}
</svg>`;
}
