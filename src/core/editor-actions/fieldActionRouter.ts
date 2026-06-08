import { getEditorField } from "../editor-schema/index.js";
import type { ContentCountLimit, ContentWeight, MandatoryContent, RmgTemplate } from "../rmg/rmgTypes.js";
import type { GameMode } from "../rmg/enums.js";
import type { WinConditionPresetId } from "../rmg/winConditions.js";
import { renameZone } from "../mutations/renameZone.js";
import { renameConnection } from "../mutations/renameConnection.js";
import { renameLocalContentPool } from "../mutations/renameLocalContentPool.js";
import { renameContentList } from "../mutations/renameContentList.js";
import { renameMandatoryContentPreset } from "../mutations/renameMandatoryContentPreset.js";
import { renameContentCountLimitPreset } from "../mutations/renameContentCountLimitPreset.js";
import { setZoneContentBudgets, type ZoneContentBudgetField, type ZoneContentBudgets } from "../mutations/updateZoneContent.js";
import { setZoneContentPools, type ZoneContentPoolField } from "../mutations/updateZonePools.js";
import { setZoneContentCountLimitPresets, setZoneMandatoryContentPresets } from "../mutations/updateZonePresets.js";
import { updateConnectionEndpoints } from "../mutations/updateConnection.js";
import {
  updateConnectionSettings,
  type ConnectionSettings,
  type UpdateConnectionSettingsInput,
} from "../mutations/updateConnectionSettings.js";
import { updateConnectionType, type UpdateConnectionTypeInput } from "../mutations/updateConnectionType.js";
import { updateContentCountLimitPreset } from "../mutations/updateContentCountLimitPreset.js";
import { updateContentList } from "../mutations/updateContentList.js";
import { updateContentPoolGroup, type ContentPoolGroupSettings } from "../mutations/updateContentPoolGroup.js";
import { updateContentPoolValueDistribution } from "../mutations/updateContentPoolValueDistribution.js";
import { updateGlobalBans, type GlobalBansSettings } from "../mutations/updateGlobalBans.js";
import { updateLocalContentPool } from "../mutations/updateLocalContentPool.js";
import { updateMainObject, type MainObjectSettings } from "../mutations/updateMainObject.js";
import { updateMandatoryContentPreset } from "../mutations/updateMandatoryContentPreset.js";
import { updateTemplateSettings, type GameRuleSettings } from "../mutations/updateTemplateSettings.js";
import { updateZoneRoad, type RoadSettings } from "../mutations/updateZoneRoad.js";
import { updateZoneSettings, type ZoneSettings } from "../mutations/updateZoneSettings.js";
import type { MutationResult } from "../mutations/mutationTypes.js";
import { actionError, cloneActionValue, isRecord } from "./actionResult.js";
import type { EditorActionOptions, EditorActionSelection, EditorFieldUpdateAction } from "./editorActionTypes.js";

const ZONE_SETTING_FIELD_KEYS = {
  "zone.size": "size",
  "zone.layout": "layout",
  "zone.zoneBiome": "zoneBiome",
  "zone.contentBiome": "contentBiome",
  "zone.metaObjectsBiome": "metaObjectsBiome",
  "zone.crossroadsPosition": "crossroadsPosition",
  "zone.guardMultiplier": "guardMultiplier",
  "zone.guardCutoffValue": "guardCutoffValue",
  "zone.guardRandomization": "guardRandomization",
  "zone.guardWeeklyIncrement": "guardWeeklyIncrement",
  "zone.guardReactionDistribution": "guardReactionDistribution",
  "zone.encounterHolesSettings": "encounterHolesSettings",
} as const;

const ZONE_CONTENT_POOL_FIELD_KEYS = {
  "zone.guardedContentPool": "guardedContentPool",
  "zone.unguardedContentPool": "unguardedContentPool",
  "zone.resourcesContentPool": "resourcesContentPool",
} as const;

const ZONE_BUDGET_FIELD_KEYS = {
  "zone.guardedContentValue": "guardedContentValue",
  "zone.guardedContentValuePerArea": "guardedContentValuePerArea",
  "zone.unguardedContentValue": "unguardedContentValue",
  "zone.resourcesValue": "resourcesValue",
} as const;

const MAIN_OBJECT_FIELD_KEYS = {
  "mainObject.type": "type",
  "mainObject.spawn": "spawn",
  "mainObject.owner": "owner",
  "mainObject.faction": "faction",
  "mainObject.placement": "placement",
  "mainObject.holdCityWinCon": "holdCityWinCon",
} as const;

const CONNECTION_SETTING_FIELD_KEYS = {
  "connection.length": "length",
  "connection.portalFromEnabled": "portalFromEnabled",
  "connection.portalToEnabled": "portalToEnabled",
  "connection.guardZone": "guardZone",
  "connection.guardValue": "guardValue",
  "connection.guardWeeklyIncrement": "guardWeeklyIncrement",
  "connection.guardReaction": "guardReaction",
  "connection.guardEscape": "guardEscape",
  "connection.guardMatchGroup": "guardMatchGroup",
  "connection.gatePlacement": "gatePlacement",
  "connection.portalPlacementRulesFrom": "portalPlacementRulesFrom",
  "connection.portalPlacementRulesTo": "portalPlacementRulesTo",
  "connection.road": "road",
  "connection.simTurnSquad": "simTurnSquad",
  "connection.guardRandomization": "guardRandomization",
} as const;

const ROAD_SETTING_FIELD_KEYS = {
  "road.type": "type",
  "road.from": "from",
  "road.to": "to",
} as const;

const GAME_RULE_FIELD_KEYS = {
  "gameRules.heroCountMin": "heroCountMin",
  "gameRules.heroCountMax": "heroCountMax",
  "gameRules.heroCountIncrement": "heroCountIncrement",
  "gameRules.heroHireBan": "heroHireBan",
  "gameRules.encounterHoles": "encounterHoles",
  "gameRules.disableFactionLaws": "disableFactionLaws",
  "gameRules.disableMagicGuild": "disableMagicGuild",
  "gameRules.disableMagicCustomLearning": "disableMagicCustomLearning",
  "gameRules.tournamentRules": "tournamentRules",
  "gameRules.customAI": "customAI",
  "gameRules.factionLawsExpModifier": "factionLawsExpModifier",
  "gameRules.astrologyExpModifier": "astrologyExpModifier",
  "gameRules.bonuses": "bonuses",
} as const;

const WIN_CONDITION_FIELD_KEYS = {
  "winConditions.classic": "classic",
  "winConditions.desertion": "desertion",
  "winConditions.desertionDay": "desertionDay",
  "winConditions.desertionValue": "desertionValue",
  "winConditions.heroLighting": "heroLighting",
  "winConditions.heroLightingDay": "heroLightingDay",
  "winConditions.lostStartCity": "lostStartCity",
  "winConditions.lostStartCityDay": "lostStartCityDay",
  "winConditions.lostStartHero": "lostStartHero",
  "winConditions.gladiatorArena": "gladiatorArena",
  "winConditions.gladiatorArenaDaysDelayStart": "gladiatorArenaDaysDelayStart",
  "winConditions.gladiatorArenaCountDay": "gladiatorArenaCountDay",
  "winConditions.championSelectRule": "championSelectRule",
  "winConditions.cityHold": "cityHold",
  "winConditions.cityHoldDays": "cityHoldDays",
  "winConditions.tournament": "tournament",
  "winConditions.tournamentPointsToWin": "tournamentPointsToWin",
  "winConditions.tournamentDays": "tournamentDays",
  "winConditions.tournamentAnnounceDays": "tournamentAnnounceDays",
} as const;

const CONTENT_POOL_GROUP_FIELD_KEYS = {
  "contentPool.group.weight": "weight",
  "contentPool.group.includeLists": "includeLists",
  "contentPool.group.content": "content",
} as const;

const MANDATORY_CONTENT_ENTRY_FIELD_KEYS = {
  "mandatoryContent.entry.name": "name",
  "mandatoryContent.entry.includeLists": "includeLists",
  "mandatoryContent.entry.content": "content",
  "mandatoryContent.entry.sid": "sid",
  "mandatoryContent.entry.rules": "rules",
  "mandatoryContent.entry.designatedEncounter": "designatedEncounter",
  "mandatoryContent.entry.soloEncounter": "soloEncounter",
  "mandatoryContent.entry.isGuarded": "isGuarded",
  "mandatoryContent.entry.isMine": "isMine",
  "mandatoryContent.entry.owner": "owner",
} as const;

export function applyFieldUpdate(
  template: RmgTemplate,
  action: EditorFieldUpdateAction,
  options: EditorActionOptions = {},
): MutationResult<RmgTemplate> {
  try {
    return applyFieldUpdateUnsafe(template, action, options);
  } catch (error) {
    if (error instanceof InvalidEditorActionValue) {
      return error.result;
    }
    throw error;
  }
}

function applyFieldUpdateUnsafe(
  template: RmgTemplate,
  action: EditorFieldUpdateAction,
  options: EditorActionOptions,
): MutationResult<RmgTemplate> {
  const field = getEditorField(action.fieldId);
  if (!field) {
    return actionError(template, "editorAction.field.unknown", `Unknown editor field '${action.fieldId}'.`);
  }
  if (field.editLevel === "preserveOnly") {
    return actionError(
      template,
      "editorAction.field.preserveOnly",
      `Field '${action.fieldId}' is preserve-only and cannot be edited through field.update.`,
      field.path,
    );
  }

  switch (action.fieldId) {
    case "template.name":
      return updateTemplateSettings({ template, name: requireNullableString(template, action.fieldId, action.value) });
    case "template.description":
      return updateTemplateSettings({ template, description: requireNullableString(template, action.fieldId, action.value) });
    case "template.gameMode":
      return updateTemplateSettings({
        template,
        gameMode: requireString(template, action.fieldId, action.value) as GameMode,
        applyGameModeDefaults: options.applyGameModeDefaults ?? false,
      });
    case "template.displayWinCondition":
      return updateTemplateSettings({ template, displayWinCondition: requireNullableString(template, action.fieldId, action.value) });
    case "template.sizeX":
      return updateTemplateSettings({ template, sizeX: requireNumber(template, action.fieldId, action.value) });
    case "template.sizeZ":
      return updateTemplateSettings({ template, sizeZ: requireNumber(template, action.fieldId, action.value) });
    case "template.globalBans":
      return updateGlobalBans({ template, settings: toGlobalBansSettings(template, action.fieldId, action.value) });
    case "winConditions.preset":
      return updateTemplateSettings({
        template,
        winConditionPreset: requireString(template, action.fieldId, action.value) as WinConditionPresetId,
      });
  }

  if (action.fieldId in GAME_RULE_FIELD_KEYS) {
    const key = GAME_RULE_FIELD_KEYS[action.fieldId as keyof typeof GAME_RULE_FIELD_KEYS];
    const gameRules: GameRuleSettings = { [key]: cloneActionValue(action.value) } as GameRuleSettings;
    return updateTemplateSettings({ template, gameRules });
  }

  if (action.fieldId in WIN_CONDITION_FIELD_KEYS) {
    const key = WIN_CONDITION_FIELD_KEYS[action.fieldId as keyof typeof WIN_CONDITION_FIELD_KEYS];
    return updateTemplateSettings({
      template,
      winConditions: { [key]: cloneActionValue(action.value) },
    });
  }

  if (action.fieldId === "zone.name") {
    const selection = requireVariantZoneSelection(template, action);
    if ("ok" in selection) {
      return selection;
    }
    return renameZone({
      template,
      variantIndex: selection.variantIndex,
      zone: selection.zone,
      newName: requireString(template, action.fieldId, action.value),
    });
  }

  if (action.fieldId in ZONE_SETTING_FIELD_KEYS) {
    const selection = requireVariantZoneSelection(template, action);
    if ("ok" in selection) {
      return selection;
    }
    const key = ZONE_SETTING_FIELD_KEYS[action.fieldId as keyof typeof ZONE_SETTING_FIELD_KEYS];
    return updateZoneSettings({
      template,
      variantIndex: selection.variantIndex,
      zone: selection.zone,
      settings: { [key]: cloneActionValue(action.value) } as ZoneSettings,
    });
  }

  if (action.fieldId in ZONE_CONTENT_POOL_FIELD_KEYS) {
    const selection = requireVariantZoneSelection(template, action);
    if ("ok" in selection) {
      return selection;
    }
    return setZoneContentPools({
      template,
      variantIndex: selection.variantIndex,
      zone: selection.zone,
      field: ZONE_CONTENT_POOL_FIELD_KEYS[action.fieldId as keyof typeof ZONE_CONTENT_POOL_FIELD_KEYS] as ZoneContentPoolField,
      poolIds: requireStringArray(template, action.fieldId, action.value),
    });
  }

  if (action.fieldId in ZONE_BUDGET_FIELD_KEYS) {
    const selection = requireVariantZoneSelection(template, action);
    if ("ok" in selection) {
      return selection;
    }
    const fieldKey = ZONE_BUDGET_FIELD_KEYS[action.fieldId as keyof typeof ZONE_BUDGET_FIELD_KEYS] as ZoneContentBudgetField;
    return setZoneContentBudgets({
      template,
      variantIndex: selection.variantIndex,
      zone: selection.zone,
      budgets: { [fieldKey]: requireNumber(template, action.fieldId, action.value) } as ZoneContentBudgets,
    });
  }

  if (action.fieldId === "zone.mandatoryContent") {
    const selection = requireVariantZoneSelection(template, action);
    if ("ok" in selection) {
      return selection;
    }
    return setZoneMandatoryContentPresets({
      template,
      variantIndex: selection.variantIndex,
      zone: selection.zone,
      presetIds: requireStringArray(template, action.fieldId, action.value),
    });
  }

  if (action.fieldId === "zone.contentCountLimits") {
    const selection = requireVariantZoneSelection(template, action);
    if ("ok" in selection) {
      return selection;
    }
    return setZoneContentCountLimitPresets({
      template,
      variantIndex: selection.variantIndex,
      zone: selection.zone,
      presetIds: requireStringArray(template, action.fieldId, action.value),
    });
  }

  if (action.fieldId in MAIN_OBJECT_FIELD_KEYS) {
    const selection = requireMainObjectSelection(template, action);
    if ("ok" in selection) {
      return selection;
    }
    const key = MAIN_OBJECT_FIELD_KEYS[action.fieldId as keyof typeof MAIN_OBJECT_FIELD_KEYS];
    return updateMainObject({
      template,
      variantIndex: selection.variantIndex,
      zone: selection.zone,
      mainObject: selection.mainObject,
      settings: { [key]: cloneActionValue(action.value) } as MainObjectSettings,
    });
  }

  if (action.fieldId === "connection.name") {
    const selection = requireVariantConnectionSelection(template, action);
    if ("ok" in selection) {
      return selection;
    }
    return renameConnection({
      template,
      variantIndex: selection.variantIndex,
      connection: selection.connection,
      newName: requireString(template, action.fieldId, action.value),
    });
  }

  if (action.fieldId === "connection.from" || action.fieldId === "connection.to") {
    return updateSingleConnectionEndpoint(template, action);
  }

  if (action.fieldId === "connection.connectionType") {
    const selection = requireVariantConnectionSelection(template, action);
    if ("ok" in selection) {
      return selection;
    }
    const input: UpdateConnectionTypeInput = {
      template,
      variantIndex: selection.variantIndex,
      connection: selection.connection,
      connectionType: requireString(template, action.fieldId, action.value) as UpdateConnectionTypeInput["connectionType"],
    };
    if (options.normalizePortalDefaults !== undefined) {
      input.normalizePortalDefaults = options.normalizePortalDefaults;
    }
    return updateConnectionType(input);
  }

  if (action.fieldId in CONNECTION_SETTING_FIELD_KEYS) {
    const selection = requireVariantConnectionSelection(template, action);
    if ("ok" in selection) {
      return selection;
    }
    const key = CONNECTION_SETTING_FIELD_KEYS[action.fieldId as keyof typeof CONNECTION_SETTING_FIELD_KEYS];
    const input: UpdateConnectionSettingsInput = {
      template,
      variantIndex: selection.variantIndex,
      connection: selection.connection,
      settings: { [key]: cloneActionValue(action.value) } as ConnectionSettings,
    };
    if (options.normalizePortalDefaults !== undefined) {
      input.normalizePortalDefaults = options.normalizePortalDefaults;
    }
    return updateConnectionSettings(input);
  }

  if (action.fieldId in ROAD_SETTING_FIELD_KEYS) {
    const selection = requireRoadSelection(template, action);
    if ("ok" in selection) {
      return selection;
    }
    const key = ROAD_SETTING_FIELD_KEYS[action.fieldId as keyof typeof ROAD_SETTING_FIELD_KEYS];
    return updateZoneRoad({
      template,
      variantIndex: selection.variantIndex,
      zone: selection.zone,
      roadIndex: selection.roadIndex,
      settings: { [key]: cloneActionValue(action.value) } as RoadSettings,
    });
  }

  if (action.fieldId === "contentPool.name") {
    if (!action.selection?.pool) {
      return actionError(template, "editorAction.selection.poolMissing", "Field update requires a content pool selection.");
    }
    return renameLocalContentPool({
      template,
      pool: action.selection.pool,
      newName: requireString(template, action.fieldId, action.value),
    });
  }

  if (action.fieldId === "contentPool.valueDistribution") {
    if (!action.selection?.pool) {
      return actionError(template, "editorAction.selection.poolMissing", "Field update requires a content pool selection.");
    }
    return updateContentPoolValueDistribution({
      template,
      pool: action.selection.pool,
      valueDistribution: action.value === null ? null : cloneActionValue(action.value) as never,
    });
  }

  if (action.fieldId === "contentPool.groups" || action.fieldId === "contentPool.bans") {
    if (!action.selection?.pool) {
      return actionError(template, "editorAction.selection.poolMissing", "Field update requires a content pool selection.");
    }
    const key = action.fieldId === "contentPool.groups" ? "groups" : "bans";
    return updateLocalContentPool({
      template,
      pool: action.selection.pool,
      settings: { [key]: cloneActionValue(action.value) },
    });
  }

  if (action.fieldId in CONTENT_POOL_GROUP_FIELD_KEYS) {
    if (!action.selection?.pool || action.selection.groupIndex === undefined) {
      return actionError(template, "editorAction.selection.poolGroupMissing", "Field update requires content pool and group selections.");
    }
    const key = CONTENT_POOL_GROUP_FIELD_KEYS[action.fieldId as keyof typeof CONTENT_POOL_GROUP_FIELD_KEYS];
    return updateContentPoolGroup({
      template,
      pool: action.selection.pool,
      groupIndex: action.selection.groupIndex,
      settings: { [key]: cloneActionValue(action.value) } as ContentPoolGroupSettings,
    });
  }

  if (action.fieldId === "contentList.name") {
    if (!action.selection?.list) {
      return actionError(template, "editorAction.selection.contentListMissing", "Field update requires a content list selection.");
    }
    return renameContentList({
      template,
      list: action.selection.list,
      newName: requireString(template, action.fieldId, action.value),
    });
  }

  if (action.fieldId === "contentList.content") {
    if (!action.selection?.list) {
      return actionError(template, "editorAction.selection.contentListMissing", "Field update requires a content list selection.");
    }
    return updateContentList({
      template,
      list: action.selection.list,
      settings: { content: cloneActionValue(action.value) as ContentWeight[] },
    });
  }

  if (action.fieldId === "contentCountLimit.name") {
    if (!action.selection?.contentCountLimitPreset) {
      return actionError(template, "editorAction.selection.countLimitMissing", "Field update requires a content-count-limit preset selection.");
    }
    return renameContentCountLimitPreset({
      template,
      preset: action.selection.contentCountLimitPreset,
      newName: requireString(template, action.fieldId, action.value),
    });
  }

  if (action.fieldId === "contentCountLimit.limits") {
    if (!action.selection?.contentCountLimitPreset) {
      return actionError(template, "editorAction.selection.countLimitMissing", "Field update requires a content-count-limit preset selection.");
    }
    return updateContentCountLimitPreset({
      template,
      preset: action.selection.contentCountLimitPreset,
      settings: { limits: cloneActionValue(action.value) as ContentCountLimit[] },
    });
  }

  if (action.fieldId === "mandatoryContent.name") {
    if (!action.selection?.mandatoryContentPreset) {
      return actionError(template, "editorAction.selection.mandatoryPresetMissing", "Field update requires a mandatory-content preset selection.");
    }
    return renameMandatoryContentPreset({
      template,
      preset: action.selection.mandatoryContentPreset,
      newName: requireString(template, action.fieldId, action.value),
    });
  }

  if (action.fieldId === "mandatoryContent.content") {
    if (!action.selection?.mandatoryContentPreset) {
      return actionError(template, "editorAction.selection.mandatoryPresetMissing", "Field update requires a mandatory-content preset selection.");
    }
    return updateMandatoryContentPreset({
      template,
      preset: action.selection.mandatoryContentPreset,
      settings: { content: cloneActionValue(action.value) as MandatoryContent[] },
    });
  }

  if (action.fieldId in MANDATORY_CONTENT_ENTRY_FIELD_KEYS) {
    return updateMandatoryContentEntryField(template, action);
  }

  return actionError(
    template,
    "editorAction.field.unsupported",
    `Field '${action.fieldId}' is known, but field.update does not route it yet. Use a typed entity action or raw compatibility editor.`,
    field.path,
  );
}

function updateSingleConnectionEndpoint(template: RmgTemplate, action: EditorFieldUpdateAction): MutationResult<RmgTemplate> {
  const selection = requireVariantConnectionSelection(template, action);
  if ("ok" in selection) {
    return selection;
  }
  const current = resolveConnection(template, selection.variantIndex, selection.connection);
  if (!current?.from || !current.to) {
    return actionError(template, "editorAction.connection.endpointMissing", "Selected connection must have both endpoints before editing one endpoint.");
  }
  return updateConnectionEndpoints({
    template,
    variantIndex: selection.variantIndex,
    connection: selection.connection,
    from: action.fieldId === "connection.from" ? requireString(template, action.fieldId, action.value) : current.from,
    to: action.fieldId === "connection.to" ? requireString(template, action.fieldId, action.value) : current.to,
  });
}

function updateMandatoryContentEntryField(template: RmgTemplate, action: EditorFieldUpdateAction): MutationResult<RmgTemplate> {
  const presetSelector = action.selection?.mandatoryContentPreset;
  const entryIndex = action.selection?.mandatoryContentEntryIndex;
  if (!presetSelector || entryIndex === undefined) {
    return actionError(
      template,
      "editorAction.selection.mandatoryEntryMissing",
      "Field update requires mandatory-content preset and entry selections.",
    );
  }
  const preset = resolveMandatoryContentPreset(template, presetSelector);
  if (!preset) {
    return actionError(template, "editorAction.selection.mandatoryPresetMissing", "Selected mandatory-content preset does not exist.");
  }
  const content = cloneActionValue(preset.content ?? []);
  const entry = content[entryIndex];
  if (!entry) {
    return actionError(
      template,
      "editorAction.selection.mandatoryEntryMissing",
      `Mandatory-content entry index ${entryIndex} does not exist.`,
      "$.mandatoryContent",
    );
  }

  const key = MANDATORY_CONTENT_ENTRY_FIELD_KEYS[action.fieldId as keyof typeof MANDATORY_CONTENT_ENTRY_FIELD_KEYS];
  if (action.value === null) {
    delete (entry as Record<string, unknown>)[key];
  } else {
    (entry as Record<string, unknown>)[key] = cloneActionValue(action.value);
  }
  return updateMandatoryContentPreset({
    template,
    preset: presetSelector,
    settings: { content },
  });
}

function requireVariantZoneSelection(
  template: RmgTemplate,
  action: EditorFieldUpdateAction,
): { variantIndex: number; zone: NonNullable<EditorActionSelection["zone"]> } | MutationResult<RmgTemplate> {
  if (action.selection?.variantIndex === undefined || !action.selection.zone) {
    return actionError(template, "editorAction.selection.zoneMissing", "Field update requires variant and zone selections.");
  }
  return { variantIndex: action.selection.variantIndex, zone: action.selection.zone };
}

function requireVariantConnectionSelection(
  template: RmgTemplate,
  action: EditorFieldUpdateAction,
): { variantIndex: number; connection: NonNullable<EditorActionSelection["connection"]> } | MutationResult<RmgTemplate> {
  if (action.selection?.variantIndex === undefined || !action.selection.connection) {
    return actionError(template, "editorAction.selection.connectionMissing", "Field update requires variant and connection selections.");
  }
  return { variantIndex: action.selection.variantIndex, connection: action.selection.connection };
}

function requireMainObjectSelection(
  template: RmgTemplate,
  action: EditorFieldUpdateAction,
): {
  variantIndex: number;
  zone: NonNullable<EditorActionSelection["zone"]>;
  mainObject: NonNullable<EditorActionSelection["mainObject"]>;
} | MutationResult<RmgTemplate> {
  if (action.selection?.variantIndex === undefined || !action.selection.zone || !action.selection.mainObject) {
    return actionError(template, "editorAction.selection.mainObjectMissing", "Field update requires variant, zone, and main-object selections.");
  }
  return { variantIndex: action.selection.variantIndex, zone: action.selection.zone, mainObject: action.selection.mainObject };
}

function requireRoadSelection(
  template: RmgTemplate,
  action: EditorFieldUpdateAction,
): {
  variantIndex: number;
  zone: NonNullable<EditorActionSelection["zone"]>;
  roadIndex: number;
} | MutationResult<RmgTemplate> {
  if (action.selection?.variantIndex === undefined || !action.selection.zone || action.selection.roadIndex === undefined) {
    return actionError(template, "editorAction.selection.roadMissing", "Field update requires variant, zone, and road selections.");
  }
  return { variantIndex: action.selection.variantIndex, zone: action.selection.zone, roadIndex: action.selection.roadIndex };
}

function resolveConnection(
  template: RmgTemplate,
  variantIndex: number,
  selector: NonNullable<EditorActionSelection["connection"]>,
) {
  const connections = template.variants?.[variantIndex]?.connections ?? [];
  const connectionIndex = "connectionIndex" in selector
    ? selector.connectionIndex
    : connections.findIndex((connection) => connection.name === selector.connectionName);
  return connections[connectionIndex];
}

function resolveMandatoryContentPreset(
  template: RmgTemplate,
  selector: NonNullable<EditorActionSelection["mandatoryContentPreset"]>,
) {
  const presets = template.mandatoryContent ?? [];
  const presetIndex = "presetIndex" in selector
    ? selector.presetIndex
    : presets.findIndex((preset) => preset.name === selector.presetName);
  return presets[presetIndex];
}

function requireString(template: RmgTemplate, fieldId: string, value: unknown): string {
  if (typeof value !== "string") {
    throwInvalidValue(template, fieldId, "a string");
  }
  return value;
}

function requireNullableString(template: RmgTemplate, fieldId: string, value: unknown): string | null {
  if (value !== null && typeof value !== "string") {
    throwInvalidValue(template, fieldId, "a string or null");
  }
  return value;
}

function requireNumber(template: RmgTemplate, fieldId: string, value: unknown): number {
  if (typeof value !== "number") {
    throwInvalidValue(template, fieldId, "a number");
  }
  return value;
}

function requireStringArray(template: RmgTemplate, fieldId: string, value: unknown): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throwInvalidValue(template, fieldId, "an array of strings");
  }
  return [...value];
}

function toGlobalBansSettings(template: RmgTemplate, fieldId: string, value: unknown): GlobalBansSettings {
  if (value === null) {
    return { magics: null, items: null, skills: null, heroes: null, units: null };
  }
  if (!isRecord(value)) {
    throwInvalidValue(template, fieldId, "a global bans object or null");
  }
  const settings: GlobalBansSettings = {};
  for (const key of ["magics", "items", "skills", "heroes", "units"] as const) {
    const fieldValue = value[key];
    if (fieldValue === undefined) {
      continue;
    }
    if (fieldValue === null) {
      settings[key] = null;
    } else if (Array.isArray(fieldValue) && fieldValue.every((item) => typeof item === "string")) {
      settings[key] = [...fieldValue];
    } else {
      throwInvalidValue(template, `${fieldId}.${key}`, "an array of strings or null");
    }
  }
  return settings;
}

function throwInvalidValue(template: RmgTemplate, fieldId: string, expected: string): never {
  const result = actionError(
    template,
    "editorAction.field.valueInvalid",
    `Field '${fieldId}' expected ${expected}.`,
    getEditorField(fieldId)?.path ?? "$",
  );
  throw new InvalidEditorActionValue(result);
}

export class InvalidEditorActionValue extends Error {
  constructor(public readonly result: MutationResult<RmgTemplate>) {
    super(result.diagnostics[0]?.message ?? "Invalid editor action value.");
  }
}
