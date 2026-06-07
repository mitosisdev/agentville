// src/skyline.ts — SVG city skyline generator where every merged PR plants a building.

export interface PR {
  number: number;
  title: string;
  state: "merged" | "open";
  linesChanged: number;
  mergedAt?: string;
}

const CANVAS_WIDTH = 1400;
const CANVAS_HEIGHT = 700;
const COL_WIDTH = 20;
const COL_GAP = 4;
const COL_STRIDE = COL_WIDTH + COL_GAP;
const MIN_HEIGHT = 40;
const MAX_HEIGHT = 400;
const GROUND_Y = 660;
const GROUND_HEIGHT = 10;
const BG_COLOR = "#0b0d10";
const MERGED_COLOR = "#8A2BE2";
const OPEN_COLOR = "#FF6B35";
const GROUND_COLOR = "#1a1a2e";
const WINDOW_COLOR = "#ffffff";
const ANIMATION_DURATION = "0.8s";
const ANIMATION_STAGGER = 50; // ms per building index

/** Clamp a value between min and max */
function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/** Compute building height proportional to linesChanged, clamped to [MIN_HEIGHT, MAX_HEIGHT] */
function computeHeight(linesChanged: number): number {
  // Scale: 1 line → MIN_HEIGHT, 1000+ lines → MAX_HEIGHT
  const SCALE_MAX = 1000;
  const ratio = clamp(linesChanged, 1, SCALE_MAX) / SCALE_MAX;
  const raw = MIN_HEIGHT + ratio * (MAX_HEIGHT - MIN_HEIGHT);
  return Math.round(clamp(raw, MIN_HEIGHT, MAX_HEIGHT));
}

/** Generate random window dots for a merged building */
function generateWindows(x: number, buildingY: number, buildingHeight: number): string {
  const dots: string[] = [];
  // Seed-like deterministic placement based on x/y to keep output stable
  const cols = 4;
  const rows = Math.floor(buildingHeight / 12);
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Pseudo-random skip: skip ~40% of windows using a simple hash
      const hash = (row * 7 + col * 13 + x) % 10;
      if (hash < 4) continue;
      const wx = x + 2 + col * 4;
      const wy = buildingY + 4 + row * 10;
      dots.push(`<rect x="${wx}" y="${wy}" width="3" height="3" fill="${WINDOW_COLOR}" opacity="0.6"/>`);
    }
  }
  return dots.join("\n      ");
}

/** Generate the full SVG skyline from a list of PRs */
export function generateSkyline(prs: PR[], repoName = "agentville"): string {
  // Sort merged PRs by mergedAt, then open PRs by number
  const sorted = [...prs].sort((a, b) => {
    if (a.mergedAt && b.mergedAt) {
      return new Date(a.mergedAt).getTime() - new Date(b.mergedAt).getTime();
    }
    if (a.mergedAt) return -1;
    if (b.mergedAt) return 1;
    return a.number - b.number;
  });

  const buildings: string[] = [];

  sorted.forEach((pr, index) => {
    const x = index * COL_STRIDE;
    const h = computeHeight(pr.linesChanged);
    const y = GROUND_Y - h;
    const delay = index * ANIMATION_STAGGER;

    if (pr.state === "merged") {
      const windows = generateWindows(x, y, h);
      buildings.push(`    <g style="animation: rise ${ANIMATION_DURATION} ease-out ${delay}ms both">
      <rect x="${x}" y="${y}" width="${COL_WIDTH}" height="${h}" fill="${MERGED_COLOR}"/>
      ${windows}
    </g>`);
    } else {
      // Open PR: scaffolding — dashed outline, no fill
      buildings.push(`    <g style="animation: rise ${ANIMATION_DURATION} ease-out ${delay}ms both">
      <rect x="${x}" y="${y}" width="${COL_WIDTH}" height="${h}" fill="none" stroke="${OPEN_COLOR}" stroke-width="1.5" stroke-dasharray="4 2"/>
    </g>`);
    }
  });

  const ground = `  <rect x="0" y="${GROUND_Y}" width="${CANVAS_WIDTH}" height="${GROUND_HEIGHT}" fill="${GROUND_COLOR}"/>`;
  const label = `  <text x="8" y="20" font-family="Courier New" font-size="12" fill="white">${repoName}</text>`;

  const style = `  <style>
    @keyframes rise {
      from { transform: translateY(400px); opacity: 0; }
      to   { transform: translateY(0);     opacity: 1; }
    }
  </style>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" viewBox="0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}">
${style}
  <rect width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" fill="${BG_COLOR}"/>
${label}
${buildings.join("\n")}
${ground}
</svg>`;
}
