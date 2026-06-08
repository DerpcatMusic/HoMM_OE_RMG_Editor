# Placement Rule

## Purpose

Document the rule DSL used for mandatory content and portal placement.

## Source-of-Truth Types/Files

- `PlacementRule.cs`
- `PlacementRuleType.cs`
- `PlacementRuleHandler.cs`
- `RuleParseUtils.cs`
- shipped templates

## Fields Table

| Field name | Container type | Value type | Default | Requiredness | Allowed values | Resolution behavior | Reference target | Failure mode | Example |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `type` | placement rule | enum string | none | required | `Random`, `Sid`, `MainObject`, `Crossroads`, `Connection`, `Road`, `MandatoryContent` | parsed to runtime rule | depends on type | parse failure | `"Connection"` |
| `args[]` | placement rule | array | none | conditional | strings | interpreted by rule type | sid, names, indices | parse failure | `["prison"]` |
| `target` | placement rule | float | C# numeric default | optional | float | clamped to normalized distance target | none | weak/no scoring if weight is zero | `0.5` |
| `targetMin` | placement rule | float | C# numeric default | optional | float | lower bound for random normalized target when paired with valid `targetMax` | none | falls back to `target` path if invalid | `0.5` |
| `targetMax` | placement rule | float | C# numeric default | optional | float | upper bound for random normalized target when `targetMax >= targetMin && targetMax > 0` | none | falls back to `target` path if invalid | `0.5` |
| `weight` | placement rule | float | C# numeric default | optional | float | scales placement score contribution | none | `0` means no scoring effect | `1` |

## Defaults

- `PlacementRule.cs` does not define explicit field initializers. Missing numeric values deserialize to C# numeric defaults unless another loader layer injects values.

## Allowed Enum/Rule Values Actually Used In Shipped Templates

- `Sid`
- `MainObject`
- `Crossroads`
- `Connection`
- `Road`
- `MandatoryContent`

## Resolution/Derivation Behavior

- rules are parsed into runtime references by `PlacementRuleHandler.TryParseRule`
- some targets only make sense within a given zone context
- with no parsed rules, candidate points are shuffled
- with parsed rules, candidate points receive a random base score plus each rule's distance/random contribution, then lower scores are tried first
- `targetMax >= targetMin && targetMax > 0` rolls a random target in `[targetMin, targetMax]`, clamped to `[0, 1]`; otherwise `target` is used and clamped to `[0, 1]`
- distance rules add `weight * abs(normalizedDistance - resolvedTarget)`
- `Random` uses no args and adds random noise scaled by `weight`
- `Sid` requires `args[0]` as an object SID and scores against already placed mandatory content in the same zone with that resolved SID
- `MainObject` requires `args[0]` as a valid zone-local main-object index
- `Crossroads` uses no args and scores against the zone crossroads
- `Connection` requires `args[0]` as a connection name that exists, touches the current zone, and is not `Proximity`
- `Road` uses no args and scores against generated road-map tiles in the zone
- `MandatoryContent` requires `args[0]` as an already expanded mandatory-content entry name in the current zone and can create placement dependency ordering

## External References Used

- main-object indices
- connection names
- mandatory-content names
- object `sid`

## Validation Rules

- type-specific args must resolve
- unresolved rules should be treated as blocking for the owning content/portal config

## Common Failure Modes

- using a main-object index after reorder
- using a connection name from another zone

## Example Snippets From Shipped Templates

```json
{ "type": "Sid", "args": ["prison"], "targetMin": 0.5, "targetMax": 0.5, "weight": 1 }
```

## Editor Implications

- one custom builder per rule type is preferable to generic free-text editing
- portal rule builders must use the endpoint zone context: `portalPlacementRulesFrom` in the `from` zone and `portalPlacementRulesTo` in the `to` zone
- mandatory-content rule builders must validate against the selected/expanded mandatory preset alternatives for the owning zone
- roads are not placement rules; `PlacementRuleType.Road` only means "bias placement toward already generated road tiles"
