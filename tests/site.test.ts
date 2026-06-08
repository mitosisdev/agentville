import { describe, it, expect } from "bun:test";
import { existsSync, readFileSync } from "fs";
import * as path from "path";

describe("site/index.html", () => {
  const htmlPath = path.join(import.meta.dir, "../site/index.html");

  it("file exists and has content", () => {
    expect(existsSync(htmlPath)).toBe(true);
    const content = readFileSync(htmlPath, "utf8");
    expect(content.length).toBeGreaterThan(100);
  });

  it("contains the title agentville", () => {
    const content = readFileSync(htmlPath, "utf8");
    expect(content).toContain("agentville");
  });

  it("contains a link to the GitHub repo", () => {
    const content = readFileSync(htmlPath, "utf8");
    expect(content).toContain("github.com/mitosisdev/agentville");
  });

  it("references skyline.svg (live generated image)", () => {
    const content = readFileSync(htmlPath, "utf8");
    expect(content).toContain("skyline.svg");
  });
});

describe(".github/workflows/pages.yml", () => {
  const pagesPath = path.join(import.meta.dir, "../.github/workflows/pages.yml");

  it("workflow file exists", () => {
    expect(existsSync(pagesPath)).toBe(true);
  });

  it("mentions actions/deploy-pages", () => {
    const content = readFileSync(pagesPath, "utf8");
    expect(content).toContain("actions/deploy-pages");
  });

  it("triggers on push to main", () => {
    const content = readFileSync(pagesPath, "utf8");
    expect(content).toContain("push");
    expect(content).toContain("main");
  });

  it("checks out with full history (fetch-depth: 0)", () => {
    const content = readFileSync(pagesPath, "utf8");
    expect(content).toContain("fetch-depth: 0");
  });

  it("sets up bun", () => {
    const content = readFileSync(pagesPath, "utf8");
    expect(content).toContain("oven-sh/setup-bun");
  });

  it("runs bun install", () => {
    const content = readFileSync(pagesPath, "utf8");
    expect(content).toContain("bun install");
  });

  it("generates skyline SVG into site/", () => {
    const content = readFileSync(pagesPath, "utf8");
    expect(content).toContain("site/skyline.svg");
  });

  it("passes GITHUB_TOKEN env var to skyline generation step", () => {
    const content = readFileSync(pagesPath, "utf8");
    expect(content).toContain("GITHUB_TOKEN");
  });

  it("has correct permissions block", () => {
    const content = readFileSync(pagesPath, "utf8");
    expect(content).toContain("pages: write");
    expect(content).toContain("id-token: write");
  });

  it("deploys from site/ directory", () => {
    const content = readFileSync(pagesPath, "utf8");
    // upload-pages-artifact path should be site/
    expect(content).toContain("path: site/");
  });
});

describe("README.md", () => {
  const readmePath = path.join(import.meta.dir, "../README.md");

  it("embeds live skyline image", () => {
    const content = readFileSync(readmePath, "utf8");
    expect(content).toContain("mitosisdev.github.io/agentville/skyline.svg");
  });

  it("includes pitch line about auto-generation", () => {
    const content = readFileSync(readmePath, "utf8");
    expect(content).toContain("auto-generated on every merge");
  });

  it("includes the exact one-line pitch", () => {
    const content = readFileSync(readmePath, "utf8");
    expect(content).toContain(
      "Every merged PR plants a building. This is agentville's own skyline.",
    );
  });

  it("links to the live demo page", () => {
    const content = readFileSync(readmePath, "utf8");
    expect(content).toContain("https://mitosisdev.github.io/agentville/");
  });

  it("explains how to install and run it via bun", () => {
    const content = readFileSync(readmePath, "utf8").toLowerCase();
    expect(content).toContain("bun");
    expect(content).toContain("agentville");
    expect(content).toContain("--out");
  });

  it("documents the GITHUB_TOKEN environment variable", () => {
    const content = readFileSync(readmePath, "utf8");
    expect(content).toContain("GITHUB_TOKEN");
  });

  it("explains that the skyline auto-regenerates on every PR merge", () => {
    const content = readFileSync(readmePath, "utf8").toLowerCase();
    expect(content).toContain("regenerat");
    expect(content).toContain("merge");
  });
});

describe("src/cli.ts --out flag", () => {
  it("cli source supports --out flag", () => {
    const cliPath = path.join(import.meta.dir, "../src/cli.ts");
    const content = readFileSync(cliPath, "utf8");
    expect(content).toContain("--out");
  });

  it("cli source reads GitHub token from environment", () => {
    const cliPath = path.join(import.meta.dir, "../src/cli.ts");
    const content = readFileSync(cliPath, "utf8");
    expect(content).toContain("GITHUB_TOKEN");
  });
});
