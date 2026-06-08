import type { PullRequest } from "./types.js";

const CANVAS_W = 1400;
const CANVAS_H = 700;
const BG = "#0b0d10";
const GROUND_Y = 660;
const GROUND_H = 10;
const GROUND_COLOR = "#1a1a2e";
const COL_W = 20;
const COL_GAP = 4;
const MIN_H = 40;
const MAX_H = 400;
const BUILDING_COLOR = "#8A2BE2";
const SCAFFOLD_COLOR = "#FF6B35";
const WINDOW_COLOR = "#ffffff";
const WINDOW_OPACITY = 0.6;
const WINDOW_SIZE = 3;
const WINDOW_SPACING = 8;
const WINDOW_MARGIN = 6;

function buildHeight(linesChanged: number, maxLines: number): number {
  if (maxLines === 0) return MIN_H;
  const h = MIN_H + (linesChanged / maxLines) * (MAX_H - MIN_H);
  return Math.min(MAX_H, Math.max(MIN_H, h));
}

function windows(x: number, y: number, w: number, h: number): string {
  const parts: string[] = [];
  const innerW = w - WINDOW_MARGIN * 2;
  const innerH = h - WINDOW_MARGIN * 2;
  if (innerW < WINDOW_SIZE || innerH < WINDOW_SIZE) return "";
  const cols = Math.max(1, Math.floor((innerW + WINDOW_SPACING) / (WINDOW_SIZE + WINDOW_SPACING)));
  const rows = Math.max(1, Math.floor((innerH + WINDOW_SPACING) / (WINDOW_SIZE + WINDOW_SPACING)));
  const totalW = cols * WINDOW_SIZE + (cols - 1) * WINDOW_SPACING;
  const totalH = rows * WINDOW_SIZE + (rows - 1) * WINDOW_SPACING;
  const startX = x + (w - totalW) / 2;
  const startY = y + (h - totalH) / 2;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const wx = startX + c * (WINDOW_SIZE + WINDOW_SPACING);
      const wy = startY + r * (WINDOW_SIZE + WINDOW_SPACING);
      parts.push(
        `<rect x="${wx.toFixed(1)}" y="${wy.toFixed(1)}" width="${WINDOW_SIZE}" height="${WINDOW_SIZE}" fill="${WINDOW_COLOR}" opacity="${WINDOW_OPACITY}"/>`
      );
    }
  }
  return parts.join("\n        ");
}

function animationStyles(count: number): string {
  const lines: string[] = [
    `@keyframes rise {`,
    `  from { transform: scaleY(0); transform-origin: bottom; }`,
    `  to   { transform: scaleY(1); transform-origin: bottom; }`,
    `}`,
  ];
  for (let i = 0; i < count; i++) {
    const delay = (i * 50).toFixed(0);
    lines.push(`.building-${i} { animation: rise 0.8s ease-out ${delay}ms both; }`);
  }
  return lines.join("\n    ");
}

export function generateSkyline(prs: PullRequest[], repoName: string): string {
  const maxLines = prs.reduce((m, p) => Math.max(m, p.linesChanged), 0);

  const buildings: string[] = prs.map((pr, i) => {
    const x = i * (COL_W + COL_GAP);
    const h = buildHeight(pr.linesChanged, maxLines);
    const y = GROUND_Y - h;

    if (pr.state === "merged") {
      const wins = windows(x, y, COL_W, h);
      return `  <g class="building-${i}">
    <rect x="${x}" y="${y}" width="${COL_W}" height="${h}" fill="${BUILDING_COLOR}" data-h="${h.toFixed(2)}"/>
    ${wins}
  </g>`;
    } else {
      // Open PR — scaffolding only
      return `  <g class="building-${i}">
    <rect x="${x}" y="${y}" width="${COL_W}" height="${h}" fill="none" stroke="${SCAFFOLD_COLOR}" stroke-width="1.5" stroke-dasharray="4 2" data-h="${h.toFixed(2)}"/>
  </g>`;
    }
  });

  const styles = animationStyles(prs.length);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_W}" height="${CANVAS_H}" viewBox="0 0 ${CANVAS_W} ${CANVAS_H}">
  <style>
    ${styles}
  </style>
  <!-- background -->
  <rect width="${CANVAS_W}" height="${CANVAS_H}" fill="${BG}"/>
  <!-- repo label -->
  <text x="10" y="20" font-family="Courier New, monospace" font-size="12" fill="#ffffff">${repoName}</text>
  <!-- buildings -->
${buildings.join("\n")}
  <!-- ground -->
  <rect x="0" y="${GROUND_Y}" width="${CANVAS_W}" height="${GROUND_H}" fill="${GROUND_COLOR}"/>
</svg>`;
}
