# Mandatory Content Entry

## Purpose

Document one mandatory content item inside a preset.

## Source-of-Truth Types/Files

- `RandomMapTemplate.MandatoryContent`
- `MapDescription.MandatoryContent`
- `MapDescriptionBuilder.cs`
- shipped templates

## Fields Table

| Field name | Container type | Value type | Default | Requiredness | Allowed values | Resolution behavior | Reference target | Failure mode | Example |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `name` | entry | string | none | optional but important | local content name | copied into runtime | road/other refs | unaddressable if unnamed | `"name_portal_gate_center"` |
| `includeLists[]` | entry | array | empty | optional | content-list ids | expanded into inline content | content-list defs | unresolved list ids | `["list_a"]` |
| `content[]` | entry | array | empty | optional | `ContentWeight` entries | used directly or merged with include lists | content ids | empty content set | `[{ "sid": "prison" }]` |
| `sid` | entry | string | none | optional | object id | direct content reference | object id | bad object sid | `"tavern"` |
| `variant` | entry | int | `-1` | optional | int | copied/resolved in content DB | object variant | bad variant fallback | `-1` |
| `rules[]` | entry | array | none | optional | placement rules | parsed/resolved | multiple refs | placement parse failure | `[{ "type": "Road" }]` |
| `designatedEncounter` | entry | bool | `true` | optional | bool | copied into runtime | none | placement semantics drift | `true` |
| `soloEncounter` | entry | bool | `false` | optional | bool | copied into runtime | none | encounter packing drift | `true` |
| `isGuarded` | entry | bool | `true` | optional | bool | copied into runtime | none | wrong slot class | `false` |
| `isMine` | entry | bool | `false` | optional | bool | copied into runtime | none | resource ownership drift | `true` |
| `owner` | entry | enum string | none | optional | player side | parsed to runtime owner | player side | hard parse failure | `"Player1"` |

## Defaults

- `variant = -1`
- `designatedEncounter = true`
- `isGuarded = true`

## Allowed Enum/Rule Values Actually Used In Shipped Templates

- rule types observed: `MainObject`, `Crossroads`, `Road`, `Connection`, `Sid`

## Resolution/Derivation Behavior

- if `sid` is null, content may be assembled from `content[]` plus `includeLists[]`
- if `owner` is present, it is attached to placed content objects

## External References Used

- content-list ids
- object sids
- placement-rule refs
- player sides

## Validation Rules

- an entry should have a meaningful way to produce content
- `owner` must parse if present

## Common Failure Modes

- unnamed entries that later need road targeting
- using include lists that do not exist locally/globally

## Example Snippets From Shipped Templates

```json
{
  "name": "name_portal_gate_center",
  "sid": "prison",
  "rules": [ { "type": "Road" } ],
  "isGuarded": true
}
```

## Editor Implications

- mandatory content names should be treated as first-class identities
