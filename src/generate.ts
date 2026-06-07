export type PR = {
  number: number;
  linesChanged: number;
  state: "merged" | "open";
};

const CANVAS_WIDTH = 1400;
const CANVAS_HEIGHT = 700;
const BG_COLOR = "#0b0d10";
const COLUMN_WIDTH = 20;
const COLUMN_GAP = 4;
const COLUMN_STRIDE = COLUMN_WIDTH + COLUMN_GAP;
const HEIGHT_MIN = 40;
const HEIGHT_MAX = 400;
const GROUND_Y = 660;
const GROUND_HEIGHT = 10;
const GROUND_COLOR = "#1a1a2e";
const MERGED_COLOR = "#8A2BE2";
const OPEN_STROKE = "#FF6B35";
const WINDOW_COLOR = "#ffffff";
const WINDOW_OPACITY = 0.6;
const WINDOW_SIZE = 3;
const ANIMATION_DURATION = "0.8s";
const ANIMATION_STAGGER = 50; // ms

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function buildingHeight(linesChanged: number, maxLines: number): number {
  if (maxLines === 0) return HEIGHT_MIN;
  const normalized = (linesChanged / maxLines) * HEIGHT_MAX;
  return clamp(normalized, HEIGHT_MIN, HEIGHT_MAX);
}

function windowRows(prNumber: number): number {
  return (prNumber * 7) % 3 + 1;
}

function windowCols(prNumber: number): number {
  return (prNumber * 13) % 4 + 2;
}

function renderWindows(
  pr: PR,
  x: number,
  buildingTop: number,
  height: number
): string {
  const rows = windowRows(pr.number);
  const cols = windowCols(pr.number);
  const parts: string[] = [];
  const cellW = COLUMN_WIDTH / (cols + 1);
  const cellH = height / (rows + 1);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const wx = x + cellW * (c + 1);
      const wy = buildingTop + cellH * (r + 1);
      parts.push(
        `<rect class="window" x="${wx.toFixed(1)}" y="${wy.toFixed(1)}" width="${WINDOW_SIZE}" height="${WINDOW_SIZE}" fill="${WINDOW_COLOR}" opacity="${WINDOW_OPACITY}" />`
      );
    }
  }
  return parts.join("\n    ");
}

function renderBuilding(pr: PR, index: number, maxLines: number): string {
  const height = buildingHeight(pr.linesChanged, maxLines);
  const x = index * COLUMN_STRIDE;
  const buildingTop = GROUND_Y - height;
  const delay = index * ANIMATION_STAGGER;

  if (pr.state === "merged") {
    const windows = renderWindows(pr, x, buildingTop, height);
    return `  <g class="building" style="animation-delay: ${delay}ms; animation-duration: ${ANIMATION_DURATION}; animation-name: rise; animation-fill-mode: both; animation-timing-function: ease-out; transform-origin: ${x + COLUMN_WIDTH / 2}px ${GROUND_Y}px;">
    <rect class="building-rect" x="${x}" y="${buildingTop}" width="${COLUMN_WIDTH}" height="${height}" fill="${MERGED_COLOR}" />
    ${windows}
  </g>`;
  } else {
    return `  <g class="building" style="animation-delay: ${delay}ms; animation-duration: ${ANIMATION_DURATION}; animation-name: rise; animation-fill-mode: both; animation-timing-function: ease-out; transform-origin: ${x + COLUMN_WIDTH / 2}px ${GROUND_Y}px;">
    <rect class="building-rect" x="${x}" y="${buildingTop}" width="${COLUMN_WIDTH}" height="${height}" fill="none" stroke="${OPEN_STROKE}" stroke-dasharray="4 4" />
  </g>`;
  }
}

export function generateSkyline(prs: PR[], repoName: string): string {
  const maxLines = prs.reduce((max, pr) => Math.max(max, pr.linesChanged), 0);

  const buildings = prs
    .map((pr, i) => renderBuilding(pr, i, maxLines))
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" viewBox="0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}">
<style>
  @keyframes rise {
    from { transform: scaleY(0); }
    to   { transform: scaleY(1); }
  }
</style>
  <!-- background -->
  <rect width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" fill="${BG_COLOR}" />
  <!-- skyline label -->
  <text x="10" y="20" font-family="Courier New" font-size="12" fill="#ffffff">${repoName}</text>
  <!-- ground -->
  <rect x="0" y="${GROUND_Y}" width="${CANVAS_WIDTH}" height="${GROUND_HEIGHT}" fill="${GROUND_COLOR}" />
  <!-- buildings -->
${buildings}
</svg>`;
}
