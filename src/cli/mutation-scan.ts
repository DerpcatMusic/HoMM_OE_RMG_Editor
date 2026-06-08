import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import {
  countDiagnostics,
  cloneTemplate,
  defaultGameDataPaths,
  addConnection,
  addMainObject,
  addZone,
  addZoneRoad,
  indexGameData,
  indexTemplates,
  listContentPoolOptions,
  createMinimalPlayableTemplate,
  createDefaultTemplate,
  removeConnection,
  removeMainObject,
  removeZone,
  removeZoneRoad,
  renameContentCountLimitPreset,
  renameConnection,
  renameLocalContentPool,
  renameMandatoryContentPreset,
  renameZone,
  resolveTemplate,
  setZoneContentCountLimitPresets,
  setZoneContentBudgets,
  setZoneMandatoryContentPresets,
  setZoneContentPools,
  stringifyRmgTemplate,
  updateConnectionSettings,
  updateConnectionType,
  updateConnectionEndpoints,
  updateMainObject,
  updateTemplateSettings,
  updateZoneSettings,
  updateZoneRoad,
  addMandatoryContentPreset,
  removeMandatoryContentPreset,
  updateMandatoryContentPreset,
  addContentCountLimitPreset,
  removeContentCountLimitPreset,
  updateContentCountLimitPreset,
  addLocalContentPool,
  cloneCoreContentPoolToLocal,
  addContentPoolBan,
  addContentPoolGroup,
  updateContentPoolBan,
  updateContentPoolGroup,
  moveContentPoolBan,
  moveContentPoolGroup,
  removeContentPoolBan,
  removeContentPoolGroup,
  updateContentPoolValueDistribution,
  removeLocalContentPool,
  updateLocalContentPool,
  cloneZone,
  addVariant,
  removeVariant,
  addContentList,
  removeContentList,
  updateContentList,
  renameContentList,
  addZoneLayout,
  removeZoneLayout,
  updateZoneLayout,
  renameZoneLayout,
  addValueOverride,
  removeValueOverride,
  updateValueOverride,
  updateGlobalBans,
  createTransactionHistory,
  pushTransaction,
  canUndo,
  undo,
  canRedo,
  redo,
  getCurrentTemplate,
  runBulkZoneMutation,
  validateResolvedTemplate,
  validateSemanticPlayability,
  type Diagnostic,
  type MutationResult,
  type RmgTemplate,
  type TemplateFile,
} from "../core/index.js";

async function main(): Promise<void> {
  const projectRoot = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
  const paths = defaultGameDataPaths(projectRoot);
  const [gameData, templates] = await Promise.all([indexGameData(paths), indexTemplates(paths.liveTemplatesDir)]);
  const templateFile = templates.byName.get("Jebus Cross") ?? templates.templates[0];

  if (!templateFile) {
    throw new Error("No RMG templates found.");
  }

  const variantIndex = 0;
  const variant = templateFile.template.variants?.[variantIndex];
  const zone = variant?.zones?.find((item) => item.name);
  const connectionIndex = variant?.connections?.findIndex((item) => item.name && item.from && item.to) ?? -1;
  const connection = connectionIndex >= 0 ? variant?.connections?.[connectionIndex] : undefined;

  if (!variant || !zone?.name || !connection?.name || !connection.from || !connection.to) {
    throw new Error(`Template '${templateFile.fileName}' does not contain the expected mutation scan fixtures.`);
  }

  const renamedZone = renameZone({
    template: templateFile.template,
    variantIndex,
    zone: { zoneName: zone.name },
    newName: `${zone.name}__mutation_probe`,
  });
  assertMutation("renameZone", renamedZone);
  const zoneDiagnostics = validateMutation(renamedZone.value, templateFile.sourcePath, gameData);

  const renamedConnection = renameConnection({
    template: templateFile.template,
    variantIndex,
    connection: { connectionName: connection.name },
    newName: `${connection.name}__mutation_probe`,
  });
  assertMutation("renameConnection", renamedConnection);
  const connectionDiagnostics = validateMutation(renamedConnection.value, templateFile.sourcePath, gameData);

  const swappedEndpoints = updateConnectionEndpoints({
    template: templateFile.template,
    variantIndex,
    connection: { connectionIndex },
    from: connection.to,
    to: connection.from,
  });
  assertMutation("updateConnectionEndpoints", swappedEndpoints);
  const endpointDiagnostics = validateMutation(swappedEndpoints.value, templateFile.sourcePath, gameData);

  const poolIds = zone.guardedContentPool ?? [];
  const replacementPoolIds = buildReplacementPools(poolIds, [...gameData.contentPools.byName.keys()]);
  const updatedPools = setZoneContentPools({
    template: templateFile.template,
    variantIndex,
    zone: { zoneName: zone.name },
    field: "guardedContentPool",
    poolIds: replacementPoolIds,
  });
  assertMutation("setZoneContentPools", updatedPools);
  const poolDiagnostics = validateMutation(updatedPools.value, templateFile.sourcePath, gameData);

  const createdTemplate = createDefaultTemplate({ name: "__mutation_probe_new_template" });
  const createdTemplateDiagnostics = validateMutation(createdTemplate, `${projectRoot}/__mutation_probe_new_template.rmg.json`, gameData);
  const createdTemplateJson = stringifyRmgTemplate(createdTemplate);
  if (!createdTemplateJson.endsWith("\n") || !createdTemplateJson.includes("\"variants\"")) {
    throw new Error("createDefaultTemplate serialization check failed.");
  }

  const minimalPlayableTemplate = createMinimalPlayableTemplate({
    name: "__mutation_probe_minimal_playable",
    winConditionPreset: "cityHold",
    playerCount: 2,
  });
  const minimalPlayableTemplateDiagnostics = validateMutation(
    minimalPlayableTemplate,
    `${projectRoot}/__mutation_probe_minimal_playable.rmg.json`,
    gameData,
  );
  const minimalPlayableResolved = resolveTemplate({
    template: minimalPlayableTemplate,
    sourcePath: `${projectRoot}/__mutation_probe_minimal_playable.rmg.json#semantic`,
    gameData,
  });
  const minimalPlayableSemanticDiagnostics = validateSemanticPlayability(minimalPlayableResolved);
  const minimalPlayableTemplateJson = stringifyRmgTemplate(minimalPlayableTemplate);
  if (
    !minimalPlayableTemplateJson.includes("\"type\": \"Spawn\"") ||
    !minimalPlayableTemplateJson.includes("\"holdCityWinCon\": true")
  ) {
    throw new Error("createMinimalPlayableTemplate serialization check failed.");
  }
  assertNoSemanticErrors("createMinimalPlayableTemplate.semantic", minimalPlayableSemanticDiagnostics);

  const contentPoolOptions = listContentPoolOptions({ gameData, template: templateFile.template, sampleSize: 3 });
  if (contentPoolOptions.length === 0 || !contentPoolOptions.some((pool) => pool.id === "content_pool_default_guarded")) {
    throw new Error("listContentPoolOptions did not return expected Core pools.");
  }

  const addedZone = addZone({
    template: templateFile.template,
    variantIndex,
    zone: { name: "__mutation_probe_zone" },
  });
  assertMutation("addZone", addedZone);
  const addZoneDiagnostics = validateMutation(addedZone.value, templateFile.sourcePath, gameData);

  const addedConnection = addConnection({
    template: addedZone.value,
    variantIndex,
    connection: {
      name: "__mutation_probe_connection",
      from: zone.name,
      to: "__mutation_probe_zone",
      connectionType: "Direct",
    },
  });
  assertMutation("addConnection", addedConnection);
  const addConnectionDiagnostics = validateMutation(addedConnection.value, templateFile.sourcePath, gameData);

  const roadFixtureZone = addMainObject({
    template: addedConnection.value,
    variantIndex,
    zone: { zoneName: "__mutation_probe_zone" },
  });
  assertMutation("addMainObject.roadFixture", roadFixtureZone);

  const addedRoad = addZoneRoad({
    template: roadFixtureZone.value,
    variantIndex,
    zone: { zoneName: "__mutation_probe_zone" },
    road: {
      type: "Stone",
      from: { type: "MainObject", args: ["0"] },
      to: { type: "Connection", args: ["__mutation_probe_connection"] },
    },
  });
  assertMutation("addZoneRoad", addedRoad);
  const addZoneRoadDiagnostics = validateMutation(addedRoad.value, templateFile.sourcePath, gameData);

  const updatedRoad = updateZoneRoad({
    template: addedRoad.value,
    variantIndex,
    zone: { zoneName: "__mutation_probe_zone" },
    roadIndex: 0,
    settings: {
      type: "Dirt",
      to: { type: "Crossroads" },
    },
  });
  assertMutation("updateZoneRoad", updatedRoad);
  const updateZoneRoadDiagnostics = validateMutation(updatedRoad.value, templateFile.sourcePath, gameData);

  const removedRoad = removeZoneRoad({
    template: updatedRoad.value,
    variantIndex,
    zone: { zoneName: "__mutation_probe_zone" },
    roadIndex: 0,
  });
  assertMutation("removeZoneRoad", removedRoad);
  const removeZoneRoadDiagnostics = validateMutation(removedRoad.value, templateFile.sourcePath, gameData);

  const removedConnection = removeConnection({
    template: addedConnection.value,
    variantIndex,
    connection: { connectionName: "__mutation_probe_connection" },
  });
  assertMutation("removeConnection", removedConnection);
  const removeConnectionDiagnostics = validateMutation(removedConnection.value, templateFile.sourcePath, gameData);

  const budgetedZone = setZoneContentBudgets({
    template: addedZone.value,
    variantIndex,
    zone: { zoneName: "__mutation_probe_zone" },
    budgets: { unguardedContentValue: 10000, resourcesValue: 1500 },
  });
  assertMutation("setZoneContentBudgets", budgetedZone);
  const budgetDiagnostics = validateMutation(budgetedZone.value, templateFile.sourcePath, gameData);

  const zoneWithMainObject = addMainObject({
    template: addedZone.value,
    variantIndex,
    zone: { zoneName: "__mutation_probe_zone" },
  });
  assertMutation("addMainObject", zoneWithMainObject);
  const mainObjectDiagnostics = validateMutation(zoneWithMainObject.value, templateFile.sourcePath, gameData);

  const updatedZoneSettings = updateZoneSettings({
    template: zoneWithMainObject.value,
    variantIndex,
    zone: { zoneName: "__mutation_probe_zone" },
    settings: {
      size: 1.25,
      zoneBiome: { type: "FromList", args: ["Sand"] },
      contentBiome: { type: "MatchZone", args: [] },
      metaObjectsBiome: { type: "MatchZone", args: [] },
      guardRandomization: 0.1,
    },
  });
  assertMutation("updateZoneSettings", updatedZoneSettings);
  const zoneSettingsDiagnostics = validateMutation(updatedZoneSettings.value, templateFile.sourcePath, gameData);

  const updatedMainObject = updateMainObject({
    template: zoneWithMainObject.value,
    variantIndex,
    zone: { zoneName: "__mutation_probe_zone" },
    mainObject: { mainObjectIndex: 0 },
    settings: {
      holdCityWinCon: true,
      guardValue: 5000,
    },
  });
  assertMutation("updateMainObject", updatedMainObject);
  const updateMainObjectDiagnostics = validateMutation(updatedMainObject.value, templateFile.sourcePath, gameData);

  const removedMainObject = removeMainObject({
    template: updatedMainObject.value,
    variantIndex,
    zone: { zoneName: "__mutation_probe_zone" },
    mainObject: { mainObjectIndex: 0 },
  });
  assertMutation("removeMainObject", removedMainObject);
  const removeMainObjectDiagnostics = validateMutation(removedMainObject.value, templateFile.sourcePath, gameData);

  const removedZone = removeZone({
    template: addedZone.value,
    variantIndex,
    zone: { zoneName: "__mutation_probe_zone" },
  });
  assertMutation("removeZone", removedZone);
  const removeZoneDiagnostics = validateMutation(removedZone.value, templateFile.sourcePath, gameData);

  const updatedConnectionType = updateConnectionType({
    template: templateFile.template,
    variantIndex,
    connection: { connectionIndex },
    connectionType: "Portal",
  });
  assertMutation("updateConnectionType", updatedConnectionType);
  const connectionTypeDiagnostics = validateMutation(updatedConnectionType.value, templateFile.sourcePath, gameData);

  const updatedConnectionSettings = updateConnectionSettings({
    template: templateFile.template,
    variantIndex,
    connection: { connectionIndex },
    settings: {
      length: 2,
      guardValue: (connection.guardValue ?? 0) + 1000,
      guardWeeklyIncrement: 0.15,
      guardReaction: "Common",
      guardEscape: false,
      guardMatchGroup: "__mutation_probe_guard_group",
      gatePlacement: "Center",
      portalPlacementRulesFrom: [{ type: "Crossroads", args: [], targetMin: 0.1, targetMax: 0.2, weight: 2 }],
      portalPlacementRulesTo: [{ type: "Crossroads", args: [], targetMin: 0.1, targetMax: 0.2, weight: 2 }],
      road: true,
      simTurnSquad: true,
      guardRandomization: 0.1,
    },
  });
  assertMutation("updateConnectionSettings", updatedConnectionSettings);
  const connectionSettingsDiagnostics = validateMutation(updatedConnectionSettings.value, templateFile.sourcePath, gameData);

  const updatedTemplateSettings = updateTemplateSettings({
    template: templateFile.template,
    gameMode: "SingleHero",
    applyGameModeDefaults: true,
    winConditionPreset: "finalBattle",
    winConditions: {
      gladiatorArenaDaysDelayStart: 14,
    },
    gameRules: {
      heroCountMin: 1,
      heroCountMax: 1,
      heroCountIncrement: 1,
      heroHireBan: true,
    },
  });
  assertMutation("updateTemplateSettings", updatedTemplateSettings);
  const templateSettingsDiagnostics = validateMutation(updatedTemplateSettings.value, templateFile.sourcePath, gameData);

  const orderedTemplateFiles = [templateFile, ...templates.templates.filter((file) => file !== templateFile)];
  const mandatoryFixture = findMandatoryPresetFixture(orderedTemplateFiles);
  const renamedMandatoryPreset = renameMandatoryContentPreset({
    template: mandatoryFixture.templateFile.template,
    preset: { presetName: mandatoryFixture.presetName },
    newName: `${mandatoryFixture.presetName}__mutation_probe`,
  });
  assertMutation("renameMandatoryContentPreset", renamedMandatoryPreset);
  const mandatoryDiagnostics = validateMutation(
    renamedMandatoryPreset.value,
    mandatoryFixture.templateFile.sourcePath,
    gameData,
  );

  const assignedMandatoryPreset = setZoneMandatoryContentPresets({
    template: mandatoryFixture.templateFile.template,
    variantIndex: 0,
    zone: findZoneReferencingPreset(mandatoryFixture.templateFile, "mandatoryContent", mandatoryFixture.presetName),
    presetIds: buildPresetAssignment(mandatoryFixture.templateFile, "mandatoryContent", mandatoryFixture.presetName),
  });
  assertMutation("setZoneMandatoryContentPresets", assignedMandatoryPreset);
  const assignedMandatoryDiagnostics = validateMutation(
    assignedMandatoryPreset.value,
    mandatoryFixture.templateFile.sourcePath,
    gameData,
  );

  const limitFixture = findContentCountLimitPresetFixture(orderedTemplateFiles);
  const renamedLimitPreset = renameContentCountLimitPreset({
    template: limitFixture.templateFile.template,
    preset: { presetName: limitFixture.presetName },
    newName: `${limitFixture.presetName}__mutation_probe`,
  });
  assertMutation("renameContentCountLimitPreset", renamedLimitPreset);
  const limitDiagnostics = validateMutation(renamedLimitPreset.value, limitFixture.templateFile.sourcePath, gameData);

  const assignedLimitPreset = setZoneContentCountLimitPresets({
    template: limitFixture.templateFile.template,
    variantIndex: 0,
    zone: findZoneReferencingPreset(limitFixture.templateFile, "contentCountLimits", limitFixture.presetName),
    presetIds: buildPresetAssignment(limitFixture.templateFile, "contentCountLimits", limitFixture.presetName),
  });
  assertMutation("setZoneContentCountLimitPresets", assignedLimitPreset);
  const assignedLimitDiagnostics = validateMutation(assignedLimitPreset.value, limitFixture.templateFile.sourcePath, gameData);

  const localPoolFixture = buildSyntheticLocalPoolFixture(templateFile);
  const renamedLocalPool = renameLocalContentPool({
    template: localPoolFixture.template,
    pool: { poolName: localPoolFixture.poolName },
    newName: `${localPoolFixture.poolName}__renamed`,
  });
  assertMutation("renameLocalContentPool", renamedLocalPool);
  const localPoolDiagnostics = validateMutation(renamedLocalPool.value, `${templateFile.sourcePath}#synthetic-local-pool`, gameData);

  const addedMandatoryPreset = addMandatoryContentPreset({
    template: mandatoryFixture.templateFile.template,
    preset: {
      name: "__mutation_probe_mandatory_preset",
      content: [{ name: "Test Content", sid: "test_sid", isGuarded: true }]
    }
  });
  assertMutation("addMandatoryContentPreset", addedMandatoryPreset);
  const addMandatoryDiagnostics = validateMutation(addedMandatoryPreset.value, mandatoryFixture.templateFile.sourcePath, gameData);

  const updatedMandatoryPreset = updateMandatoryContentPreset({
    template: addedMandatoryPreset.value,
    preset: { presetName: "__mutation_probe_mandatory_preset" },
    settings: { name: "__mutation_probe_mandatory_preset_updated" }
  });
  assertMutation("updateMandatoryContentPreset", updatedMandatoryPreset);
  const updateMandatoryDiagnostics = validateMutation(updatedMandatoryPreset.value, mandatoryFixture.templateFile.sourcePath, gameData);

  const removedMandatoryPreset = removeMandatoryContentPreset({
    template: updatedMandatoryPreset.value,
    preset: { presetName: "__mutation_probe_mandatory_preset_updated" },
    cascade: true
  });
  assertMutation("removeMandatoryContentPreset", removedMandatoryPreset);
  const removeMandatoryDiagnostics = validateMutation(removedMandatoryPreset.value, mandatoryFixture.templateFile.sourcePath, gameData);

  const addedLimitPreset = addContentCountLimitPreset({
    template: limitFixture.templateFile.template,
    preset: { name: "__mutation_probe_limit_preset", limits: [{ sid: "test_sid", maxCount: 5 }] }
  });
  assertMutation("addContentCountLimitPreset", addedLimitPreset);
  const addLimitDiagnostics = validateMutation(addedLimitPreset.value, limitFixture.templateFile.sourcePath, gameData);

  const updatedLimitPreset = updateContentCountLimitPreset({
    template: addedLimitPreset.value,
    preset: { presetName: "__mutation_probe_limit_preset" },
    settings: { name: "__mutation_probe_limit_preset_updated" }
  });
  assertMutation("updateContentCountLimitPreset", updatedLimitPreset);
  const updateLimitDiagnostics = validateMutation(updatedLimitPreset.value, limitFixture.templateFile.sourcePath, gameData);

  const removedLimitPreset = removeContentCountLimitPreset({
    template: updatedLimitPreset.value,
    preset: { presetName: "__mutation_probe_limit_preset_updated" },
    cascade: true
  });
  assertMutation("removeContentCountLimitPreset", removedLimitPreset);
  const removeLimitDiagnostics = validateMutation(removedLimitPreset.value, limitFixture.templateFile.sourcePath, gameData);

  const addedLocalPool = addLocalContentPool({
    template: templateFile.template,
    pool: { name: "__mutation_probe_local_pool_v2", groups: [{ weight: 1, content: [{ sid: "test", weight: 1 }] }] }
  });
  assertMutation("addLocalContentPool", addedLocalPool);
  const addLocalPoolDiagnostics = validateMutation(addedLocalPool.value, templateFile.sourcePath, gameData);

  const updatedLocalPool = updateLocalContentPool({
    template: addedLocalPool.value,
    pool: { poolName: "__mutation_probe_local_pool_v2" },
    settings: { name: "__mutation_probe_local_pool_v2_updated" }
  });
  assertMutation("updateLocalContentPool", updatedLocalPool);
  const updateLocalPoolDiagnostics = validateMutation(updatedLocalPool.value, templateFile.sourcePath, gameData);

  const removedLocalPool = removeLocalContentPool({
    template: updatedLocalPool.value,
    pool: { poolName: "__mutation_probe_local_pool_v2_updated" },
    cascade: true
  });
  assertMutation("removeLocalContentPool", removedLocalPool);
  const removeLocalPoolDiagnostics = validateMutation(removedLocalPool.value, templateFile.sourcePath, gameData);

  const clonedCorePool = cloneCoreContentPoolToLocal({
    template: templateFile.template,
    contentPools: gameData.contentPools,
    sourcePoolName: "content_pool_default_guarded",
    localName: "__mutation_probe_cloned_core_pool",
  });
  assertMutation("cloneCoreContentPoolToLocal", clonedCorePool);
  const cloneCorePoolDiagnostics = validateMutation(clonedCorePool.value, templateFile.sourcePath, gameData);

  const addedPoolGroup = addContentPoolGroup({
    template: addedLocalPool.value,
    pool: { poolName: "__mutation_probe_local_pool_v2" },
    group: { weight: 2, content: [{ sid: "test_group", weight: 1 }] },
  });
  assertMutation("addContentPoolGroup", addedPoolGroup);
  const addPoolGroupDiagnostics = validateMutation(addedPoolGroup.value, templateFile.sourcePath, gameData);

  const updatedPoolGroup = updateContentPoolGroup({
    template: addedPoolGroup.value,
    pool: { poolName: "__mutation_probe_local_pool_v2" },
    groupIndex: 1,
    settings: { weight: 3, content: [{ sid: "test_group_updated", weight: 2 }] },
  });
  assertMutation("updateContentPoolGroup", updatedPoolGroup);
  const updatePoolGroupDiagnostics = validateMutation(updatedPoolGroup.value, templateFile.sourcePath, gameData);

  const movedPoolGroup = moveContentPoolGroup({
    template: updatedPoolGroup.value,
    pool: { poolName: "__mutation_probe_local_pool_v2" },
    fromIndex: 1,
    toIndex: 0,
  });
  assertMutation("moveContentPoolGroup", movedPoolGroup);
  const movePoolGroupDiagnostics = validateMutation(movedPoolGroup.value, templateFile.sourcePath, gameData);

  const removedPoolGroup = removeContentPoolGroup({
    template: movedPoolGroup.value,
    pool: { poolName: "__mutation_probe_local_pool_v2" },
    groupIndex: 0,
  });
  assertMutation("removeContentPoolGroup", removedPoolGroup);
  const removePoolGroupDiagnostics = validateMutation(removedPoolGroup.value, templateFile.sourcePath, gameData);

  const updatedPoolValueDistribution = updateContentPoolValueDistribution({
    template: addedLocalPool.value,
    pool: { poolName: "__mutation_probe_local_pool_v2" },
    valueDistribution: { priceBounds: [1000, 5000], weights: [1, 3, 1] },
  });
  assertMutation("updateContentPoolValueDistribution", updatedPoolValueDistribution);
  const updatePoolValueDistributionDiagnostics = validateMutation(updatedPoolValueDistribution.value, templateFile.sourcePath, gameData);

  const addedPoolBan = addContentPoolBan({
    template: addedLocalPool.value,
    pool: { poolName: "__mutation_probe_local_pool_v2" },
    ban: { sid: "test_ban", variant: 0 },
  });
  assertMutation("addContentPoolBan", addedPoolBan);
  const addPoolBanDiagnostics = validateMutation(addedPoolBan.value, templateFile.sourcePath, gameData);

  const updatedPoolBan = updateContentPoolBan({
    template: addedPoolBan.value,
    pool: { poolName: "__mutation_probe_local_pool_v2" },
    banIndex: 0,
    ban: { sid: "test_ban_updated" },
  });
  assertMutation("updateContentPoolBan", updatedPoolBan);
  const updatePoolBanDiagnostics = validateMutation(updatedPoolBan.value, templateFile.sourcePath, gameData);

  const secondPoolBan = addContentPoolBan({
    template: updatedPoolBan.value,
    pool: { poolName: "__mutation_probe_local_pool_v2" },
    ban: { sid: "test_ban_second" },
  });
  assertMutation("addContentPoolBan.second", secondPoolBan);

  const movedPoolBan = moveContentPoolBan({
    template: secondPoolBan.value,
    pool: { poolName: "__mutation_probe_local_pool_v2" },
    fromIndex: 1,
    toIndex: 0,
  });
  assertMutation("moveContentPoolBan", movedPoolBan);
  const movePoolBanDiagnostics = validateMutation(movedPoolBan.value, templateFile.sourcePath, gameData);

  const removedPoolBan = removeContentPoolBan({
    template: movedPoolBan.value,
    pool: { poolName: "__mutation_probe_local_pool_v2" },
    banIndex: 0,
  });
  assertMutation("removeContentPoolBan", removedPoolBan);
  const removePoolBanDiagnostics = validateMutation(removedPoolBan.value, templateFile.sourcePath, gameData);

  const clonedZone = cloneZone({
    template: templateFile.template,
    variantIndex: 0,
    zone: { zoneName: zone.name },
    newName: `${zone.name}__cloned`
  });
  assertMutation("cloneZone", clonedZone);
  const cloneZoneDiagnostics = validateMutation(clonedZone.value, templateFile.sourcePath, gameData);

  const addedVariant = addVariant({ template: templateFile.template, variant: {} });
  assertMutation("addVariant", addedVariant);
  const addVariantDiagnostics = validateMutation(addedVariant.value, templateFile.sourcePath, gameData);

  const removedVariant = removeVariant({ template: addedVariant.value, variantIndex: 1 });
  assertMutation("removeVariant", removedVariant);
  const removeVariantDiagnostics = validateMutation(removedVariant.value, templateFile.sourcePath, gameData);

  const addedContentList = addContentList({
    template: templateFile.template,
    list: { name: "__mutation_probe_content_list", content: [{ sid: "test_item", weight: 1 }] },
  });
  assertMutation("addContentList", addedContentList);
  const addContentListDiagnostics = validateMutation(addedContentList.value, templateFile.sourcePath, gameData);

  const updatedContentList = updateContentList({
    template: addedContentList.value,
    list: { listName: "__mutation_probe_content_list" },
    settings: { name: "__mutation_probe_content_list_updated", content: [{ sid: "test_item_2", weight: 2 }] },
  });
  assertMutation("updateContentList", updatedContentList);
  const updateContentListDiagnostics = validateMutation(updatedContentList.value, templateFile.sourcePath, gameData);

  const removedContentList = removeContentList({
    template: updatedContentList.value,
    list: { listName: "__mutation_probe_content_list_updated" },
    cascade: true,
  });
  assertMutation("removeContentList", removedContentList);
  const removeContentListDiagnostics = validateMutation(removedContentList.value, templateFile.sourcePath, gameData);

  const addedZoneLayout = addZoneLayout({
    template: templateFile.template,
    layout: { name: "__mutation_probe_zone_layout", obstaclesFill: 0.5 },
  });
  assertMutation("addZoneLayout", addedZoneLayout);
  const addZoneLayoutDiagnostics = validateMutation(addedZoneLayout.value, templateFile.sourcePath, gameData);

  const updatedZoneLayout = updateZoneLayout({
    template: addedZoneLayout.value,
    layout: { layoutName: "__mutation_probe_zone_layout" },
    settings: { name: "__mutation_probe_zone_layout_updated", obstaclesFill: 0.7 },
  });
  assertMutation("updateZoneLayout", updatedZoneLayout);
  const updateZoneLayoutDiagnostics = validateMutation(updatedZoneLayout.value, templateFile.sourcePath, gameData);

  const removedZoneLayout = removeZoneLayout({
    template: updatedZoneLayout.value,
    layout: { layoutName: "__mutation_probe_zone_layout_updated" },
    cascade: true,
  });
  assertMutation("removeZoneLayout", removedZoneLayout);
  const removeZoneLayoutDiagnostics = validateMutation(removedZoneLayout.value, templateFile.sourcePath, gameData);

  const addedValueOverride = addValueOverride({
    template: templateFile.template,
    override: { sid: "__mutation_probe_sid", goodsValue: 100, guardValue: 50 },
  });
  assertMutation("addValueOverride", addedValueOverride);
  const addValueOverrideDiagnostics = validateMutation(addedValueOverride.value, templateFile.sourcePath, gameData);

  const updatedValueOverride = updateValueOverride({
    template: addedValueOverride.value,
    index: 0,
    settings: { sid: "__mutation_probe_sid_updated", goodsValue: 200 },
  });
  assertMutation("updateValueOverride", updatedValueOverride);
  const updateValueOverrideDiagnostics = validateMutation(updatedValueOverride.value, templateFile.sourcePath, gameData);

  const removedValueOverride = removeValueOverride({
    template: updatedValueOverride.value,
    index: 0,
  });
  assertMutation("removeValueOverride", removedValueOverride);
  const removeValueOverrideDiagnostics = validateMutation(removedValueOverride.value, templateFile.sourcePath, gameData);

  const updatedGlobalBans = updateGlobalBans({
    template: templateFile.template,
    settings: {
      magics: ["magic_fireball", "magic_icebolt"],
      heroes: ["hero_knight"],
    },
  });
  assertMutation("updateGlobalBans", updatedGlobalBans);
  const updateGlobalBansDiagnostics = validateMutation(updatedGlobalBans.value, templateFile.sourcePath, gameData);

  const history = createTransactionHistory();
  const tx1 = pushTransaction(history, "test mutation", templateFile.template, renamedZone);
  const canUndo1 = canUndo(tx1);
  const undoResult = undo(tx1);
  const canRedo1 = undoResult ? canRedo(undoResult.history) : false;
  const redoResult = undoResult ? redo(undoResult.history) : undefined;
  if (!canUndo1) throw new Error("Transaction manager: canUndo should be true after push");
  if (!undoResult) throw new Error("Transaction manager: undo failed");
  if (!canRedo1) throw new Error("Transaction manager: canRedo should be true after undo");
  if (!redoResult) throw new Error("Transaction manager: redo failed");
  if (!isDeepStrictEqual(undoResult.template, templateFile.template)) {
    throw new Error("Transaction manager: undo did not restore correct template");
  }
  if (!isDeepStrictEqual(redoResult.template, renamedZone.value)) {
    throw new Error("Transaction manager: redo did not restore correct template");
  }

  const bulkResult = runBulkZoneMutation({
    template: templateFile.template,
    variantIndex: 0,
    predicate: (zone) => zone.name?.includes("Spawn") ?? false,
    mutate: (tmpl, zoneIndex) =>
      updateZoneSettings({
        template: tmpl,
        variantIndex: 0,
        zone: { zoneIndex },
        settings: { size: 2 },
      }),
  });
  assertMutation("runBulkZoneMutation", bulkResult);
  const bulkDiagnostics = validateMutation(bulkResult.value, templateFile.sourcePath, gameData);

  console.log("RMG Mutation Scan");
  console.log(`projectRoot=${projectRoot}`);
  console.log(`template=${templateFile.fileName}`);
  printMutation("renameZone", renamedZone, zoneDiagnostics);
  printMutation("renameConnection", renamedConnection, connectionDiagnostics);
  printMutation("updateConnectionEndpoints", swappedEndpoints, endpointDiagnostics);
  printMutation("setZoneContentPools", updatedPools, poolDiagnostics);
  printFactory("createDefaultTemplate", createdTemplateJson, createdTemplateDiagnostics);
  printFactory("createMinimalPlayableTemplate", minimalPlayableTemplateJson, minimalPlayableTemplateDiagnostics);
  printDiagnostics("createMinimalPlayableTemplate.semantic", minimalPlayableSemanticDiagnostics);
  console.log(`listContentPoolOptions.count=${contentPoolOptions.length}`);
  console.log(`listContentPoolOptions.first=${JSON.stringify(contentPoolOptions[0])}`);
  printMutation("addZone", addedZone, addZoneDiagnostics);
  printMutation("addConnection", addedConnection, addConnectionDiagnostics);
  printMutation("addZoneRoad", addedRoad, addZoneRoadDiagnostics);
  printMutation("updateZoneRoad", updatedRoad, updateZoneRoadDiagnostics);
  printMutation("removeZoneRoad", removedRoad, removeZoneRoadDiagnostics);
  printMutation("removeConnection", removedConnection, removeConnectionDiagnostics);
  printMutation("setZoneContentBudgets", budgetedZone, budgetDiagnostics);
  printMutation("addMainObject", zoneWithMainObject, mainObjectDiagnostics);
  printMutation("updateZoneSettings", updatedZoneSettings, zoneSettingsDiagnostics);
  printMutation("updateMainObject", updatedMainObject, updateMainObjectDiagnostics);
  printMutation("removeMainObject", removedMainObject, removeMainObjectDiagnostics);
  printMutation("removeZone", removedZone, removeZoneDiagnostics);
  printMutation("updateConnectionType", updatedConnectionType, connectionTypeDiagnostics);
  printMutation("updateConnectionSettings", updatedConnectionSettings, connectionSettingsDiagnostics);
  printMutation("updateTemplateSettings", updatedTemplateSettings, templateSettingsDiagnostics);
  printMutation("renameMandatoryContentPreset", renamedMandatoryPreset, mandatoryDiagnostics);
  printMutation("setZoneMandatoryContentPresets", assignedMandatoryPreset, assignedMandatoryDiagnostics);
  printMutation("renameContentCountLimitPreset", renamedLimitPreset, limitDiagnostics);
  printMutation("setZoneContentCountLimitPresets", assignedLimitPreset, assignedLimitDiagnostics);
  printMutation("renameLocalContentPool", renamedLocalPool, localPoolDiagnostics);
  printMutation("addMandatoryContentPreset", addedMandatoryPreset, addMandatoryDiagnostics);
  printMutation("updateMandatoryContentPreset", updatedMandatoryPreset, updateMandatoryDiagnostics);
  printMutation("removeMandatoryContentPreset", removedMandatoryPreset, removeMandatoryDiagnostics);
  printMutation("addContentCountLimitPreset", addedLimitPreset, addLimitDiagnostics);
  printMutation("updateContentCountLimitPreset", updatedLimitPreset, updateLimitDiagnostics);
  printMutation("removeContentCountLimitPreset", removedLimitPreset, removeLimitDiagnostics);
  printMutation("addLocalContentPool", addedLocalPool, addLocalPoolDiagnostics);
  printMutation("updateLocalContentPool", updatedLocalPool, updateLocalPoolDiagnostics);
  printMutation("removeLocalContentPool", removedLocalPool, removeLocalPoolDiagnostics);
  printMutation("cloneCoreContentPoolToLocal", clonedCorePool, cloneCorePoolDiagnostics);
  printMutation("addContentPoolGroup", addedPoolGroup, addPoolGroupDiagnostics);
  printMutation("updateContentPoolGroup", updatedPoolGroup, updatePoolGroupDiagnostics);
  printMutation("moveContentPoolGroup", movedPoolGroup, movePoolGroupDiagnostics);
  printMutation("removeContentPoolGroup", removedPoolGroup, removePoolGroupDiagnostics);
  printMutation("updateContentPoolValueDistribution", updatedPoolValueDistribution, updatePoolValueDistributionDiagnostics);
  printMutation("addContentPoolBan", addedPoolBan, addPoolBanDiagnostics);
  printMutation("updateContentPoolBan", updatedPoolBan, updatePoolBanDiagnostics);
  printMutation("moveContentPoolBan", movedPoolBan, movePoolBanDiagnostics);
  printMutation("removeContentPoolBan", removedPoolBan, removePoolBanDiagnostics);
  printMutation("cloneZone", clonedZone, cloneZoneDiagnostics);
  printMutation("addVariant", addedVariant, addVariantDiagnostics);
  printMutation("removeVariant", removedVariant, removeVariantDiagnostics);
  printMutation("addContentList", addedContentList, addContentListDiagnostics);
  printMutation("updateContentList", updatedContentList, updateContentListDiagnostics);
  printMutation("removeContentList", removedContentList, removeContentListDiagnostics);
  printMutation("addZoneLayout", addedZoneLayout, addZoneLayoutDiagnostics);
  printMutation("updateZoneLayout", updatedZoneLayout, updateZoneLayoutDiagnostics);
  printMutation("removeZoneLayout", removedZoneLayout, removeZoneLayoutDiagnostics);
  printMutation("addValueOverride", addedValueOverride, addValueOverrideDiagnostics);
  printMutation("updateValueOverride", updatedValueOverride, updateValueOverrideDiagnostics);
  printMutation("removeValueOverride", removedValueOverride, removeValueOverrideDiagnostics);
  printMutation("updateGlobalBans", updatedGlobalBans, updateGlobalBansDiagnostics);
  console.log(`transactionManager.canUndo=${canUndo1}`);
  console.log(`transactionManager.canRedo=${canRedo1}`);
  console.log(`transactionManager.undoRestored=${undoResult ? isDeepStrictEqual(undoResult.template, templateFile.template) : false}`);
  console.log(`transactionManager.redoRestored=${redoResult ? isDeepStrictEqual(redoResult.template, renamedZone.value) : false}`);
  printMutation("runBulkZoneMutation", bulkResult, bulkDiagnostics);
}

function validateMutation(template: RmgTemplate, sourcePath: string, gameData: Awaited<ReturnType<typeof indexGameData>>): Diagnostic[] {
  const resolved = resolveTemplate({ template, sourcePath: `${sourcePath}#mutation`, gameData });
  return validateResolvedTemplate(resolved, gameData);
}

function assertMutation(label: string, result: MutationResult): void {
  const errors = result.diagnostics.filter((item) => item.severity === "error");
  if (errors.length > 0) {
    throw new Error(`${label} failed: ${errors.map((item) => item.message).join("; ")}`);
  }
  if (result.changes.length === 0) {
    throw new Error(`${label} produced no changes.`);
  }
}

function assertNoSemanticErrors(label: string, diagnostics: Diagnostic[]): void {
  const errors = diagnostics.filter((item) => item.severity === "error");
  if (errors.length > 0) {
    throw new Error(`${label} failed: ${errors.map((item) => item.message).join("; ")}`);
  }
}

function printMutation(label: string, result: MutationResult, diagnostics: Diagnostic[]): void {
  const counts = countDiagnostics(diagnostics);
  const firstChange = result.changes[0];
  console.log(`${label}.ok=${result.ok}`);
  console.log(`${label}.changes=${result.changes.length}`);
  console.log(`${label}.diagnostics=${JSON.stringify(counts)}`);
  if (firstChange) {
    console.log(
      `${label}.firstChange=${JSON.stringify({
        path: firstChange.path,
        before: firstChange.before,
        after: firstChange.after,
        reason: firstChange.reason,
      })}`,
    );
  }
}

function printFactory(label: string, json: string, diagnostics: Diagnostic[]): void {
  const counts = countDiagnostics(diagnostics);
  console.log(`${label}.bytes=${Buffer.byteLength(json, "utf8")}`);
  console.log(`${label}.diagnostics=${JSON.stringify(counts)}`);
}

function printDiagnostics(label: string, diagnostics: Diagnostic[]): void {
  const counts = countDiagnostics(diagnostics);
  console.log(`${label}.diagnostics=${JSON.stringify(counts)}`);
}

function buildReplacementPools(currentPoolIds: string[], corePoolIds: string[]): string[] {
  const fallback = corePoolIds.find((id) => !currentPoolIds.includes(id)) ?? currentPoolIds[0];
  if (!fallback) {
    throw new Error("No content pool ids available for mutation scan.");
  }
  return currentPoolIds.length > 0 ? [currentPoolIds[0] ?? fallback, fallback] : [fallback];
}

function findMandatoryPresetFixture(templateFiles: TemplateFile[]): { templateFile: TemplateFile; presetName: string } {
  for (const templateFile of templateFiles) {
    for (const preset of templateFile.template.mandatoryContent ?? []) {
      if (!preset.name || !templateReferencesZoneString(templateFile.template, "mandatoryContent", preset.name)) {
        continue;
      }
      return { templateFile, presetName: preset.name };
    }
  }
  throw new Error("No live template has a referenced mandatory-content preset.");
}

function findContentCountLimitPresetFixture(templateFiles: TemplateFile[]): { templateFile: TemplateFile; presetName: string } {
  for (const templateFile of templateFiles) {
    for (const preset of templateFile.template.contentCountLimits ?? []) {
      if (!preset.name || !templateReferencesZoneString(templateFile.template, "contentCountLimits", preset.name)) {
        continue;
      }
      return { templateFile, presetName: preset.name };
    }
  }
  throw new Error("No live template has a referenced content-count-limit preset.");
}

function findZoneReferencingPreset(
  templateFile: TemplateFile,
  field: "mandatoryContent" | "contentCountLimits",
  value: string,
): { zoneName: string } {
  const zone = (templateFile.template.variants?.[0]?.zones ?? []).find((item) => {
    const refs = item[field] as unknown;
    return item.name && (Array.isArray(refs) ? refs.includes(value) : refs === value);
  });
  if (!zone?.name) {
    throw new Error(`No zone in '${templateFile.fileName}' references ${field} preset '${value}'.`);
  }
  return { zoneName: zone.name };
}

function buildPresetAssignment(
  templateFile: TemplateFile,
  field: "mandatoryContent" | "contentCountLimits",
  value: string,
): string[] {
  const rootPresets = field === "mandatoryContent" ? templateFile.template.mandatoryContent : templateFile.template.contentCountLimits;
  const otherPreset = (rootPresets ?? []).find((preset) => preset.name && preset.name !== value)?.name;
  return otherPreset ? [value, otherPreset] : [];
}

function templateReferencesZoneString(
  template: RmgTemplate,
  field: "mandatoryContent" | "contentCountLimits",
  value: string,
): boolean {
  return (template.variants ?? []).some((variant) =>
    (variant.zones ?? []).some((zone) => {
      const refs = zone[field] as unknown;
      return Array.isArray(refs) ? refs.includes(value) : refs === value;
    }),
  );
}

function buildSyntheticLocalPoolFixture(templateFile: TemplateFile): { template: RmgTemplate; poolName: string } {
  const template = cloneTemplate(templateFile.template);
  const poolName = "__mutation_probe_local_pool";
  const variant = template.variants?.[0];
  const zone = variant?.zones?.find((item) => item.name);
  if (!zone) {
    throw new Error(`Template '${templateFile.fileName}' has no zone for synthetic local-pool fixture.`);
  }

  template.contentPools = [{ name: poolName }, ...(template.contentPools ?? [])];
  zone.guardedContentPool = [poolName, ...(zone.guardedContentPool ?? [])];
  return { template, poolName };
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
