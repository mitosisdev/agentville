# Agentville Skyline — Visual Spec

## Canvas

- Size: 1400×700 px
- Background: `#0b0d10` (dark near-black)

## Column Layout

- One column per merged PR, ordered left→right chronologically
- Column width: 20 px
- Gap between columns: 4 px

## Building Height

- Proportional to `linesChanged` for that PR
- Minimum: 40 px
- Maximum: 400 px

## Merged PRs (buildings)

- Fill color: `#8A2BE2` (purple)
- Windows: random 3×3 px dots scattered across the building face
  - Color: `#ffffff` at 60% opacity

## Open PRs (scaffolding)

- Dashed outline only — no fill
- Stroke color: `#FF6B35` (orange)
- `stroke-dasharray` applied to indicate in-progress construction

## Ground Strip

- y position: 660
- Height: 10 px
- Fill: `#1a1a2e`

## Skyline Label

- Content: repository name
- Font: Courier New, 12 px
- Color: white
- Position: top-left of canvas

## Animation

- CSS `@keyframes rise` per building
- Duration: 0.8s
- Easing: ease-out
- Stagger: index × 50 ms delay
- Effect: building rises from ground (translateY) into final position

## Export

- Single self-contained SVG file
- All styles embedded in a `<style>` block within the SVG
- No external dependencies
