// src/gif.ts
// Timelapse GIF generator — reconstructs one skyline frame per PR (the city
// growing building-by-building) and encodes the sequence as an animated GIF.
//
// Rasterization is done with @resvg/resvg-wasm (pure WASM, no native bindings,
// no headless browser) and encoding with gifenc (pure JS). This keeps the whole
// pipeline portable under bun, where sharp's native libvips fails to load.

import { initWasm, Resvg } from "@resvg/resvg-wasm";
import { GIFEncoder, quantize, applyPalette } from "gifenc";
import { readFileSync } from "fs";
import { createRequire } from "module";
import { generateSkyline } from "./skyline.js";
import type { PullRequest } from "./types.js";

/** Per-frame display time in milliseconds for intermediate frames. */
export const FRAME_DELAY_MS = 300;
/** Hold time in milliseconds for the final, complete-skyline frame. */
export const LAST_FRAME_DELAY_MS = 1500;

/** A single rasterized timelapse frame. */
export interface GifFrame {
  /** Raw RGBA pixel data, 4 bytes per pixel, row-major. */
  pixels: Uint8Array;
  /** Frame width in pixels. */
  width: number;
  /** Frame height in pixels. */
  height: number;
  /** Display time for this frame in milliseconds. */
  delay: number;
  /** Number of PRs included in this cumulative frame (1-based). */
  prCount: number;
}

// resvg-wasm must be initialized exactly once per process before any Resvg use.
let wasmReady: Promise<void> | null = null;

function ensureWasm(): Promise<void> {
  if (!wasmReady) {
    wasmReady = (async () => {
      const require = createRequire(import.meta.url);
      const wasmPath = require.resolve("@resvg/resvg-wasm/index_bg.wasm");
      await initWasm(readFileSync(wasmPath));
    })();
  }
  return wasmReady;
}

/**
 * Rasterize an SVG string to raw RGBA pixels via resvg-wasm.
 * resvg renders the static initial state of the SVG (CSS animations are not
 * evaluated), which is exactly what we want for a single timelapse frame.
 */
function rasterize(svg: string): { pixels: Uint8Array; width: number; height: number } {
  const resvg = new Resvg(svg);
  const rendered = resvg.render();
  return {
    pixels: rendered.pixels,
    width: rendered.width,
    height: rendered.height,
  };
}

/**
 * Build one rasterized frame per PR. Frame `i` (0-based) renders a skyline
 * using only the first `i + 1` PRs — so the city visibly grows one building
 * per frame in merge-date order.
 *
 * The caller is responsible for passing `prs` already sorted by merge date
 * (the fetcher returns them in API order; `agentville --gif` sorts before
 * calling). The final frame is held for {@link LAST_FRAME_DELAY_MS}.
 *
 * @param prs       PRs in chronological (oldest-first) order.
 * @param repoName  Repo label drawn on each frame.
 * @returns         One {@link GifFrame} per PR (empty array for empty input).
 */
export async function generateGifFrames(
  prs: PullRequest[],
  repoName: string
): Promise<GifFrame[]> {
  await ensureWasm();

  const frames: GifFrame[] = [];
  for (let i = 0; i < prs.length; i++) {
    const subset = prs.slice(0, i + 1);
    const svg = generateSkyline(subset, repoName);
    const { pixels, width, height } = rasterize(svg);
    const isLast = i === prs.length - 1;
    frames.push({
      pixels,
      width,
      height,
      delay: isLast ? LAST_FRAME_DELAY_MS : FRAME_DELAY_MS,
      prCount: i + 1,
    });
  }
  return frames;
}

/**
 * Generate an animated timelapse GIF of the city being built PR-by-PR.
 *
 * Each PR contributes one frame; intermediate frames show for ~300ms and the
 * final complete-skyline frame holds for 1500ms. For an empty PR list a single
 * frame of the empty skyline is emitted so the output is always a valid GIF.
 *
 * @param prs       PRs in chronological (oldest-first) order.
 * @param repoName  Repo label drawn on each frame.
 * @returns         Encoded GIF bytes (begins with the `GIF89a` magic header).
 */
export async function generateGif(
  prs: PullRequest[],
  repoName: string
): Promise<Uint8Array> {
  await ensureWasm();

  const encoder = GIFEncoder();

  if (prs.length === 0) {
    // Emit a single empty-skyline frame so the GIF is always well-formed.
    const svg = generateSkyline([], repoName);
    const { pixels, width, height } = rasterize(svg);
    writeFrame(encoder, pixels, width, height, LAST_FRAME_DELAY_MS);
  } else {
    const frames = await generateGifFrames(prs, repoName);
    for (const f of frames) {
      writeFrame(encoder, f.pixels, f.width, f.height, f.delay);
    }
  }

  encoder.finish();
  return encoder.bytes();
}

/**
 * Quantize a single RGBA frame to a 256-color palette and append it to the
 * encoder. gifenc requires per-frame quantization; rgba4444 keeps the flat
 * skyline palette crisp while staying within the 256-color GIF limit.
 */
function writeFrame(
  encoder: ReturnType<typeof GIFEncoder>,
  rgba: Uint8Array,
  width: number,
  height: number,
  delay: number
): void {
  const palette = quantize(rgba, 256, { format: "rgba4444" });
  const indexed = applyPalette(rgba, palette, "rgba4444");
  encoder.writeFrame(indexed, width, height, { palette, delay });
}
