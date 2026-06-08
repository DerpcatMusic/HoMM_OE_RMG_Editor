# Index Based References

## Main-Object Index Consumers

- road targets of type `MainObject`
- faction-rule `Match`
- biome-rule `MatchMainObject`
- `crossroadsPosition`
- placement args in some main-object placement modes

## Why This Is Dangerous

Indices are authored as strings and are order-dependent.

## Reorder Safety

- not safe without full dependent rewrite

## Editor Rule

- never treat array position as stable identity in UI or storage transforms
