# Must Hold

## Invariant Record 1

- Invariant statement: zone names must be unique within a variant
- Scope: one variant
- Why it exists: connections and rules target zone names
- How it can be broken: duplicate or reused zone names
- Engine response: wrong lookup or config errors
- Editor response: blocking validation error

## Invariant Record 2

- Invariant statement: connection endpoints must resolve to existing zones
- Scope: connection objects
- Why it exists: graph generation depends on valid zone indices
- How it can be broken: renamed/deleted zones
- Engine response: config errors; broken graph
- Editor response: blocking validation error

## Invariant Record 3

- Invariant statement: spawn objects must have valid `spawn`
- Scope: main objects of type `Spawn`
- Why it exists: player structure depends on it
- How it can be broken: missing `spawn` or bad enum
- Engine response: hard exception on build
- Editor response: blocking validation error

## Invariant Record 4

- Invariant statement: referenced local definitions must exist
- Scope: layouts, pools, content lists, mandatory presets, limit presets
- Why it exists: resolution goes through `TemplateContext`
- How it can be broken: unsafe rename/delete
- Engine response: config error or hard failure depending on type
- Editor response: blocking validation error

## Invariant Record 5

- Invariant statement: index-based refs must remain aligned with main-object order
- Scope: roads, faction rules, biome rules, placement args
- Why it exists: main-object references are positional
- How it can be broken: reorder without rewrite
- Engine response: silent semantic drift or hard parse failure
- Editor response: forbid raw reorder or auto-rewrite all dependents
