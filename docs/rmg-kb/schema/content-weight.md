# Content Weight

## Purpose

Document one weighted content selector entry. `ContentWeight` is the common leaf used by content lists, content pool groups, and random mandatory content entries.

## Source-of-Truth Types/Files

- `GameEngineMapGenerator/MapGenerator/ContentWeight.cs`
- `GameEngineMapGenerator/MapGenerator/ContentWeightsTable.cs`
- `GameEngineMapGenerator/MapGenerator/ContentPool.cs`
- `GameEngineMapGenerator/MapGenerator/ContentTask.cs`
- `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs`
- `src/core/rmg/rmgTypes.ts`

## Fields Table

| Field name | Container type | Value type | Default | Requiredness | Allowed values | Resolution behavior | Reference target | Failure mode | Example |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `sid` | content weight | string | none | required | content/object sid | grouped by sid and resolved through `ContentDatabase` | content catalog | missing sid gives no valid candidate or runtime failure depending path | `"resource_gold"` |
| `variant` | content weight | int | C# default `0`; authored data often omits or uses `-1` | optional | `-1` for all/default, or concrete variant index | controls exact or wildcard variant weight slot | object variants | invalid variant ignored by weight combine path | `-1` |
| `biome` | content weight | string | null/empty | optional | biome sid | creates biome-specific weight slot | biome catalog | unknown biome causes entry to be ignored | `"Sand"` |
| `weight` | content weight | float | C# default `0`; authored data should set positive values | required in practice | non-negative float | participates in weighted selection after group normalization | none | zero effective selection chance | `100` |

## Runtime Weight Resolution

- `ContentWeightsTable` first combines all entries by `sid`.
- For each sid, it allocates weight slots by variant and biome.
- Biome names are resolved through the content database. Unknown biome ids cause the entry to be skipped.
- Variant-specific entries apply only when `variant < variantCount`.
- For each actual object variant and biome, runtime weight priority is:
- Exact variant plus exact biome.
- Wildcard variant plus exact biome, multiplied by the content database's natural variant weight.
- Exact variant plus wildcard biome.
- Wildcard variant plus wildcard biome, multiplied by the content database's natural variant weight.
- After candidates are computed for a group, per-biome weights are normalized and multiplied by the pool group weight.
- Bans and variant validation remove candidates after weights are combined.

## Consumer-Specific Meaning

- In a content list, a `ContentWeight` is reusable source data.
- In a content pool group, `weight` affects random selection probability.
- In random mandatory content, `weight` affects the one mandatory object rolled for that entry.
- In content count limits, included content-list entries are converted to `ContentID`; `weight` is discarded.

## Variant Semantics

- `variant = -1` is treated as a wildcard/default weight slot in the weights table.
- For objects with variants, wildcard variant weights are distributed through the content database's natural variant weights.
- For direct mandatory content with `sid`, the generator calls `GetMapObjectDescRollSpecific(sid, variant, random)`, so variant behavior is content-DB-specific and not identical to weighted wildcard selection.
- The editor should not assume `-1` means "variant 0".

## Value and Guard Interaction

- `ContentWeight` controls selection probability only.
- Object goods value and guard value come from content DB unless overridden by template `valueOverrides`.
- Pool `valueDistribution` and random content budget use goods value, not `ContentWeight.weight`.
- Guard creation uses guard value, not `ContentWeight.weight`.

## Validation Rules

- `sid` should resolve to a content catalog object.
- `variant` should be `-1` or within the object's variant range.
- `biome`, if set, should resolve to a known biome sid.
- `weight` should be positive for selectable random content.
- Editor should flag `weight: 0` as intentional-disable, not as a normal playable weight.

## Common Failure Modes

- Expecting higher `weight` to increase object value or guard strength. It only affects selection odds.
- Setting a biome-specific entry with an invalid biome id; C# skips it.
- Using concrete variant ids for an object with fewer variants; the entry is ignored.
- Assuming list weights matter in content count limits.
- Combining several entries for the same sid/variant/biome and expecting additive behavior. The later slot assignment wins inside the sid group.

## Example Snippets From Shipped Data

```json
{ "sid": "resource_gold", "weight": 250 }
```

```json
{ "sid": "random_item_epic", "variant": -1, "weight": 100 }
```

```json
{ "sid": "pandora_box", "biome": "Sand", "weight": 2 }
```

## Editor Implications

- Content browsers should show sid, actual display name, available variants, object type, value, guard value, and compatible biomes.
- Weight editors should show effective probability only in context of the containing pool/group/biome, not as an absolute chance.
- For count-limit UIs, display included list entries as ids and hide/prohibit weight editing because weights are discarded there.
- Preview should show when an entry is skipped by invalid biome, invalid variant, bans, or zero effective weight.
