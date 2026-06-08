# Graph Model

`src/core/graph` converts a resolved RMG variant into UI-ready graph data without importing React, React Flow, Tauri, or DOM APIs.

## Status

- `done`: graph conversion, node/edge contracts, and smoke scans exist.
- `partial`: the graph model is UI-ready, but the actual editor UI is not built.
- `missing`: interactive graph editing, drag/drop wiring, and visual diff/reconciliation tools.

## Files

- `src/core/graph/graphTypes.ts`: graph node, edge, stats, role, and behavior contracts.
- `src/core/graph/buildGraph.ts`: converts a `ResolvedVariant` into `RmgGraph`.
- `src/core/graph/connectionBehavior.ts`: mirrors C# connection helper behavior.
- `src/core/graph/zoneRole.ts`: infers editor-facing zone roles from names and main objects.
- `src/cli/graph-scan.ts`: smoke test over every live template variant.

## Node Contract

Each `RmgGraphNode` represents one resolved zone and includes:

- stable `id`
- zone index and name
- inferred role
- size and layout id
- owner/spawn refs
- guarded, unguarded, and resource pool refs
- mandatory-content preset refs
- content-count-limit preset refs
- flat/per-area budget fields
- local diagnostic counts

This is enough for the first graph viewer and zone inspector.

## Edge Contract

Each `RmgGraphEdge` represents one resolved connection and includes:

- stable `id`
- connection index and optional name
- source/target node ids
- connection type
- connection behavior flags
- guard summary
- portal activity summary
- local diagnostic counts

The behavior flags mirror the C# helpers:

- `needsGroundConnection`: `Direct`, `GladiatorArena`
- `canHaveGroundConnection`: `Default`, `Direct`, `GladiatorArena`
- `needsAdjacency`: `Direct`, `GladiatorArena`, `Proximity`
- `canBecomePortal`: `Default`, `Direct`, `Portal`

## Zone Roles

Roles are editor metadata, not game enums:

- `spawn`
- `treasure`
- `superTreasure`
- `center`
- `side`
- `connector`
- `back`
- `win`
- `neutral`
- `unknown`

The role inference is intentionally conservative and should remain overrideable in UI metadata later.

## Smoke Test

Run:

```bash
npm run graph:scan
```

Current verified facts:

- 66 graphs, one per live template variant.
- 902 graph nodes.
- 1,393 graph edges.
- Connection totals match `core:scan`.

Largest graphs by node+edge count currently include `Full Hire`, `Flashback`, `Symphony`, `Expanse`, `Spider`, `Anarchy`, `OctoJebus`, `Maze`, and `Massacre`.
