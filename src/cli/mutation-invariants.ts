import assert from "node:assert/strict";
import {
  DEFAULT_ZONE_LAYOUT,
  addContentPoolBan,
  addContentPoolGroup,
  canRedo,
  canUndo,
  cloneCoreContentPoolToLocal,
  createTransactionHistory,
  getCurrentTemplate,
  moveContentPoolBan,
  moveContentPoolGroup,
  pushTransaction,
  redo,
  removeContentCountLimitPreset,
  removeContentList,
  removeContentPoolBan,
  removeContentPoolGroup,
  removeLocalContentPool,
  removeMandatoryContentPreset,
  removeZoneLayout,
  renameContentCountLimitPreset,
  renameContentList,
  renameLocalContentPool,
  renameMandatoryContentPreset,
  renameZoneLayout,
  resolveTemplate,
  undo,
  updateTemplateSettings,
  updateContentPoolBan,
  updateContentPoolGroup,
  updateContentPoolValueDistribution,
  validateTemplateShape,
  type MutationResult,
  type RmgTemplate,
} from "../core/index.js";

type TestFn = () => void;

const tests: Array<{ name: string; fn: TestFn }> = [];

function test(name: string, fn: TestFn): void {
  tests.push({ name, fn });
}

function fixtureTemplate(): RmgTemplate {
  return {
    name: "Mutation Invariants",
    variants: [
      {
        zones: [
          {
            name: "A",
            layout: "layout_old",
            guardedContentPool: ["pool_old", "pool_keep"],
            unguardedContentPool: ["pool_old"],
            resourcesContentPool: ["pool_other"],
          },
        ],
        connections: [],
      },
    ],
    zoneLayouts: [{ name: "layout_old" }, { name: "layout_keep" }],
    contentPools: [
      {
        name: "pool_old",
        valueDistribution: { priceBounds: [1000], weights: [1, 2] },
        groups: [
          {
            weight: 1,
            includeLists: ["list_old", "list_keep"],
            content: [{ sid: "object_a", weight: 1 }],
          },
        ],
        bans: [{ sid: "ban_a" }],
      },
      {
        name: "pool_other",
        groups: [{ weight: 1, includeLists: ["list_old"] }],
      },
    ],
    contentLists: [
      { name: "list_old", content: [{ sid: "object_a", weight: 1 }] },
      { name: "list_keep", content: [{ sid: "object_b", weight: 1 }] },
    ],
  };
}

function fixtureCoreContentPools() {
  return {
    byName: new Map([
      [
        "core_pool",
        {
          name: "core_pool",
          sourcePath: "/core/pools.json",
          value: {
            name: "core_pool",
            valueDistribution: { priceBounds: [1000], weights: [1, 2] },
            groups: [{ weight: 3, includeLists: ["list_old"], content: [{ sid: "object_core", weight: 7 }] }],
            bans: [{ sid: "banned_object" }],
          },
        },
      ],
    ]),
    duplicates: [],
  };
}

function fixtureLegacyScalarPresetTemplate(): RmgTemplate {
  return {
    name: "Legacy Scalar Presets",
    zoneLayouts: [{ name: "layout_old" }],
    variants: [
      {
        zones: [
          {
            name: "A",
            layout: "layout_old",
            guardedContentPool: ["pool_guarded"],
            unguardedContentPool: ["pool_unguarded"],
            resourcesContentPool: ["pool_resources"],
            mandatoryContent: "mandatory_old",
            contentCountLimits: "limit_old",
          },
        ],
        connections: [],
      },
    ],
    mandatoryContent: [{ name: "mandatory_old", content: [{ name: "content_a", sid: "chest" }] }],
    contentCountLimits: [{ name: "limit_old", limits: [{ sid: "chest", maxCount: 1 }] }],
  } as unknown as RmgTemplate;
}

function fixtureGameDataForLegacyScalarTemplate() {
  return {
    zoneLayouts: { byName: new Map(), duplicates: [] },
    contentPools: {
      byName: new Map([
        ["pool_guarded", { name: "pool_guarded", sourcePath: "/core/pools.json", value: { name: "pool_guarded" } }],
        ["pool_unguarded", { name: "pool_unguarded", sourcePath: "/core/pools.json", value: { name: "pool_unguarded" } }],
        ["pool_resources", { name: "pool_resources", sourcePath: "/core/pools.json", value: { name: "pool_resources" } }],
      ]),
      duplicates: [],
    },
    contentLists: { byName: new Map(), duplicates: [] },
  };
}

function expectOk<T>(label: string, result: MutationResult<T>): void {
  assert.equal(
    result.ok,
    true,
    `${label} failed: ${result.diagnostics.map((item) => `${item.code}: ${item.message}`).join("; ")}`,
  );
  assert.ok(result.changes.length > 0, `${label} produced no changes`);
}

test("renameContentList rewrites every template-local pool includeLists reference", () => {
  const result = renameContentList({
    template: fixtureTemplate(),
    list: { listName: "list_old" },
    newName: "list_new",
  });
  expectOk("renameContentList", result);

  assert.equal(result.value.contentLists?.[0]?.name, "list_new");
  assert.deepEqual(result.value.contentPools?.[0]?.groups?.[0]?.includeLists, ["list_new", "list_keep"]);
  assert.deepEqual(result.value.contentPools?.[1]?.groups?.[0]?.includeLists, ["list_new"]);
});

test("removeContentList blocks referenced removals unless cascade is enabled", () => {
  const blocked = removeContentList({
    template: fixtureTemplate(),
    list: { listName: "list_old" },
    cascade: false,
  });
  assert.equal(blocked.ok, false);
  assert.equal(blocked.diagnostics.some((item) => item.code === "mutation.contentList.hasReferences"), true);
  assert.deepEqual(blocked.value.contentPools?.[0]?.groups?.[0]?.includeLists, ["list_old", "list_keep"]);

  const cascaded = removeContentList({
    template: fixtureTemplate(),
    list: { listName: "list_old" },
    cascade: true,
  });
  expectOk("removeContentList", cascaded);
  assert.deepEqual(cascaded.value.contentLists?.map((list) => list.name), ["list_keep"]);
  assert.deepEqual(cascaded.value.contentPools?.[0]?.groups?.[0]?.includeLists, ["list_keep"]);
  assert.deepEqual(cascaded.value.contentPools?.[1]?.groups?.[0]?.includeLists, []);
});

test("local content pool rename and removal rewrite zone pool alternatives", () => {
  const renamed = renameLocalContentPool({
    template: fixtureTemplate(),
    pool: { poolName: "pool_old" },
    newName: "pool_new",
  });
  expectOk("renameLocalContentPool", renamed);
  assert.deepEqual(renamed.value.variants?.[0]?.zones?.[0]?.guardedContentPool, ["pool_new", "pool_keep"]);
  assert.deepEqual(renamed.value.variants?.[0]?.zones?.[0]?.unguardedContentPool, ["pool_new"]);

  const blocked = removeLocalContentPool({
    template: fixtureTemplate(),
    pool: { poolName: "pool_old" },
    cascade: false,
  });
  assert.equal(blocked.ok, false);
  assert.equal(blocked.diagnostics.some((item) => item.code === "mutation.localContentPool.hasReferences"), true);

  const cascaded = removeLocalContentPool({
    template: fixtureTemplate(),
    pool: { poolName: "pool_old" },
    cascade: true,
  });
  expectOk("removeLocalContentPool", cascaded);
  assert.deepEqual(cascaded.value.contentPools?.map((pool) => pool.name), ["pool_other"]);
  assert.deepEqual(cascaded.value.variants?.[0]?.zones?.[0]?.guardedContentPool, ["pool_keep"]);
  assert.deepEqual(cascaded.value.variants?.[0]?.zones?.[0]?.unguardedContentPool, []);
});

test("cloneCoreContentPoolToLocal deep-copies a Core pool with a safe local name", () => {
  const result = cloneCoreContentPoolToLocal({
    template: fixtureTemplate(),
    contentPools: fixtureCoreContentPools(),
    sourcePoolName: "core_pool",
  });
  expectOk("cloneCoreContentPoolToLocal", result);

  const clonedPool = result.value.contentPools?.[2];
  assert.equal(clonedPool?.name, "core_pool_local");
  assert.deepEqual(clonedPool?.groups?.[0]?.content, [{ sid: "object_core", weight: 7 }]);
  assert.deepEqual(clonedPool?.valueDistribution, { priceBounds: [1000], weights: [1, 2] });

  const coreEntry = fixtureCoreContentPools().byName.get("core_pool");
  assert.ok(coreEntry);
  if (clonedPool?.groups?.[0]?.content?.[0]) {
    clonedPool.groups[0].content[0].sid = "mutated_clone";
  }
  assert.equal(coreEntry.value.groups?.[0]?.content?.[0]?.sid, "object_core");
});

test("cloneCoreContentPoolToLocal rejects explicit duplicate local names", () => {
  const result = cloneCoreContentPoolToLocal({
    template: fixtureTemplate(),
    contentPools: fixtureCoreContentPools(),
    sourcePoolName: "core_pool",
    localName: "pool_old",
  });

  assert.equal(result.ok, false);
  assert.equal(result.diagnostics.some((item) => item.code === "mutation.localContentPool.duplicateName"), true);
});

test("content pool group mutations add, update, move, and remove individual groups", () => {
  const added = addContentPoolGroup({
    template: fixtureTemplate(),
    pool: { poolName: "pool_old" },
    insertIndex: 1,
    group: { weight: 9, includeLists: ["list_added"], content: [{ sid: "object_added", weight: 4 }] },
  });
  expectOk("addContentPoolGroup", added);
  assert.equal(added.value.contentPools?.[0]?.groups?.length, 2);
  assert.equal(added.value.contentPools?.[0]?.groups?.[1]?.weight, 9);

  const updated = updateContentPoolGroup({
    template: added.value,
    pool: { poolName: "pool_old" },
    groupIndex: 1,
    settings: { weight: 10, includeLists: null, content: [{ sid: "object_updated", weight: 8 }] },
  });
  expectOk("updateContentPoolGroup", updated);
  assert.equal(updated.value.contentPools?.[0]?.groups?.[1]?.weight, 10);
  assert.equal("includeLists" in (updated.value.contentPools?.[0]?.groups?.[1] ?? {}), false);
  assert.deepEqual(updated.value.contentPools?.[0]?.groups?.[1]?.content, [{ sid: "object_updated", weight: 8 }]);

  const moved = moveContentPoolGroup({
    template: updated.value,
    pool: { poolName: "pool_old" },
    fromIndex: 1,
    toIndex: 0,
  });
  expectOk("moveContentPoolGroup", moved);
  assert.equal(moved.value.contentPools?.[0]?.groups?.[0]?.weight, 10);

  const removed = removeContentPoolGroup({
    template: moved.value,
    pool: { poolName: "pool_old" },
    groupIndex: 0,
  });
  expectOk("removeContentPoolGroup", removed);
  assert.equal(removed.value.contentPools?.[0]?.groups?.length, 1);
  assert.deepEqual(removed.value.contentPools?.[0]?.groups?.[0]?.includeLists, ["list_old", "list_keep"]);
});

test("content pool value distribution mutation validates, sets, and clears distribution", () => {
  const invalid = updateContentPoolValueDistribution({
    template: fixtureTemplate(),
    pool: { poolName: "pool_old" },
    valueDistribution: { priceBounds: [1000, 500], weights: [1, 2] },
  });
  assert.equal(invalid.ok, false);
  assert.equal(
    invalid.diagnostics.some((item) => item.code === "mutation.contentPoolValueDistribution.invalidWeightCount"),
    true,
  );
  assert.equal(
    invalid.diagnostics.some((item) => item.code === "mutation.contentPoolValueDistribution.boundsNotAscending"),
    true,
  );

  const updated = updateContentPoolValueDistribution({
    template: fixtureTemplate(),
    pool: { poolName: "pool_old" },
    valueDistribution: { priceBounds: [500, 1500], weights: [1, 3, 2] },
  });
  expectOk("updateContentPoolValueDistribution", updated);
  assert.deepEqual(updated.value.contentPools?.[0]?.valueDistribution, { priceBounds: [500, 1500], weights: [1, 3, 2] });

  const cleared = updateContentPoolValueDistribution({
    template: updated.value,
    pool: { poolName: "pool_old" },
    valueDistribution: null,
  });
  expectOk("updateContentPoolValueDistribution.clear", cleared);
  assert.equal("valueDistribution" in (cleared.value.contentPools?.[0] ?? {}), false);
});

test("content pool ban mutations add, update, move, and remove individual bans", () => {
  const added = addContentPoolBan({
    template: fixtureTemplate(),
    pool: { poolName: "pool_old" },
    ban: { sid: "ban_b", variant: 1 },
  });
  expectOk("addContentPoolBan", added);
  assert.deepEqual(added.value.contentPools?.[0]?.bans, [{ sid: "ban_a" }, { sid: "ban_b", variant: 1 }]);

  const updated = updateContentPoolBan({
    template: added.value,
    pool: { poolName: "pool_old" },
    banIndex: 1,
    ban: { sid: "ban_c" },
  });
  expectOk("updateContentPoolBan", updated);
  assert.deepEqual(updated.value.contentPools?.[0]?.bans, [{ sid: "ban_a" }, { sid: "ban_c" }]);

  const moved = moveContentPoolBan({
    template: updated.value,
    pool: { poolName: "pool_old" },
    fromIndex: 1,
    toIndex: 0,
  });
  expectOk("moveContentPoolBan", moved);
  assert.deepEqual(moved.value.contentPools?.[0]?.bans, [{ sid: "ban_c" }, { sid: "ban_a" }]);

  const removed = removeContentPoolBan({
    template: moved.value,
    pool: { poolName: "pool_old" },
    banIndex: 0,
  });
  expectOk("removeContentPoolBan", removed);
  assert.deepEqual(removed.value.contentPools?.[0]?.bans, [{ sid: "ban_a" }]);
});

test("zone layout rename and removal rewrite zone layout references", () => {
  const renamed = renameZoneLayout({
    template: fixtureTemplate(),
    layout: { layoutName: "layout_old" },
    newName: "layout_new",
  });
  expectOk("renameZoneLayout", renamed);
  assert.equal(renamed.value.zoneLayouts?.[0]?.name, "layout_new");
  assert.equal(renamed.value.variants?.[0]?.zones?.[0]?.layout, "layout_new");

  const blocked = removeZoneLayout({
    template: fixtureTemplate(),
    layout: { layoutName: "layout_old" },
    cascade: false,
  });
  assert.equal(blocked.ok, false);
  assert.equal(blocked.diagnostics.some((item) => item.code === "mutation.zoneLayout.hasReferences"), true);

  const cascaded = removeZoneLayout({
    template: fixtureTemplate(),
    layout: { layoutName: "layout_old" },
    cascade: true,
  });
  expectOk("removeZoneLayout", cascaded);
  assert.deepEqual(cascaded.value.zoneLayouts?.map((layout) => layout.name), ["layout_keep"]);
  assert.equal(cascaded.value.variants?.[0]?.zones?.[0]?.layout, DEFAULT_ZONE_LAYOUT);
});

test("legacy scalar zone preset fields resolve and mutations normalize them", () => {
  const template = fixtureLegacyScalarPresetTemplate();
  const shapeDiagnostics = validateTemplateShape(template, "/templates/legacy-scalar.rmg.json");
  assert.equal(shapeDiagnostics.some((item) => item.code === "schema.stringArray.invalid"), false);

  const resolved = resolveTemplate({
    template,
    sourcePath: "/templates/legacy-scalar.rmg.json",
    gameData: fixtureGameDataForLegacyScalarTemplate() as never,
  });
  const resolvedZone = resolved.variants[0]?.zones[0];
  assert.equal(resolvedZone?.mandatoryContentPresets[0]?.id, "mandatory_old");
  assert.equal(resolvedZone?.contentCountLimitPresets[0]?.id, "limit_old");

  const renamedLimit = renameContentCountLimitPreset({
    template,
    preset: { presetName: "limit_old" },
    newName: "limit_new",
  });
  expectOk("renameContentCountLimitPreset.legacyScalar", renamedLimit);
  assert.deepEqual(renamedLimit.value.variants?.[0]?.zones?.[0]?.contentCountLimits, ["limit_new"]);

  const renamedMandatory = renameMandatoryContentPreset({
    template,
    preset: { presetName: "mandatory_old" },
    newName: "mandatory_new",
  });
  expectOk("renameMandatoryContentPreset.legacyScalar", renamedMandatory);
  assert.deepEqual(renamedMandatory.value.variants?.[0]?.zones?.[0]?.mandatoryContent, ["mandatory_new"]);

  const blockedLimitRemoval = removeContentCountLimitPreset({
    template,
    preset: { presetName: "limit_old" },
    cascade: false,
  });
  assert.equal(blockedLimitRemoval.ok, false);
  assert.equal(blockedLimitRemoval.diagnostics.some((item) => item.code === "mutation.contentCountLimitPreset.hasReferences"), true);

  const removedMandatory = removeMandatoryContentPreset({
    template,
    preset: { presetName: "mandatory_old" },
    cascade: true,
  });
  expectOk("removeMandatoryContentPreset.legacyScalar", removedMandatory);
  assert.deepEqual(removedMandatory.value.variants?.[0]?.zones?.[0]?.mandatoryContent, []);
});

test("misc game-rule settings mutate and guard reaction distribution requires six slots", () => {
  const updated = updateTemplateSettings({
    template: fixtureTemplate(),
    gameRules: {
      factionLawsExpModifier: 0.5,
      astrologyExpModifier: 2,
      bonuses: [{ sid: "add_bonus_hero_unit_multipler", receiverFilter: "start_hero", parameters: ["skeleton"] }],
    },
  });
  expectOk("updateTemplateSettings.miscGameRules", updated);
  assert.equal(updated.value.gameRules?.factionLawsExpModifier, 0.5);
  assert.equal(updated.value.gameRules?.astrologyExpModifier, 2);
  assert.deepEqual(updated.value.gameRules?.bonuses, [
    { sid: "add_bonus_hero_unit_multipler", receiverFilter: "start_hero", parameters: ["skeleton"] },
  ]);

  const cleared = updateTemplateSettings({
    template: updated.value,
    gameRules: { bonuses: null },
  });
  expectOk("updateTemplateSettings.clearBonuses", cleared);
  assert.equal("bonuses" in (cleared.value.gameRules ?? {}), false);

  const invalidDistribution = fixtureTemplate();
  invalidDistribution.variants![0]!.zones![0]!.guardReactionDistribution = [1, 2, 3];
  const invalidDiagnostics = validateTemplateShape(invalidDistribution, "/templates/invalid-guard-dist.rmg.json");
  assert.equal(invalidDiagnostics.some((item) => item.code === "zone.guardReactionDistribution.invalid"), true);

  const validDistribution = fixtureTemplate();
  validDistribution.variants![0]!.zones![0]!.guardReactionDistribution = [1, 2, 3, 4, 5, 6];
  const validDiagnostics = validateTemplateShape(validDistribution, "/templates/valid-guard-dist.rmg.json");
  assert.equal(validDiagnostics.some((item) => item.code === "zone.guardReactionDistribution.invalid"), false);
});

test("transaction history snapshots are isolated from caller mutations", () => {
  const before = fixtureTemplate();
  const mutation = renameContentList({
    template: before,
    list: { listName: "list_old" },
    newName: "list_new",
  });
  expectOk("renameContentList", mutation);

  const history = pushTransaction(createTransactionHistory(), "rename content list", before, mutation);
  assert.equal(canUndo(history), true);
  assert.equal(getCurrentTemplate(history)?.contentLists?.[0]?.name, "list_new");

  before.name = "mutated before";
  mutation.value.name = "mutated after";
  const current = getCurrentTemplate(history);
  assert.equal(current?.name, "Mutation Invariants");
  if (current) {
    current.name = "mutated current return";
  }
  assert.equal(getCurrentTemplate(history)?.name, "Mutation Invariants");

  const undone = undo(history);
  assert.ok(undone);
  assert.equal(undone.template.name, "Mutation Invariants");
  assert.equal(undone.template.contentLists?.[0]?.name, "list_old");
  assert.equal(canRedo(undone.history), true);

  const redone = redo(undone.history);
  assert.ok(redone);
  assert.equal(redone.template.name, "Mutation Invariants");
  assert.equal(redone.template.contentLists?.[0]?.name, "list_new");
});

let failures = 0;
for (const { name, fn } of tests) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    failures++;
    console.error(`not ok - ${name}`);
    console.error(error);
  }
}

if (failures > 0) {
  throw new Error(`${failures} mutation invariant test(s) failed.`);
}

console.log(`mutation-invariants: ${tests.length} passed`);
