# Name Based References

## Zone Name Consumers

- `connection.from`
- `connection.to`
- `orientation.zeroAngleZone`
- biome rules of type `MatchZone`
- faction rules that specify another zone
- placement rules targeting named connections or content indirectly through current-zone context

## Connection Name Consumers

- road targets of type `Connection`
- some placement arguments for main-object placement

## Mandatory Content Name Consumers

- road targets of type `MandatoryContent`
- placement rules of type `MandatoryContent`

## Rename Danger

Any name-based rename without a global reference update is unsafe.
