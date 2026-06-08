# Randomness And Sampling

## Code Fact

Sampling occurs in multiple places:

- template variant selection
- guarded pool id selection from zone list
- unguarded pool id selection from zone list
- resources pool id selection from zone list
- mandatory-content preset selection from zone list
- content-count-limit preset selection from zone list
- faction selection in `FromList`
- some biome selection flows
- effective connection type selection for `Default`, based on whether layout can place a valid gate
- fallback from serialized `Direct` to effective `Portal` if no valid gate exists

The generator samples exactly one variant before building zones and connections. Zone pool, mandatory-content, and content-limit arrays are alternative lists, not "include all" lists.

## Consequence

One template does not equal one resolved configuration.

An editor cannot prove every runtime outcome by inspecting only one sampled preview. It needs either deterministic seed previews, multi-seed checks, or explicit warnings for sampled/conditional fields.

## Editor Response

- preview should show sampled variant and sampled preset ids
- preview should show authored connection type and effective runtime type separately
- validation should check every authored alternative for reference integrity, even though only one alternative is used per generation
- validation should distinguish deterministic structural errors from sampled outcomes
- destructive mutations must update all alternatives, not only the currently previewed sampled id
