export interface PullRequest {
  number: number;
  title: string;
  state: 'open' | 'merged';
  linesChanged: number;
  mergedAt?: string;
}
