// src/action.test.ts — validates action.yml structure
import { test, expect, describe } from "bun:test";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { parse } from "yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const actionPath = join(rootDir, "action.yml");

let action: Record<string, unknown>;

try {
  const raw = readFileSync(actionPath, "utf8");
  action = parse(raw) as Record<string, unknown>;
} catch {
  action = {};
}

describe("action.yml structure", () => {
  test("has required top-level fields", () => {
    expect(action).toHaveProperty("name");
    expect(action).toHaveProperty("description");
    expect(action).toHaveProperty("inputs");
    expect(action).toHaveProperty("runs");
  });

  test("runs.using is composite", () => {
    const runs = action["runs"] as Record<string, unknown>;
    expect(runs).toBeDefined();
    expect(runs["using"]).toBe("composite");
  });

  test("inputs.token is defined", () => {
    const inputs = action["inputs"] as Record<string, unknown>;
    expect(inputs).toBeDefined();
    expect(inputs["token"]).toBeDefined();
  });

  test("inputs.output is defined", () => {
    const inputs = action["inputs"] as Record<string, unknown>;
    expect(inputs).toBeDefined();
    expect(inputs["output"]).toBeDefined();
  });

  test("inputs.commit is defined", () => {
    const inputs = action["inputs"] as Record<string, unknown>;
    expect(inputs).toBeDefined();
    expect(inputs["commit"]).toBeDefined();
  });

  test("runs.steps is a non-empty array", () => {
    const runs = action["runs"] as Record<string, unknown>;
    expect(runs).toBeDefined();
    const steps = runs["steps"] as unknown[];
    expect(Array.isArray(steps)).toBe(true);
    expect(steps.length).toBeGreaterThan(0);
  });
});
