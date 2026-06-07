# Agentville — SVG City Skyline Spec

Agentville takes a list of PRs and generates a self-contained SVG "city skyline" where each PR is a building.

## Canvas

- Size: 1400×700 px
- Background: `#0b0d10` (dark)

## Columns / Buildings

- One column per PR, ordered left→right chronologically (as given)
- Column width: 20 px
- Gap between columns: 4 px
- Building height: proportional to `linesChanged`
  - Minimum height: 40 px (when linesChanged = 0)
  - Maximum height: 400 px (when linesChanged ≥ some high value)
  - Formula: `clamp(40 + (linesChanged / MAX_LINES) * 360, 40, 400)` where MAX_LINES is chosen so that 10000+ saturates at 400

## PR States

### Merged PRs
- Color: `#8A2BE2` (purple)
- Windows: random 3×3 px dots in `#ffffff` at 60% opacity scattered across building

### Open PRs
- Dashed outline only, color: `#FF6B35` (orange)
- No fill (transparent interior = "scaffolding" look)

## Ground

- Strip at y=660, height=10 px
- Color: `#1a1a2e`

## Label

- Repo name text at top-left
- Font: `Courier New`, size: 12 px, color: white

## Animation

- CSS `@keyframes rise` per building
- Duration: 0.8s ease-out
- Staggered delay: `index × 50ms`

## Export

- Single self-contained SVG string
- Embedded `<style>` block with all CSS (no external dependencies)

## Interface

```typescript
export interface PR {
  number: number;
  linesChanged: number;
  merged: boolean;
  repoName: string;
}

export function generateSkyline(prs: PR[], repoName: string): string;
```

## CLI

- `src/cli.ts` — reads a JSON file of PRs, outputs SVG to stdout
- Registered as `"agentville"` bin entry in `package.json`
