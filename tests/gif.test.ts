// tests/gif.test.ts
import { test, expect } from "bun:test";
import { generateGifFrames, generateGif, type GifFrame } from "../src/gif";
import type { PullRequest } from "../src/types";

const samplePRs: PullRequest[] = [
  { number: 1, title: "Init repo", state: "merged", linesChanged: 50, mergedAt: "2024-01-01" },
  { number: 2, title: "Add feature", state: "merged", linesChanged: 200, mergedAt: "2024-01-02" },
  { number: 3, title: "WIP feature", state: "open", linesChanged: 30 },
];

test("generateGifFrames returns N frames for N PRs", async () => {
  const frames = await generateGifFrames(samplePRs, "test/repo");
  expect(frames.length).toBe(samplePRs.length);
});

test("each frame carries raw RGBA pixel data of the canvas size", async () => {
  const frames = await generateGifFrames(samplePRs, "test/repo");
  for (const f of frames) {
    expect(f.width).toBe(1400);
    expect(f.height).toBe(700);
    expect(f.pixels.length).toBe(f.width * f.height * 4);
  }
});

test("frame i is built from only the first i PRs (cumulative growth)", async () => {
  const frames = await generateGifFrames(samplePRs, "test/repo");
  for (let i = 0; i < frames.length; i++) {
    expect(frames[i].prCount).toBe(i + 1);
  }
});

test("last frame holds longer than intermediate frames", async () => {
  const frames = await generateGifFrames(samplePRs, "test/repo");
  const last = frames[frames.length - 1];
  const first = frames[0];
  expect(last.delay).toBeGreaterThan(first.delay);
  expect(first.delay).toBe(300);
  expect(last.delay).toBe(1500);
});

test("generateGif produces a valid GIF (GIF89a magic bytes)", async () => {
  const gif = await generateGif(samplePRs, "test/repo");
  expect(gif.length).toBeGreaterThan(0);
  const magic = String.fromCharCode(...gif.slice(0, 6));
  expect(magic).toBe("GIF89a");
});

test("empty PR list still produces a valid single-frame GIF", async () => {
  const gif = await generateGif([], "empty/repo");
  const magic = String.fromCharCode(...gif.slice(0, 6));
  expect(magic).toBe("GIF89a");
  expect(gif.length).toBeGreaterThan(0);
});

test("generateGifFrames returns empty list for empty PR list", async () => {
  const frames = await generateGifFrames([], "empty/repo");
  expect(frames.length).toBe(0);
});

test("GifFrame type is structurally usable", async () => {
  const frames = await generateGifFrames(samplePRs, "test/repo");
  const f: GifFrame = frames[0];
  expect(typeof f.delay).toBe("number");
  expect(typeof f.prCount).toBe("number");
});
