# Topology-Packed Graph Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace circle/index-based canvas zone placement with deterministic connection-aware topology-packed layout for unpinned zones.

**Architecture:** Add a focused `src/ui/data/graphLayout.ts` algorithm module and keep `workspace.ts` render-only. `projectTemplateToShellData` computes topology positions from the active variant connections, overlays persisted manual `canvasPositions`, and passes the result into existing zone projection.

**Tech Stack:** TypeScript, browser UI data projection, existing Bun CLI invariant tests, no external graph-layout dependency.

---

## File Structure

- Create: `src/ui/data/graphLayout.ts`
  - Owns graph normalization, component classification, path/cycle/hub/mixed initial placement, component packing, deterministic cleanup, and final clamping.
- Modify: `src/ui/data/templateProjection.ts`
  - Imports `computeTopologyPackedLayout`.
  - Computes `autoPositions` once per projection.
  - Passes `autoPositions` into `projectZone`.
  - Uses manual position first, auto-layout second, legacy fallback third.
- Modify: `src/cli/ui-session-invariants.ts`
  - Adds behavior tests for graph-layout edge cases using the exported layout helper directly.
- Modify: `docs/rmg/ui-shell.md`
  - Documents connection-aware topology-packed canvas placement.
- Modify: `README.md`
  - Mentions topology-aware map canvas layout in feature list.

## Task 1: Graph Layout Tests

**Files:**
- Modify: `src/cli/ui-session-invariants.ts`

- [ ] **Step 1: Add failing layout invariants**

Add tests that import `computeTopologyPackedLayout` from `src/ui/data/graphLayout.ts` and assert:

```ts
function assertAlmostEqual(actual: number, expected: number, message: string): void {
  assert.ok(Math.abs(actual - expected) <= 0.01, `${message}: expected ${actual} ~= ${expected}`);
}

const line = computeTopologyPackedLayout(
  [zone("A", 0), zone("B", 1), zone("C", 2)],
  [{ from: "A", to: "B" }, { from: "B", to: "C" }],
);
assertAlmostEqual(line.A.y, line.B.y, "serial line A/B y");
assertAlmostEqual(line.B.y, line.C.y, "serial line B/C y");
assert.ok(line.A.x < line.B.x && line.B.x < line.C.x, "serial line x order");
```

Also assert:

- 9-zone serial chain has at least two distinct y rows and every x/y is within `6..82`.
- triangle graph has three positions and is not collinear.
- repeated parallel A-B edges produce the same A/B positions as one A-B edge.
- saved manual position overrides computed position exactly.
- disconnected components all remain inside `6..82`.

- [ ] **Step 2: Run failing test**

Run: `npm run test:ui-session`

Expected: TypeScript/Bun failure because `src/ui/data/graphLayout.ts` does not exist.

## Task 2: Implement Graph Layout Module

**Files:**
- Create: `src/ui/data/graphLayout.ts`

- [ ] **Step 1: Add public types and constants**

Implement:

```ts
import type { CanvasPosition } from "../state/editorSession.js";
import type { ShellZoneItem } from "./shellData.js";

const MIN_PERCENT = 6;
const MAX_PERCENT = 82;
const DEFAULT_MAX_CHAIN_ROW_LENGTH = 6;

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
```

- [ ] **Step 2: Implement graph normalization**

Build maps:

- `zoneByName`
- adjacency `Map<string, Set<string>>`
- normalized unordered edge key `${min}\u0000${max}`

Ignore self-loops, missing endpoints, and endpoints not present in `zoneByName`. Collapse parallel edges by key, retain a `count` on the normalized edge for future rendering/style use, and do not filter or weight by `connectionType`; `Portal`, `Direct`, `Default`, `Proximity`, and `GladiatorArena` all affect visual layout equally.

- [ ] **Step 3: Implement component discovery**

Depth-first or breadth-first traversal over adjacency plus isolated nodes. Sort component members by original zone index for deterministic output.

- [ ] **Step 4: Implement component initial layout**

Cases:

- single zone: `{ x: 50, y: 50 }` in local component space
- path: order from endpoint if available; snake by `maxChainRowLength`
- simple cycle: polygon for `n <= 8`; snake/perimeter for larger. The threshold of 8 is an implementation decision from this plan, not a hard requirement from the spec.
- hub: highest degree node center, neighbors around a ring
- mixed: BFS from preferred root; root priority center role, highest degree, lowest index; layer nodes in rows with snake wrapping

- [ ] **Step 5: Implement component packing**

Pack components left-to-right/top-to-bottom by bounding boxes into internal 0-100 space. Then normalize each component into final `6..82` safe canvas bounds.

- [ ] **Step 6: Implement deterministic cleanup**

Run a bounded 40-80 iteration relaxation:

- adjacent nodes pull toward target spacing
- all node pairs repel if too close
- center-role nodes get mild center gravity
- clamp after each iteration

No randomness. Use fixed coefficients.

- [ ] **Step 7: Apply saved overrides**

At the end, for each `savedPositions[name]`, return the saved x/y exactly without clamping or normalization. Manual persisted positions must not be silently moved by auto-layout.

- [ ] **Step 8: Run layout tests**

Run: `npm run test:ui-session`

Expected: new graph-layout invariants pass.

## Task 3: Wire Layout Into Template Projection

**Files:**
- Modify: `src/ui/data/templateProjection.ts`

- [ ] **Step 1: Import graph layout helper**

```ts
import { computeTopologyPackedLayout } from "./graphLayout.js";
```

- [ ] **Step 2: Compute auto positions before zone projection**

Before mapping zones:

```ts
const variantZones = variant?.zones ?? [];
const autoPositions = computeTopologyPackedLayout(
  variantZones.map((zone, index) => {
    const label = zone.name ?? `Zone ${index + 1}`;
    return { name: label, index, role: inferZoneRole(zone, label), size: zone.size ?? 1 };
  }),
  variant?.connections ?? [],
  canvasPositions,
);
```

- [ ] **Step 3: Pass auto positions into projectZone**

Change `projectZone` signature to accept `autoPositions` and choose:

```ts
const position = canvasPositions[label] ?? autoPositions[label] ?? zonePosition(index, zoneCount, inferZoneRole(zone, label));
```

Keep `zonePosition` as malformed-input fallback only.

- [ ] **Step 4: Run projection/session tests**

Run: `npm run test:ui-session`

Expected: pass.

## Task 4: Documentation

**Files:**
- Modify: `docs/rmg/ui-shell.md`
- Modify: `README.md`

- [ ] **Step 1: Update UI shell docs**

Replace/extend canvas bullet to mention:

- unpinned zones use connection-aware topology-packed auto-layout
- long serial chains wrap/snake inside the canvas
- manual dragged positions still persist and override auto-layout

- [ ] **Step 2: Update README feature bullet**

Mention connection-aware canvas layout in the features list.

## Task 5: Verification

**Files:**
- All changed files

- [ ] **Step 1: Typecheck**

Run: `npm run check`

Expected: no TypeScript errors.

- [ ] **Step 2: Run all tests**

Run: `npm test`

Expected: all invariant suites pass.

- [ ] **Step 3: Build UI**

Run: `npm run ui:build`

Expected: Bun bundles `src/ui/main.ts` successfully.

- [ ] **Step 4: Final review**

Confirm changed files are scoped to graph layout, projection wiring, targeted invariant tests, and docs. Do not commit proprietary `GameEngineMapGenerator` content.
