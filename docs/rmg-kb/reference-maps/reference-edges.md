# Reference Edges

## Reference Edge Records

| Source field | Source object type | Target object type | Resolution mode | Cardinality | Rename safety | Reorder safety |
| --- | --- | --- | --- | --- | --- | --- |
| `connection.from` | Connection | Zone | name lookup | one | unsafe without rewrite | n/a |
| `connection.to` | Connection | Zone | name lookup | one | unsafe without rewrite | n/a |
| `orientation.zeroAngleZone` | Orientation | Zone | name lookup | zero-or-one | unsafe without rewrite | n/a |
| `mainObject.faction.args` | Main Object | Main Object / Zone | index or zone+index | many | unsafe without rewrite | unsafe |
| `zone.*Biome.args` | Zone | Zone / Main Object | name or index | many | unsafe without rewrite | unsafe |
| `road.from.args` | Road | Main Object / Connection / Mandatory Content | type-specific parse | one | unsafe | unsafe for main-object targets |
| `road.to.args` | Road | Main Object / Connection / Mandatory Content | type-specific parse | one | unsafe | unsafe for main-object targets |
| `zone.layout` | Zone | Zone Layout | id lookup | one | unsafe without rewrite | n/a |
| `zone.mandatoryContent[]` | Zone | Mandatory Content Preset | id lookup | one sampled | unsafe without rewrite | n/a |
| `zone.contentCountLimits[]` | Zone | Content Count Limit Preset | id lookup | one sampled | unsafe without rewrite | n/a |

## Inference

The dangerous references are the ones that combine:

- free-text names
- hidden defaults
- positional indices
