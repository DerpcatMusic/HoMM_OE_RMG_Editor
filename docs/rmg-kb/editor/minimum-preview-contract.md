# Minimum Preview Contract

## Source Files

- `architecture/preview-and-debug-surfaces.md`
- `Generator.cs`
- `Layout.cs`
- `ContentPlacer.cs`

## Inference

This is a proposed tooling contract derived from existing debug/runtime surfaces.

## Preview Request Inputs

- template json
- seed
- optional spawn-faction overrides

## Preview Response Must Include

- resolved template metadata
- sampled `templateVariant`
- zone graph summary
- `Layout.DebugInfo`
- tile-level layout getters or equivalent layer payloads
- `ContentPlacer.DebugInfo`
- warnings/errors encountered during build/generation

## Why

This is the smallest useful contract that can power graph preview, tile overlays, and placement diagnostics without reimplementing the generator.
