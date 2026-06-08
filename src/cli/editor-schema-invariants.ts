import assert from "node:assert/strict";
import {
  EDITOR_SCHEMA_SECTIONS,
  getEditorField,
  getEditorSchema,
  listEditorFields,
  listEditorFieldsByEditLevel,
  listEditorFieldsBySourceStatus,
  type EditorFieldMetadata,
  type EditorSchemaSectionId,
} from "../core/index.js";

const REQUIRED_SECTIONS: readonly EditorSchemaSectionId[] = [
  "templateSettings",
  "gameRules",
  "winConditions",
  "zones",
  "connections",
  "roads",
  "contentPools",
  "mandatoryContent",
  "compatibility",
];

const REQUIRED_FIELD_IDS = [
  "template.gameMode",
  "template.displayWinCondition",
  "gameRules.heroCountMin",
  "gameRules.heroCountMax",
  "gameRules.heroCountIncrement",
  "gameRules.factionLawsExpModifier",
  "gameRules.astrologyExpModifier",
  "gameRules.bonuses",
  "gameRules.uniqueMagicCostModifiers",
  "winConditions.preset",
  "winConditions.classic",
  "winConditions.gladiatorArena",
  "winConditions.cityHold",
  "winConditions.tournament",
  "zone.name",
  "zone.size",
  "zone.layout",
  "zone.guardedContentPool",
  "zone.unguardedContentPool",
  "zone.resourcesContentPool",
  "zone.contentCountLimits",
  "zone.guardReactionDistribution",
  "zone.encounterHolesSettings",
  "zone.mandatoryContent",
  "mainObject.type",
  "mainObject.spawn",
  "connection.name",
  "connection.from",
  "connection.to",
  "connection.connectionType",
  "connection.portalPlacementRulesFrom",
  "road.type",
  "roadTarget.type",
  "contentPool.name",
  "contentPool.group.includeLists",
  "contentPool.group.content",
  "contentPool.bans",
  "contentList.content",
  "contentCountLimit.limits",
  "mandatoryContent.name",
  "mandatoryContent.entry.sid",
  "mandatoryContent.entry.rules",
  "connection.road",
  "connection.simTurnSquad",
  "connection.guardRandomization",
] as const;

function requireField(id: string): EditorFieldMetadata {
  const field = getEditorField(id);
  assert.ok(field, `Missing required editor schema field: ${id}`);
  return field;
}

function assertNonEmptyString(value: string, label: string): void {
  assert.equal(typeof value, "string", `${label} must be a string`);
  assert.ok(value.trim().length > 0, `${label} must be non-empty`);
}

const schema = getEditorSchema();
const fields = listEditorFields();

assert.equal(schema.version, 1, "Editor schema version must remain explicit.");
assert.deepEqual(
  EDITOR_SCHEMA_SECTIONS.map((section) => section.id),
  REQUIRED_SECTIONS,
  "Editor schema sections changed without updating invariants.",
);

const uniqueFieldIds = new Set<string>();
for (const field of fields) {
  assertNonEmptyString(field.id, "field.id");
  assertNonEmptyString(field.path, `${field.id}.path`);
  assertNonEmptyString(field.label, `${field.id}.label`);
  assertNonEmptyString(field.description, `${field.id}.description`);
  assertNonEmptyString(field.valueMeaning, `${field.id}.valueMeaning`);
  assert.equal(uniqueFieldIds.has(field.id), false, `Duplicate field id: ${field.id}`);
  uniqueFieldIds.add(field.id);

  assert.ok(REQUIRED_SECTIONS.includes(field.section), `${field.id} has unknown section ${field.section}`);
  assert.ok(field.sourceEvidence.length > 0, `${field.id} needs source evidence`);
  for (const evidence of field.sourceEvidence) {
    assertNonEmptyString(evidence, `${field.id}.sourceEvidence`);
  }

  if (field.kind === "enum") {
    assert.ok(field.validation?.allowedValues?.length, `${field.id} enum fields need allowedValues`);
  }

  if (field.editLevel === "firstClass") {
    assert.ok(field.mutation, `${field.id} first-class fields need a mutation route`);
  }
}

for (const section of REQUIRED_SECTIONS) {
  assert.ok(listEditorFields(section).length > 0, `${section} needs at least one field`);
}

for (const id of REQUIRED_FIELD_IDS) {
  requireField(id);
}

assert.equal(requireField("gameRules.factionLawsExpModifier").editLevel, "firstClass");
assert.equal(requireField("gameRules.factionLawsExpModifier").sourceStatus, "declared");
assert.equal(requireField("gameRules.astrologyExpModifier").editLevel, "firstClass");
assert.equal(requireField("gameRules.bonuses").sourceStatus, "declared");
assert.equal(requireField("gameRules.uniqueMagicCostModifiers").editLevel, "preserveOnly");
assert.equal(requireField("gameRules.uniqueMagicCostModifiers").sourceStatus, "sourceMismatch");

assert.equal(requireField("zone.guardReactionDistribution").validation?.exactLength, 6);
assert.equal(requireField("zone.guardedContentPool").sampledAlternative, true);
assert.equal(requireField("zone.unguardedContentPool").sampledAlternative, true);
assert.equal(requireField("zone.resourcesContentPool").sampledAlternative, true);
assert.equal(requireField("zone.contentCountLimits").sampledAlternative, true);
assert.equal(requireField("zone.mandatoryContent").sampledAlternative, true);

assert.equal(requireField("winConditions.cityHold").sourceStatus, "declaredUnverifiedRuntime");
assert.equal(requireField("winConditions.tournament").sourceStatus, "declaredUnverifiedRuntime");

assert.equal(requireField("contentPool.group.includeLists").validation?.reference, "contentList");
assert.equal(requireField("contentPool.group.content").validation?.reference, "rmgContentSid");
assert.equal(requireField("mandatoryContent.entry.sid").validation?.reference, "rmgContentSid");

assert.equal(requireField("connection.road").editLevel, "compatibility");
assert.equal(requireField("connection.road").sourceStatus, "officialObservedOnly");
assert.equal(requireField("connection.simTurnSquad").editLevel, "compatibility");
assert.equal(requireField("connection.guardRandomization").editLevel, "compatibility");

assert.ok(listEditorFieldsByEditLevel("firstClass").length > listEditorFieldsByEditLevel("preserveOnly").length);
assert.ok(listEditorFieldsBySourceStatus("sourceMismatch").length >= 3);

console.log(
  `editor-schema invariants: ${fields.length} fields, ${REQUIRED_SECTIONS.length} sections, ${listEditorFieldsByEditLevel("firstClass").length} first-class fields`,
);
