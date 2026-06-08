# Index Fragility

## Code Fact

Main-object references are positional and are parsed from strings like `"0"` and `"1"`.

## Where Main-Object Indices Are Consumed

- road targets of type `MainObject`
- faction rules using `Match`
- biome rules using `MatchMainObject`
- `crossroadsPosition`
- some placement arguments

## Break Example

Valid before reorder:

```json
"mainObjects": [
  { "type": "Spawn" },
  { "type": "City", "faction": { "type": "Match", "args": ["0"] } }
]
```

Broken by reorder:

```json
"mainObjects": [
  { "type": "City", "faction": { "type": "Match", "args": ["0"] } },
  { "type": "Spawn" }
]
```

Expected consequence:

- engine may still parse
- semantics silently change

## Editor Response

- main objects need stable editor ids
- any reorder must rewrite all dependent references
- raw reorder without rewrite should be blocked
