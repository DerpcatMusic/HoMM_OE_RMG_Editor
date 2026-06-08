import assert from "node:assert/strict";
import {
  applyEditorAction,
  createMinimalPlayableTemplate,
  createTransactionHistory,
  resolveEditorPicker,
  type RmgTemplate,
} from "../core/index.js";

function expectOk(label: string, result: ReturnType<typeof applyEditorAction>): void {
  assert.equal(
    result.ok,
    true,
    `${label} failed: ${result.diagnostics.map((item) => `${item.code}: ${item.message}`).join("; ")}`,
  );
  assert.ok(result.changes.length > 0, `${label} produced no changes`);
}

let template: RmgTemplate = createMinimalPlayableTemplate({
  name: "Editor Action Invariants",
  playerCount: 2,
});
let history = createTransactionHistory();

const renameZone = applyEditorAction({
  template,
  history,
  transactionLabel: "Rename spawn zone",
  action: {
    type: "field.update",
    fieldId: "zone.name",
    value: "Spawn-X",
    selection: {
      variantIndex: 0,
      zone: { zoneName: "Spawn-A" },
    },
  },
});
expectOk("zone.name field update", renameZone);
assert.equal(renameZone.transactionPushed, true);
assert.ok(renameZone.history);
template = renameZone.value;
history = renameZone.history;

assert.equal(template.variants?.[0]?.zones?.some((zone) => zone.name === "Spawn-X"), true);
assert.equal(template.variants?.[0]?.connections?.[0]?.from, "Spawn-X");
assert.equal(template.variants?.[0]?.orientation?.zeroAngleZone, "Spawn-X");

const setConnectionType = applyEditorAction({
  template,
  history,
  options: { normalizePortalDefaults: true },
  action: {
    type: "field.update",
    fieldId: "connection.connectionType",
    value: "Portal",
    selection: {
      variantIndex: 0,
      connection: { connectionName: "Spawn-A-Center" },
    },
  },
});
expectOk("connection.connectionType field update", setConnectionType);
template = setConnectionType.value;
history = setConnectionType.history ?? history;
assert.equal(template.variants?.[0]?.connections?.[0]?.connectionType, "Portal");
assert.equal(template.variants?.[0]?.connections?.[0]?.portalFromEnabled, true);
assert.equal(template.variants?.[0]?.connections?.[0]?.portalToEnabled, true);

const setZonePool = applyEditorAction({
  template,
  history,
  action: {
    type: "field.update",
    fieldId: "zone.guardedContentPool",
    value: ["content_pool_probe_guarded"],
    selection: {
      variantIndex: 0,
      zone: { zoneName: "Spawn-X" },
    },
  },
});
expectOk("zone.guardedContentPool field update", setZonePool);
template = setZonePool.value;
history = setZonePool.history ?? history;
const spawnX = template.variants?.[0]?.zones?.find((zone) => zone.name === "Spawn-X");
assert.deepEqual(spawnX?.guardedContentPool, ["content_pool_probe_guarded"]);

const setHeroCount = applyEditorAction({
  template,
  history,
  action: {
    type: "field.update",
    fieldId: "gameRules.heroHireBan",
    value: true,
  },
});
expectOk("gameRules.heroHireBan field update", setHeroCount);
template = setHeroCount.value;
history = setHeroCount.history ?? history;
assert.equal(template.gameRules?.heroHireBan, true);

template.mandatoryContent = [{ name: "mandatory_probe", content: [{ name: "old_entry", sid: "old_sid" }] }];
const setMandatoryEntrySid = applyEditorAction({
  template,
  history,
  action: {
    type: "field.update",
    fieldId: "mandatoryContent.entry.sid",
    value: "new_sid",
    selection: {
      mandatoryContentPreset: { presetName: "mandatory_probe" },
      mandatoryContentEntryIndex: 0,
    },
  },
});
expectOk("mandatoryContent.entry.sid field update", setMandatoryEntrySid);
template = setMandatoryEntrySid.value;
history = setMandatoryEntrySid.history ?? history;
assert.equal(template.mandatoryContent?.[0]?.content?.[0]?.sid, "new_sid");

const addZone = applyEditorAction({
  template,
  history,
  action: {
    type: "zone.add",
    input: {
      variantIndex: 0,
      zone: { name: "Extra-Zone", size: 1 },
    },
  },
});
expectOk("zone.add entity action", addZone);
template = addZone.value;
history = addZone.history ?? history;
assert.equal(template.variants?.[0]?.zones?.some((zone) => zone.name === "Extra-Zone"), true);

const blockedPreserveOnly = applyEditorAction({
  template,
  history,
  action: {
    type: "field.update",
    fieldId: "gameRules.uniqueMagicCostModifiers",
    value: [],
  },
});
assert.equal(blockedPreserveOnly.ok, false);
assert.equal(blockedPreserveOnly.transactionPushed, false);
assert.equal(blockedPreserveOnly.diagnostics.some((item) => item.code === "editorAction.field.preserveOnly"), true);

const zonePicker = resolveEditorPicker({
  template,
  fieldId: "connection.from",
  selection: { variantIndex: 0 },
});
assert.equal(zonePicker.diagnostics.some((item) => item.severity === "error"), false);
assert.equal(zonePicker.options.some((option) => option.id === "Spawn-X"), true);
assert.equal(zonePicker.options.some((option) => option.id === "Extra-Zone"), true);

const connectionTypePicker = resolveEditorPicker({
  template,
  fieldId: "connection.connectionType",
});
assert.equal(connectionTypePicker.options.some((option) => option.id === "Portal"), true);
assert.equal(connectionTypePicker.options.some((option) => option.id === "Direct"), true);

assert.ok(history.index >= 0, "history should contain successful editor actions");

console.log(
  `editor-action invariants: template zones=${template.variants?.[0]?.zones?.length ?? 0}, historyFrames=${history.stack.length}, pickerZones=${zonePicker.options.length}`,
);
