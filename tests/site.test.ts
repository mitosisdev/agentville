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
});
