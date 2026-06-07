import { describe, it, expect } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";
import { parse as parseYaml } from "yaml";

const root = join(import.meta.dir, "..");

describe("package.json publish fields", () => {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf-8"));

  it("name is agentville", () => {
    expect(pkg.name).toBe("agentville");
  });

  it("description exists and is non-empty", () => {
    expect(typeof pkg.description).toBe("string");
    expect(pkg.description.length).toBeGreaterThan(0);
  });

  it("files array exists and is non-empty", () => {
    expect(Array.isArray(pkg.files)).toBe(true);
    expect(pkg.files.length).toBeGreaterThan(0);
  });

  it("license exists", () => {
    expect(typeof pkg.license).toBe("string");
    expect(pkg.license.length).toBeGreaterThan(0);
  });

  it("keywords is a non-empty array", () => {
    expect(Array.isArray(pkg.keywords)).toBe(true);
    expect(pkg.keywords.length).toBeGreaterThan(0);
  });
});

describe(".github/workflows/publish.yml", () => {
  const raw = readFileSync(join(root, ".github/workflows/publish.yml"), "utf-8");
  const wf = parseYaml(raw) as Record<string, unknown>;

  it("has push.tags trigger with v* pattern", () => {
    const on = wf["on"] as Record<string, unknown>;
    expect(on).toBeDefined();
    const push = on["push"] as Record<string, unknown>;
    expect(push).toBeDefined();
    const tags = push["tags"] as string[];
    expect(Array.isArray(tags)).toBe(true);
    expect(tags.some((t) => t === "v*")).toBe(true);
  });

  it("has a bun test step", () => {
    const jobs = wf["jobs"] as Record<string, unknown>;
    const allSteps = Object.values(jobs).flatMap(
      (j) => ((j as Record<string, unknown>)["steps"] as Record<string, unknown>[]) ?? [],
    );
    const hasTestStep = allSteps.some(
      (s) => typeof s["run"] === "string" && s["run"].includes("bun test"),
    );
    expect(hasTestStep).toBe(true);
  });

  it("has a bun publish step", () => {
    const jobs = wf["jobs"] as Record<string, unknown>;
    const allSteps = Object.values(jobs).flatMap(
      (j) => ((j as Record<string, unknown>)["steps"] as Record<string, unknown>[]) ?? [],
    );
    const hasPublishStep = allSteps.some(
      (s) => typeof s["run"] === "string" && s["run"].includes("bun publish"),
    );
    expect(hasPublishStep).toBe(true);
  });
});
