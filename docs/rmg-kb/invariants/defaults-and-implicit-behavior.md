# Defaults And Implicit Behavior

## Hidden Defaults

- `orientation.mode` defaults to `BoundingCircle`
- zone `layout` defaults to `zone_layout_default`
- road `type` falls back to `Dirt` when omitted or invalid; official templates usually write `Stone` explicitly
- connection `connectionType` defaults to `Default`
- connection `gatePlacement` defaults to `Random`
- main object `type` defaults to `City`
- main object `placement` defaults to `Uniform`
- `heroHireBan` defaults to `false`

## Why This Matters

Omitted fields are still semantic choices. An editor or validator that serializes, normalizes, or strips defaults can change meaning or hide engine behavior.

## Break Example

If a tool assumes omitted road type means “unset” or “official-common Stone”, visual and traversal expectations diverge.

## Editor Response

- show effective defaults in UI
- allow “explicitly set default” versus “inherit engine default” when preserving diffs matters
