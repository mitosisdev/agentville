# agentville — SVG Skyline Generator Spec

Every merged PR plants a building. The skyline is the visual story of a repo's commit history.

## Canvas

| Property | Value |
|---|---|
| Width | 1400 px |
| Height | 700 px |
| Background | `#0b0d10` |

## Columns (Buildings)

- One column per PR, ordered left→right chronologically (oldest first).
- Column width: **20 px**
- Gap between columns: **4 px**

## Building Height

```
height = minH + (linesChanged / maxLines) * (maxH - minH)
```

| Constant | Value |
|---|---|
| minH | 40 px |
| maxH | 400 px |
| maxLines | max `linesChanged` across all PRs in the set |

Building **base** sits on the ground line (y=660). It grows upward.

## PR States

### Merged PR — Building
- Fill color: `#8A2BE2` (purple)
- Windows: 3×3 px dots in `#ffffff` at 60% opacity
- Window placement: evenly distributed across the building face (rows × cols grid, 6 px margin from edges, 8 px spacing)

### Open PR — Scaffolding
- No fill (transparent)
- Dashed outline stroke: `#FF6B35` (orange), stroke-width 1.5, stroke-dasharray `4 2`

## Ground

- y: 660 px
- Height: 10 px
- Fill: `#1a1a2e`

## Labels

- Repo name: `Courier New` 12 px, fill `#ffffff`, x=10, y=20

## Animation

- CSS `@keyframes rise` per building
- Duration: 0.8s, timing: ease-out
- Stagger: `index × 50ms` delay
- Buildings slide up from y=660 (ground) to their final position

## Output

- Single self-contained SVG string with all styles embedded in a `<style>` block
- No external dependencies, no JavaScript
