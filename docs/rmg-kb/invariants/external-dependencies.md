# External Dependencies

## Code Fact

Templates depend on external generator state for:

- global configs
- encounter templates
- content database
- available factions
- hero pool construction
- water-for-biome mapping

## Why This Matters

RMG correctness cannot be judged from JSON alone.

## Editor Response

- validator must run with generator context
- docs and tooling should mark fields as local-only or context-dependent
