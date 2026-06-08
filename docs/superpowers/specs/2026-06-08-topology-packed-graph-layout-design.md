# Topology-Packed Graph Layout Design

## Goal

Replace the current circle/index-based canvas placement with a deterministic, connection-aware layout that makes serial maps read like lines, cycles read like polygons, hubs read like spokes, and long chains wrap inside the canvas like a snake/grid instead of running off-screen.

## Current Context

- `src/ui/data/templateProjection.ts` currently assigns zone positions in `zonePosition(index, zoneCount, role)`.
- That function only uses zone index, zone count, and inferred role. It does not inspect `variant.connections`.
- `src/ui/components/workspace.ts` renders whatever `ShellZoneItem.x/y` receives and should remain render-only.
- Existing manual positions are persisted as editor-only `canvasPositions` and must continue to win over auto-layout.
- Docs establish connections as template graph edges. All visual connection types, including `Portal`, should affect placement equally for this feature because the editor canvas draws them all as visible links.

## Design

Add a focused graph layout module, `src/ui/data/graphLayout.ts`, used by `projectTemplateToShellData` before the zone projection loop.

`projectTemplateToShellData` should compute a full `autoPositions` map for every zone in the active variant, then pass that map into `projectZone`. `projectZone` should choose `canvasPositions[label] ?? autoPositions[label] ?? legacyFallbackPosition`. This makes the wiring explicit: manual positions win, topology layout supplies normal unpinned positions, and a small legacy fallback remains only for malformed/empty inputs.

The layout pipeline:

1. Normalize zones by stable label.
2. Normalize connections into unordered zone-pair edges.
   - Parallel connections collapse into one layout edge.
   - Parallel count is retained for possible future visual styling, but node placement treats the pair as one relationship.
   - Missing or invalid endpoints are ignored for layout and left to validation.
   - All valid connection types have equal layout weight for this feature.
3. Split the graph into connected components.
4. Classify each component:
   - single zone
   - path/serial chain
   - cycle
   - hub/star
   - mixed graph
5. Generate deterministic initial component positions:
   - short paths: straight row/column
   - long paths: snake layout with a max row length, initially 6 zones per row
   - cycles: regular polygon for small cycles; perimeter/snake fallback for large cycles
   - hubs: highest-degree node near center, neighbors around it
   - mixed graphs: BFS/tree-like layers from high-degree or role-preferred anchors, with branch wrapping
6. Pack components into an abstract 0-100 working space, then emit positions in the existing safe percent range used by the canvas.
   - Final zone positions must clamp to the current `clampPercent` range, `6..82`, so node rectangles stay visible.
   - The 0-100 space is only an internal normalization space for component packing.
7. Run a small deterministic cleanup pass:
   - connected nodes attract
   - all nodes repel
   - overlapping nodes separate
   - all positions clamp to `6..82`
   - no randomness; output must be stable for the same template
8. Overlay saved manual positions last:
   - if `canvasPositions[zoneName]` exists, use it exactly
   - otherwise use computed layout

## Edge Cases

- **Parallel connections:** collapse for layout to avoid over-pulling; keep all original connection records for rendering and inspector behavior.
- **Long serial chains:** snake/wrap after 6 zones per row so chains remain inside the canvas.
- **Disconnected graphs:** lay out each component separately and pack boxes into the canvas grid.
- **Cycles:** triangles become triangles, 4-cycles become squares, larger cycles become polygons until a configured threshold, then perimeter/snake.
- **Dense graphs:** avoid trying to draw mathematically perfect complete graphs; use degree-based anchors plus relaxation.
- **Manual drag positions:** never overwritten unless an explicit future “Auto-layout graph” command is added.
- **Template edits:** new/unpinned zones receive computed positions; existing pinned zones stay pinned.
- **Center-role zones:** do not receive a hardcoded absolute coordinate anymore. They become preferred component anchors/BFS roots and get stronger center gravity during cleanup, but topology can still move them when the connection structure demands it.
- **Malformed layout input:** keep a minimal fallback equivalent to the old circle/center placement so the UI never loses nodes if graph layout receives no usable edges.

## API

```ts
export interface GraphLayoutZoneInput {
  name: string;
  index: number;
  role: ShellZoneItem["role"];
  size: number;
}

export interface GraphLayoutConnectionInput {
  from?: string;
  to?: string;
}

export interface GraphLayoutOptions {
  maxChainRowLength?: number;
}

export function computeTopologyPackedLayout(
  zones: readonly GraphLayoutZoneInput[],
  connections: readonly GraphLayoutConnectionInput[],
  savedPositions?: Readonly<Record<string, CanvasPosition>>,
  options?: GraphLayoutOptions,
): Record<string, CanvasPosition>;
```

## Testing

Add targeted unit/invariant tests rather than screenshot tests:

- serial 3-zone graph produces mostly collinear ordered positions
- long serial graph wraps to multiple rows and stays in bounds
- triangle graph produces three non-collinear positions
- parallel edges do not change node count or destabilize layout
- saved manual position overrides computed position
- disconnected components all stay in bounds and do not overlap heavily

## Documentation

Update `docs/rmg/ui-shell.md` and `README.md` to say the canvas uses connection-aware topology-packed auto-layout for unpinned zones.
