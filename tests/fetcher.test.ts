// tests/fetcher.test.ts
import { test, expect, mock, afterEach } from "bun:test";
import type { PullRequest } from "../src/fetcher";

// Fixture data representing GitHub API responses
const fixturePRList = [
  {
    number: 1,
    title: "feat: add hello world",
    state: "closed",
    merged_at: "2024-01-10T12:00:00Z",
  },
  {
    number: 2,
    title: "fix: correct typo",
    state: "open",
    merged_at: null,
  },
  {
    number: 3,
    title: "chore: update deps",
    state: "closed",
    merged_at: null, // closed but not merged — skip or treat as neither, per task spec we only emit open|merged
  },
];

const fixtureFiles: Record<number, { additions: number; deletions: number }[]> = {
  1: [{ additions: 10, deletions: 3 }, { additions: 5, deletions: 1 }],
  2: [{ additions: 2, deletions: 0 }],
  3: [{ additions: 0, deletions: 1 }],
};

// Build a mock fetch that serves fixture data
function makeMockFetch() {
  return mock((url: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const urlStr = typeof url === "string" ? url : url instanceof URL ? url.toString() : url.url;

    // Match PR list endpoint
    const listMatch = urlStr.match(/\/repos\/([^/]+\/[^/]+)\/pulls\?/);
    if (listMatch) {
      return Promise.resolve(
        new Response(JSON.stringify(fixturePRList), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    }

    // Match PR files endpoint
    const filesMatch = urlStr.match(/\/repos\/[^/]+\/[^/]+\/pulls\/(\d+)\/files/);
    if (filesMatch) {
      const prNumber = parseInt(filesMatch[1], 10);
      const files = fixtureFiles[prNumber] ?? [];
      return Promise.resolve(
        new Response(JSON.stringify(files), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    }

    return Promise.resolve(new Response("Not Found", { status: 404 }));
  });
}

// We patch global fetch before importing the module under test so the mock is in scope.
// Bun resolves modules fresh per test file, so we use dynamic import inside each test.

test("fetchPRs returns an array", async () => {
  const originalFetch = global.fetch;
  global.fetch = makeMockFetch() as typeof fetch;
  try {
    const { fetchPRs } = await import("../src/fetcher");
    const prs = await fetchPRs("mitosisdev/agentville");
    expect(Array.isArray(prs)).toBe(true);
  } finally {
    global.fetch = originalFetch;
  }
});

test("each returned item has number, title, state, linesChanged fields", async () => {
  const originalFetch = global.fetch;
  global.fetch = makeMockFetch() as typeof fetch;
  try {
    const { fetchPRs } = await import("../src/fetcher");
    const prs = await fetchPRs("mitosisdev/agentville");
    expect(prs.length).toBeGreaterThan(0);
    for (const pr of prs) {
      expect(typeof pr.number).toBe("number");
      expect(typeof pr.title).toBe("string");
      expect(typeof pr.state).toBe("string");
      expect(typeof pr.linesChanged).toBe("number");
    }
  } finally {
    global.fetch = originalFetch;
  }
});

test("linesChanged is a number >= 0", async () => {
  const originalFetch = global.fetch;
  global.fetch = makeMockFetch() as typeof fetch;
  try {
    const { fetchPRs } = await import("../src/fetcher");
    const prs = await fetchPRs("mitosisdev/agentville");
    for (const pr of prs) {
      expect(pr.linesChanged).toBeGreaterThanOrEqual(0);
    }
  } finally {
    global.fetch = originalFetch;
  }
});

test("state is either 'open' or 'merged'", async () => {
  const originalFetch = global.fetch;
  global.fetch = makeMockFetch() as typeof fetch;
  try {
    const { fetchPRs } = await import("../src/fetcher");
    const prs = await fetchPRs("mitosisdev/agentville");
    for (const pr of prs) {
      expect(["open", "merged"]).toContain(pr.state);
    }
  } finally {
    global.fetch = originalFetch;
  }
});

test("linesChanged sums additions and deletions correctly", async () => {
  const originalFetch = global.fetch;
  global.fetch = makeMockFetch() as typeof fetch;
  try {
    const { fetchPRs } = await import("../src/fetcher");
    const prs = await fetchPRs("mitosisdev/agentville");
    // PR #1: (10+3) + (5+1) = 19, state closed+merged_at -> "merged"
    const pr1 = prs.find((p) => p.number === 1);
    expect(pr1).toBeDefined();
    expect(pr1!.linesChanged).toBe(19);
    expect(pr1!.state).toBe("merged");

    // PR #2: 2+0 = 2, state open -> "open"
    const pr2 = prs.find((p) => p.number === 2);
    expect(pr2).toBeDefined();
    expect(pr2!.linesChanged).toBe(2);
    expect(pr2!.state).toBe("open");
  } finally {
    global.fetch = originalFetch;
  }
});

test("throws on rate limit (403)", async () => {
  const originalFetch = global.fetch;
  global.fetch = mock(() =>
    Promise.resolve(new Response("Forbidden", { status: 403 }))
  ) as typeof fetch;
  try {
    const { fetchPRs } = await import("../src/fetcher");
    await expect(fetchPRs("mitosisdev/agentville")).rejects.toThrow(/rate limit/i);
  } finally {
    global.fetch = originalFetch;
  }
});

test("throws on rate limit (429)", async () => {
  const originalFetch = global.fetch;
  global.fetch = mock(() =>
    Promise.resolve(new Response("Too Many Requests", { status: 429 }))
  ) as typeof fetch;
  try {
    const { fetchPRs } = await import("../src/fetcher");
    await expect(fetchPRs("mitosisdev/agentville")).rejects.toThrow(/rate limit/i);
  } finally {
    global.fetch = originalFetch;
  }
});
