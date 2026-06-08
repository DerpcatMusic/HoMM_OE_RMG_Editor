# Local Definition Usage

## Local Definition Types

- `zoneLayouts`
- `mandatoryContent`
- `contentCountLimits`
- `contentPools`
- `contentLists`

## Dependency Diagram

```mermaid
graph TD
  Zone --> ZoneLayout
  Zone --> MandatoryPreset
  Zone --> LimitPreset
  Zone --> ContentPool
  MandatoryPreset --> ContentList
  MandatoryPreset --> PlacementRule
  LimitPreset --> ContentList
  ContentPool --> ContentList
```

## Usage Rules

- these definitions are local to one template file
- same names across templates are not guaranteed equivalent
- rename/delete requires within-file reference updates only

## Observed In Shipped Templates

- all shipped templates define local `zoneLayouts`
- all shipped templates define local `mandatoryContent`
- all shipped templates define local `contentCountLimits`
