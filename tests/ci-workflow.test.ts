import { describe, it, expect } from "bun:test";
import { existsSync, readFileSync } from "fs";
import * as path from "path";

describe(".github/workflows/ci.yml", () => {
  const ciPath = path.join(import.meta.dir, "../.github/workflows/ci.yml");

  it("workflow file exists", () => {
    expect(existsSync(ciPath)).toBe(true);
  });

  it("contains bun test step", () => {
    const content = readFileSync(ciPath, "utf8");
    expect(content).toContain("bun test");
  });

  it("triggers on push and pull_request", () => {
    const content = readFileSync(ciPath, "utf8");
    expect(content).toContain("push");
    expect(content).toContain("pull_request");
  });

  it("uses actions/checkout", () => {
    const content = readFileSync(ciPath, "utf8");
    expect(content).toContain("actions/checkout");
  });
});
