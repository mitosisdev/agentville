// src/fetcher.ts
// GitHub REST API fetcher — retrieves PR data for a repo and returns typed PullRequest objects.

export interface PullRequest {
  number: number;
  title: string;
  state: "open" | "merged";
  linesChanged: number;
  mergedAt?: string;
}

/** Raw shape returned by GET /repos/{repo}/pulls?state=all */
interface GHPullRequest {
  number: number;
  title: string;
  state: "open" | "closed";
  merged_at: string | null;
}

/** Raw shape returned by GET /repos/{repo}/pulls/{number}/files */
interface GHFile {
  additions: number;
  deletions: number;
}

/**
 * Fetch all PRs for `repo` (format: "owner/repo") from the GitHub REST API.
 *
 * - Retrieves up to 100 PRs (open + closed) per page.
 * - For each PR, fetches the file diff to compute `linesChanged` (additions + deletions).
 * - Maps state: "open" → "open", "closed" with merged_at → "merged".
 *   PRs that are closed but not merged are excluded from the result.
 * - Throws a descriptive error on HTTP 403 / 429 (rate limit).
 *
 * @param repo  "owner/repo" string, e.g. "mitosisdev/agentville"
 * @param token Optional GitHub personal access token. Increases rate limit from 60→5000 req/hr.
 */
export async function fetchPRs(repo: string, token?: string): Promise<PullRequest[]> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const listUrl = `https://api.github.com/repos/${repo}/pulls?state=all&per_page=100`;
  const listRes = await fetch(listUrl, { headers });
  checkRateLimit(listRes);

  if (!listRes.ok) {
    throw new Error(`GitHub API error ${listRes.status} fetching PR list for ${repo}`);
  }

  const rawPRs: GHPullRequest[] = await listRes.json();

  // Only keep open PRs and merged PRs (closed-without-merge are dropped).
  const relevant = rawPRs.filter((pr) => pr.state === "open" || pr.merged_at !== null);

  const results: PullRequest[] = await Promise.all(
    relevant.map(async (pr) => {
      const filesUrl = `https://api.github.com/repos/${repo}/pulls/${pr.number}/files`;
      const filesRes = await fetch(filesUrl, { headers });
      checkRateLimit(filesRes);

      let linesChanged = 0;
      if (filesRes.ok) {
        const files: GHFile[] = await filesRes.json();
        linesChanged = files.reduce((sum, f) => sum + f.additions + f.deletions, 0);
      }

      const result: PullRequest = {
        number: pr.number,
        title: pr.title,
        state: pr.merged_at !== null ? "merged" : "open",
        linesChanged,
      };
      if (pr.merged_at) {
        result.mergedAt = pr.merged_at;
      }
      return result;
    })
  );

  return results;
}

/**
 * Throw a descriptive error if the response indicates a rate-limit hit.
 * GitHub returns 403 (with X-RateLimit-Remaining: 0) or 429 for secondary rate limits.
 */
function checkRateLimit(res: Response): void {
  if (res.status === 403 || res.status === 429) {
    const reset = res.headers.get("X-RateLimit-Reset");
    const resetMsg = reset
      ? ` Rate limit resets at ${new Date(parseInt(reset, 10) * 1000).toISOString()}.`
      : "";
    throw new Error(
      `GitHub API rate limit exceeded (HTTP ${res.status}).${resetMsg} Provide a token to increase the limit.`
    );
  }
}
