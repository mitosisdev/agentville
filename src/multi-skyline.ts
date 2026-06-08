/**
 * multi-skyline.ts
 *
 * Combines multiple per-repo SVG skylines into a single stacked SVG canvas.
 * Each skyline gets a small repo label above it.
 */

export interface SkylineEntry {
  repo: string;
  svg: string;
}

/** Vertical space reserved for the repo label above each skyline. */
const LABEL_H = 24;

/** Gap between stacked skylines (between the ground of one and the label of the next). */
const GAP = 16;

/** Outer vertical padding (top above first label, bottom below last skyline). */
const OUTER_PAD = 16;

/** Canvas width — matches the single-skyline renderer (skyline.ts CANVAS_W). */
const CANVAS_W = 1400;

/** Fallback height for a single skyline when it cannot be parsed from the SVG string. */
const DEFAULT_SKYLINE_H = 700;

/** Label font settings */
const LABEL_FONT = `font-family="Courier New, monospace" font-size="13" fill="#aaaacc"`;

// ── SVG parsing helpers ────────────────────────────────────────────────────────

/**
 * Extract the numeric `height` attribute from an `<svg …>` root element.
 * Falls back to DEFAULT_SKYLINE_H if it cannot be found.
 */
function parseSvgHeight(svg: string): number {
  const m = svg.match(/<svg\b[^>]+\bheight="(\d+(?:\.\d+)?)"/);
  if (m) return parseFloat(m[1]);
  return DEFAULT_SKYLINE_H;
}

/**
 * Extract everything between the first `>` of the root `<svg …>` tag and the
 * closing `</svg>`.  Returns the inner XML fragment suitable for embedding
 * inside a `<g>` element.
 */
function svgInnerContent(svg: string): string {
  const openEnd = svg.indexOf(">");
  if (openEnd === -1) return svg;
  const closeStart = svg.lastIndexOf("</svg>");
  if (closeStart === -1) return svg.slice(openEnd + 1);
  return svg.slice(openEnd + 1, closeStart);
}

// ── public API ─────────────────────────────────────────────────────────────────

/**
 * Render multiple per-repo skylines stacked vertically into one SVG canvas.
 *
 * @param skylines  Array of `{ repo, svg }` — svg is the already-rendered
 *                  SVG string for that repo (as produced by `generateSkyline`).
 * @returns         A single SVG string combining all skylines.
 */
export function renderMultiSkyline(skylines: SkylineEntry[]): string {
  if (skylines.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_W}" height="${OUTER_PAD * 2}" viewBox="0 0 ${CANVAS_W} ${OUTER_PAD * 2}"><rect width="${CANVAS_W}" height="${OUTER_PAD * 2}" fill="#0b0d10"/></svg>`;
  }

  // Compute total canvas height:
  //   outer_pad + (label + skyline_h) × n + gap × (n-1) + outer_pad
  const slotHeights = skylines.map((e) => parseSvgHeight(e.svg));
  const totalH =
    OUTER_PAD +
    skylines.reduce((sum, _, i) => sum + LABEL_H + slotHeights[i], 0) +
    (skylines.length - 1) * GAP +
    OUTER_PAD;

  const sections: string[] = [];
  let cursorY = OUTER_PAD;

  for (let i = 0; i < skylines.length; i++) {
    const { repo, svg } = skylines[i];
    const skylineH = slotHeights[i];

    // Repo label — baseline near bottom of the label area
    const labelY = cursorY + LABEL_H - 6;
    sections.push(
      `  <text x="10" y="${labelY}" ${LABEL_FONT} font-weight="bold">${escapeXml(repo)}</text>`
    );

    // Inner skyline content, shifted down by (cursorY + LABEL_H)
    const innerY = cursorY + LABEL_H;
    const inner = svgInnerContent(svg);
    sections.push(`  <g transform="translate(0,${innerY})">\n${inner}\n  </g>`);

    cursorY += LABEL_H + skylineH;
    if (i < skylines.length - 1) {
      cursorY += GAP;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_W}" height="${totalH}" viewBox="0 0 ${CANVAS_W} ${totalH}">
  <!-- background -->
  <rect width="${CANVAS_W}" height="${totalH}" fill="#0b0d10"/>
${sections.join("\n")}
</svg>`;
}

// ── XML escape ─────────────────────────────────────────────────────────────────

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
