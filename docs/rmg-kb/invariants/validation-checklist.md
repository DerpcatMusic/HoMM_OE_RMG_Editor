# Validation Checklist

## Blocking Checks

- all zone names unique within variant
- all connection `from`/`to` names resolve
- all referenced layouts exist
- all referenced mandatory-content presets exist
- all referenced count-limit presets exist
- spawn objects have valid `spawn`
- owner fields parse
- road targets resolve in current zone context
- mandatory-content names used by road targets exist
- no faction-rule cycles
- no biome-rule cycles

## Advisory Checks

- unnamed connections that are likely to be referenced later
- duplicate connections with identical semantics
- dangling win-condition sub-fields
- string-versus-array schema inconsistencies
- use of fields present in shipped data but absent in inspected primary type

## Unsafe Edit Triggers

- main-object reorder
- zone rename
- connection rename
- mandatory-content rename
- preset rename/delete
