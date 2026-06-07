# Agentville Visual Spec

## Overview

Agentville is an SVG city skyline where every merged PR plants a building — your commit history as a growing city. Open PRs appear as scaffolding, giving a live view of work in progress.

## Canvas

| Property | Value |
|---|---|
| Width | 1400 px |
| Height | 700 px |
| Background | `#0b0d10` (near-black dark) |

## Column Layout

- One column per PR, ordered left→right chronologically.
- Column width: **20 px**
- Gap between columns: **4 px**
- Stride: 24 px (20 + 4) per PR

## Buildings (Merged PRs)

| Property | Value |
|---|---|
| Fill color | `#8A2BE2` (purple) |
| Height | Proportional to `linesChanged`, clamped to **min 40 px**, **max 400 px** |
| Base | Buildings sit on the ground strip (y = 660) — bottom of building touches y = 660 |
| Windows | 3×3 px dots in `#ffffff` at 60% opacity |
| Window count | Deterministic: rows = `(pr.number * 7) % 3 + 1`, cols = `(pr.number * 13) % 4 + 2` |
| Window placement | Evenly spaced within the building bounds |

### Height Formula

```
normalizedHeight = (linesChanged / maxLinesChanged) * 400
clampedHeight    = Math.max(40, Math.min(400, normalizedHeight))
```

When all PRs have the same `linesChanged`, each building gets `min 40 px`.

## Scaffolding (Open PRs)

| Property | Value |
|---|---|
| Fill | None (transparent) |
| Stroke | `#FF6B35` (orange) |
| Stroke style | Dashed (`stroke-dasharray: 4 4`) |
| Height | Same proportional formula as merged PRs |

## Ground Strip

| Property | Value |
|---|---|
| Color | `#1a1a2e` |
| Position | y = 660 |
| Height | 10 px |
| Width | Full canvas width (1400 px) |

## Skyline Label

| Property | Value |
|---|---|
| Content | Repository name |
| Font | `Courier New`, 12 px |
| Color | `#ffffff` |
| Position | Top-left corner (x = 10, y = 20) |

## Animation

Each building animates with a CSS `@keyframes rise` effect:

| Property | Value |
|---|---|
| Keyframe name | `rise` |
| Duration | 0.8 s |
| Easing | ease-out |
| Stagger | index × 50 ms delay per building |
| Effect | Scales from 0 to full height on the Y axis, anchored at the bottom |

```css
@keyframes rise {
  from { transform: scaleY(0); }
  to   { transform: scaleY(1); }
}
```

Each building wrapper uses `transform-origin: bottom` so the rise starts from ground level.

## Export Format

- Single self-contained SVG file
- All styles embedded via `<style>` block inside the SVG
- No external dependencies or font imports required

## Data Model

```typescript
type PR = {
  number: number;
  linesChanged: number;
  state: 'merged' | 'open';
};
```

## Function Signature

```typescript
function generateSkyline(prs: PR[], repoName: string): string
```

Returns a complete SVG string ready to write to a `.svg` file or serve as `image/svg+xml`.
