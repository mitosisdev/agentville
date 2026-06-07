import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import type { PullRequest } from "../src/github";

// We'll import fetchPRs lazily after mocking fetch

const makePR = (overrides: Record<string, unknown> = {}) => ({
  number: 1,
  title: "Test PR",
  additions: 10,
  deletions: 5,
  merged_at: null,
  state: "open",
  ...overrides,
});

const makeResponse = (data: unknown, headers: Record<string, string> = {}) => ({
  ok: true,
  json: async () => data,
  headers: {
    get: (key: string) => headers[key.toLowerCase()] ?? null,
  },
});

describe("fetchPRs", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("maps merged PRs correctly (merged_at !== null → 'merged')", async () => {
    const mergedPR = makePR({ merged_at: "2024-01-01T00:00:00Z", state: "closed" });
    globalThis.fetch = mock(async () => makeResponse([mergedPR])) as unknown as typeof fetch;

    const { fetchPRs } = await import("../src/github");
    const prs = await fetchPRs("owner", "repo");

    expect(prs).toHaveLength(1);
    expect(prs[0].state).toBe("merged");
  });

  it("maps open PRs correctly (merged_at === null && state === 'open' → 'open')", async () => {
    const openPR = makePR({ merged_at: null, state: "open" });
    globalThis.fetch = mock(async () => makeResponse([openPR])) as unknown as typeof fetch;

    const { fetchPRs } = await import("../src/github");
    const prs = await fetchPRs("owner", "repo");

    expect(prs).toHaveLength(1);
    expect(prs[0].state).toBe("open");
  });

  it("calculates linesChanged = additions + deletions", async () => {
    const pr = makePR({ additions: 42, deletions: 13, merged_at: "2024-01-01T00:00:00Z", state: "closed" });
    globalThis.fetch = mock(async () => makeResponse([pr])) as unknown as typeof fetch;

    const { fetchPRs } = await import("../src/github");
    const prs = await fetchPRs("owner", "repo");

    expect(prs[0].linesChanged).toBe(55);
  });

  it("sends Authorization: Bearer {token} when token provided", async () => {
    const capturedHeaders: Record<string, string>[] = [];
    globalThis.fetch = mock(async (url: string, opts?: RequestInit) => {
      capturedHeaders.push((opts?.headers ?? {}) as Record<string, string>);
      return makeResponse([]);
    }) as unknown as typeof fetch;

    const { fetchPRs } = await import("../src/github");
    await fetchPRs("owner", "repo", "my-secret-token");

    expect(capturedHeaders[0]["Authorization"]).toBe("Bearer my-secret-token");
  });

  it("handles pagination by following Link rel=next header", async () => {
    const pr1 = makePR({ number: 1, title: "First", additions: 5, deletions: 2, merged_at: "2024-01-01T00:00:00Z", state: "closed" });
    const pr2 = makePR({ number: 2, title: "Second", additions: 8, deletions: 1, merged_at: null, state: "open" });

    let callCount = 0;
    globalThis.fetch = mock(async (url: string) => {
      callCount++;
      if (callCount === 1) {
        return makeResponse([pr1], {
          link: '<https://api.github.com/repos/owner/repo/pulls?page=2>; rel="next"',
        });
      }
      return makeResponse([pr2]);
    }) as unknown as typeof fetch;

    const { fetchPRs } = await import("../src/github");
    const prs = await fetchPRs("owner", "repo");

    expect(callCount).toBe(2);
    expect(prs).toHaveLength(2);
    expect(prs[0].number).toBe(1);
    expect(prs[1].number).toBe(2);
  });
});
