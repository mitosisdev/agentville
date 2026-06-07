export interface PullRequest {
  number: number;
  title: string;
  linesChanged: number;
  state: "merged" | "open";
}

interface GitHubPR {
  number: number;
  title: string;
  additions: number;
  deletions: number;
  merged_at: string | null;
  state: string;
}

function parseNextLink(linkHeader: string | null): string | null {
  if (!linkHeader) return null;
  // Link: <https://...?page=2>; rel="next", <https://...?page=5>; rel="last"
  for (const part of linkHeader.split(",")) {
    const match = part.match(/<([^>]+)>;\s*rel="next"/);
    if (match) return match[1];
  }
  return null;
}

export async function fetchPRs(
  owner: string,
  repo: string,
  token?: string
): Promise<PullRequest[]> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const results: PullRequest[] = [];
  let url: string | null =
    `https://api.github.com/repos/${owner}/${repo}/pulls?state=all&per_page=100`;

  while (url) {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const prs: GitHubPR[] = await response.json();
    for (const pr of prs) {
      const state: "merged" | "open" =
        pr.merged_at !== null ? "merged" : "open";
      results.push({
        number: pr.number,
        title: pr.title,
        linesChanged: pr.additions + pr.deletions,
        state,
      });
    }

    url = parseNextLink(response.headers.get("link"));
  }

  return results;
}
