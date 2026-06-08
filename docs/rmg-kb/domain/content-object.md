# Content Object

## Entity Card

- Name: `Content Object`
- Category: semantic placed-or-placeable map object
- Source Types: `Content`, `ContentPool`, `ContentDatabase`, mandatory content definitions
- Authoring Representation: `sid`, `variant`, content weights, pools, presets
- Runtime Representation: `Content` carrying `MapObjectDesc`, optional owner, values, and source pool
- References Out: ownership, limits, pools, mandatory content
- References In: content weights, pools, mandatory entries, limits
- Critical Invariants: object ids and variants must resolve
- Editor Risks: hiding the difference between pool-derived and mandatory objects

## Code Fact

Runtime content can come from:

- random pools
- mandatory content
- pure value placeholders

## Important Distinction

- mandatory content can carry explicit owner and placement rules
- pool-derived content generally does not carry explicit owner

## Inference

The editor should surface whether a content object is:

- pool-derived
- mandatory
- resource-specific
- owner-bearing
