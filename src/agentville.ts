export interface PR {
  number: number;
  linesChanged: number;
  merged: boolean;
  repoName: string;
}

// Max lines changed that maps to maximum height (400px)
const MAX_LINES = 10000;
const MIN_HEIGHT = 40;
const MAX_HEIGHT = 400;
const COLUMN_WIDTH = 20;
const COLUMN_GAP = 4;
const CANVAS_WIDTH = 1400;
const CANVAS_HEIGHT = 700;
const GROUND_Y = 660;
const GROUND_HEIGHT = 10;
const BASELINE = GROUND_Y; // buildings sit on the ground

function calcHeight(linesChanged: number): number {
  const ratio = Math.min(linesChanged / MAX_LINES, 1);
  return MIN_HEIGHT + ratio * (MAX_HEIGHT - MIN_HEIGHT);
}

function randomWindows(
  x: number,
  y: number,
  width: number,
  height: number,
  seed: number
): string {
  // Deterministic pseudo-random based on seed so SVG is stable
  let state = seed;
  function rand(): number {
    state = (state * 1664525 + 1013904223) & 0xffffffff;
    return (state >>> 0) / 0xffffffff;
  }

  const dots: string[] = [];
  const windowSize = 3;
  const padding = 4;
  const cols = Math.floor((width - padding * 2) / (windowSize + 3));
  const rows = Math.floor((height - padding * 2) / (windowSize + 4));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (rand() > 0.4) {
        const wx = x + padding + c * (windowSize + 3);
        const wy = y + padding + r * (windowSize + 4);
        dots.push(
          `<rect x="${wx}" y="${wy}" width="${windowSize}" height="${windowSize}" fill="#ffffff" opacity="0.6"/>`
        );
      }
    }
  }
  return dots.join("\n");
}

export function generateSkyline(prs: PR[], repoName: string): string {
  const buildings: string[] = [];

  for (let i = 0; i < prs.length; i++) {
    const pr = prs[i];
    const height = calcHeight(pr.linesChanged);
    const x = i * (COLUMN_WIDTH + COLUMN_GAP);
    const y = BASELINE - height;
    const delay = i * 50;

    if (pr.merged) {
      // Solid purple building with windows
      const windows = randomWindows(x, y, COLUMN_WIDTH, height, pr.number * 12345 + i);
      buildings.push(
        `<rect class="building" x="${x}" y="${y}" width="${COLUMN_WIDTH}" height="${height}" ` +
          `fill="#8A2BE2" style="animation: rise 0.8s ease-out ${delay}ms both;"/>\n` +
          windows
      );
    } else {
      // Open PR: scaffolding — dashed orange outline, no fill
      buildings.push(
        `<rect class="building" x="${x}" y="${y}" width="${COLUMN_WIDTH}" height="${height}" ` +
          `fill="none" stroke="#FF6B35" stroke-width="1.5" stroke-dasharray="4 2" ` +
          `style="animation: rise 0.8s ease-out ${delay}ms both;"/>`
      );
    }
  }

  const styles = `
    <style>
      @keyframes rise {
        from {
          transform: scaleY(0);
          transform-origin: bottom;
        }
        to {
          transform: scaleY(1);
          transform-origin: bottom;
        }
      }
    </style>
  `;

  const groundStrip = `<rect x="0" y="${GROUND_Y}" width="${CANVAS_WIDTH}" height="${GROUND_HEIGHT}" fill="#1a1a2e"/>`;

  const label = `<text x="8" y="20" font-family="Courier New" font-size="12" fill="white">${repoName}</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" viewBox="0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}">
  ${styles}
  <rect width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" fill="#0b0d10"/>
  ${label}
  ${groundStrip}
  ${buildings.join("\n  ")}
</svg>`;
}
