# Encounter

## Entity Card

- Name: `Encounter`
- Category: runtime placement container
- Source Types: `Encounter`, `EncounterTemplate`, `ContentPlacer`, `Layout`
- Authoring Representation: indirect through pools, mandatory content, main objects, zone layouts
- Runtime Representation: placed encounter footprint with entrance, template, and optional roads/guards
- References Out: roads, guards, content slots
- References In: main objects, mandatory content, pools, placement rules
- Critical Invariants: encounter fitting and slot availability are authoritative runtime concerns
- Editor Risks: trying to author encounters directly instead of through supported higher-level inputs

## Code Fact

Encounters are the runtime placement units that receive:

- buildings
- pickups
- entrances
- guard semantics

## Inference

Encounters should be documented because many authored concepts eventually target encounter placement, but the editor should keep them as preview/debug artifacts rather than primary authored entities.
