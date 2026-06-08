# RMG Knowledge Base

This directory is the engineering knowledge base for Olden Era random map templates.

It documents:

- the `.rmg.json` authoring surface
- the runtime/resolved model derived from templates
- the generator pipeline that turns templates into maps
- the invariants and failure modes that make or break template validity
- the adjacent gameplay concepts that directly affect RMG correctness

This knowledge base is scoped to **RMG Core**. It is not a general `GameDB` encyclopedia.

## Labels Used In Every Page

- `Code Fact`: guaranteed or defined by inspected code
- `Observed In Shipped Templates`: seen in `external/map_templates/*.rmg.json`
- `Inference`: reasoned conclusion based on code and data

## Start Here

- [INDEX.md](./INDEX.md)
- [GLOSSARY.md](./GLOSSARY.md)
- [SCOPE.md](./SCOPE.md)
- [SOURCE-OF-TRUTH.md](./SOURCE-OF-TRUTH.md)
- [schema/conditional-fields.md](./schema/conditional-fields.md)
- [domain/conditional-generation-semantics.md](./domain/conditional-generation-semantics.md)
- [invariants/official-template-anomalies.md](./invariants/official-template-anomalies.md)

## Major Sections

- [architecture/](./architecture/)
- [schema/](./schema/)
- [domain/](./domain/)
- [invariants/](./invariants/)
- [reference-maps/](./reference-maps/)
- [templates/](./templates/)
- [editor/](./editor/)
- [plan/](./plan/)

## What This Is For

- give engineers a single source of truth for RMG authoring
- support future editor work
- surface hidden defaults and reference fragility
- explain sampled alternatives and conditional runtime fields
- separate true blocking errors from tolerated official-template compatibility quirks
- explain local template definitions and external dependencies

## What This Is Not For

- full game balance documentation
- exhaustive hero/unit/spell encyclopedias
- implementation of the editor itself
