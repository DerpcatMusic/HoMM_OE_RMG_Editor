# Product

## Register

product

## Users

RMG template authors, modders, and technical players editing Heroes of Might and Magic: Olden Era random-map templates. They use the tool while comparing official `.rmg.json` files, Core game data, validation diagnostics, and generated map structure.

## Product Purpose

This product helps users inspect, create, and safely edit Olden Era RMG templates without hand-editing fragile JSON. Success means users can build a playable template from scratch, edit zones/connections/content pools with confidence, understand validation problems, and preserve game-compatible source data.

## Brand Personality

Precise, workshop-like, source-grounded. The interface should feel like a technical cartography bench: dense enough for serious work, but organized enough that users can keep complex map-generator rules in their head.

## Anti-references

Do not look like a generic SaaS dashboard, a purple AI tool, a fantasy fan-site skin, or a single giant JSON editor. Avoid decorative medieval styling that reduces readability. Avoid hiding complex RMG state behind vague simplified controls.

## Design Principles

- Source truth stays visible: fields, pickers, diagnostics, and raw compatibility status should explain where their confidence comes from.
- Small focused surfaces beat monoliths: zones, connections, pools, roads, rules, and validation each need their own workspace.
- Safe edits first: route UI commands through schema/actions/mutations rather than direct JSON assignment.
- Dense, not cramped: support expert workflows with compact information, clear hierarchy, and responsive layouts.
- Preserve unknowns: compatibility and preserve-only fields should be visible and round-trippable without pretending they are fully understood.

## Accessibility & Inclusion

Default target is WCAG 2.2 AA for contrast, keyboard navigation, visible focus, and reduced-motion support. The product should not rely on color alone to communicate validation state, field risk, graph status, or command success.
