# Global Bans

## Purpose

Document template-wide bans that shape available heroes, content, and magic.

## Source-of-Truth Types/Files

- `RandomMapTemplate.GlobalBans`
- `TemplateContext.cs`
- `Generator.cs`

## Fields Table

| Field name | Container type | Value type | Default | Requiredness | Allowed values | Resolution behavior | Reference target | Failure mode | Example |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `magics[]` | global bans | array | empty | optional | magic ids | copied into `BanInfo` | magic ids | ban not applied if bad id | `[]` |
| `items[]` | global bans | array | empty | optional | item ids | copied into `BanInfo` | item ids | ban not applied | `[]` |
| `skills[]` | global bans | array | empty | optional | skill ids | copied into `BanInfo` | skill ids | ban not applied | `[]` |
| `heroes[]` | global bans | array | empty | optional | hero ids | copied into `BanInfo` | hero ids | hero pool mismatch | `["pvp_promo_hero_1"]` |
| `units[]` | global bans | array | empty | optional | unit ids | copied into `BanInfo` | unit ids | ban not applied | `[]` |

## Defaults

- all lists empty

## Resolution/Derivation Behavior

- converted into `BanInfo`
- affects hero pool counting and content availability

## Validation Rules

- ids should exist in current game data

## Common Failure Modes

- banning heroes and then assuming unchanged hero pool size

## Example Snippets From Shipped Templates

```json
"globalBans": {
  "heroes": ["pvp_promo_hero_1"]
}
```

## Editor Implications

- show resulting hero-pool impact, not just raw ids
