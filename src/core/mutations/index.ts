export { cloneTemplate } from "./cloneTemplate.js";
export {
  createDefaultBorder,
  createDefaultConnection,
  createDefaultGameRules,
  createDefaultMainObject,
  createDefaultOrientation,
  createDefaultTemplate,
  createDefaultVariant,
  createDefaultWinConditions,
  createDefaultZone,
  ensureGameRules,
  type DefaultConnectionOptions,
  type DefaultMainObjectOptions,
  type DefaultTemplateOptions,
  type DefaultVariantOptions,
  type DefaultZoneOptions,
} from "./defaultObjects.js";
export { addConnection, type AddConnectionInput } from "./addConnection.js";
export { addContentCountLimitPreset, type AddContentCountLimitPresetInput } from "./addContentCountLimitPreset.js";
export { addContentList, type AddContentListInput } from "./addContentList.js";
export { addContentPoolBan, type AddContentPoolBanInput } from "./addContentPoolBan.js";
export { addContentPoolGroup, type AddContentPoolGroupInput } from "./addContentPoolGroup.js";
export { addLocalContentPool, type AddLocalContentPoolInput } from "./addLocalContentPool.js";
export { cloneCoreContentPoolToLocal, type CloneCoreContentPoolToLocalInput } from "./cloneCoreContentPoolToLocal.js";
export { addMainObject, type AddMainObjectInput } from "./addMainObject.js";
export { addMandatoryContentPreset, type AddMandatoryContentPresetInput } from "./addMandatoryContentPreset.js";
export { addVariant, type AddVariantInput } from "./addVariant.js";
export { addZone, type AddZoneInput } from "./addZone.js";
export { addZoneLayout, type AddZoneLayoutInput } from "./addZoneLayout.js";
export { cloneZone, type CloneZoneInput } from "./cloneZone.js";
export { addZoneRoad, type AddZoneRoadInput } from "./addZoneRoad.js";
export { createMinimalPlayableTemplate, type MinimalPlayableTemplateOptions } from "./minimalPlayableTemplate.js";
export { removeConnection, type RemoveConnectionInput } from "./removeConnection.js";
export { removeContentCountLimitPreset, type RemoveContentCountLimitPresetInput } from "./removeContentCountLimitPreset.js";
export { removeContentList, type RemoveContentListInput } from "./removeContentList.js";
export { removeContentPoolBan, type RemoveContentPoolBanInput } from "./removeContentPoolBan.js";
export { removeContentPoolGroup, type RemoveContentPoolGroupInput } from "./removeContentPoolGroup.js";
export { removeLocalContentPool, type RemoveLocalContentPoolInput } from "./removeLocalContentPool.js";
export { removeMainObject, type RemoveMainObjectInput } from "./removeMainObject.js";
export { removeMandatoryContentPreset, type RemoveMandatoryContentPresetInput } from "./removeMandatoryContentPreset.js";
export { removeVariant, type RemoveVariantInput } from "./removeVariant.js";
export { removeZone, type RemoveZoneInput } from "./removeZone.js";
export { removeZoneLayout, type RemoveZoneLayoutInput } from "./removeZoneLayout.js";
export { removeZoneRoad, type RemoveZoneRoadInput } from "./removeZoneRoad.js";
export { renameContentCountLimitPreset, type RenameContentCountLimitPresetInput } from "./renameContentCountLimitPreset.js";
export { renameConnection, type RenameConnectionInput } from "./renameConnection.js";
export { renameContentList, type RenameContentListInput } from "./renameContentList.js";
export { renameLocalContentPool, type RenameLocalContentPoolInput } from "./renameLocalContentPool.js";
export { renameMandatoryContentPreset, type RenameMandatoryContentPresetInput } from "./renameMandatoryContentPreset.js";
export { renameZone, type RenameZoneInput } from "./renameZone.js";
export { renameZoneLayout, type RenameZoneLayoutInput } from "./renameZoneLayout.js";
export { moveContentPoolBan, type MoveContentPoolBanInput } from "./moveContentPoolBan.js";
export { moveContentPoolGroup, type MoveContentPoolGroupInput } from "./moveContentPoolGroup.js";
export { updateConnectionSettings, type ConnectionSettings, type UpdateConnectionSettingsInput } from "./updateConnectionSettings.js";
export { updateConnectionType, type UpdateConnectionTypeInput } from "./updateConnectionType.js";
export { updateConnectionEndpoints, type UpdateConnectionEndpointsInput } from "./updateConnection.js";
export { updateContentCountLimitPreset, type ContentCountLimitPresetSettings, type UpdateContentCountLimitPresetInput } from "./updateContentCountLimitPreset.js";
export { updateContentList, type ContentListSettings, type UpdateContentListInput } from "./updateContentList.js";
export { updateContentPoolBan, type UpdateContentPoolBanInput } from "./updateContentPoolBan.js";
export { updateContentPoolGroup, type ContentPoolGroupSettings, type UpdateContentPoolGroupInput } from "./updateContentPoolGroup.js";
export { updateContentPoolValueDistribution, type UpdateContentPoolValueDistributionInput } from "./updateContentPoolValueDistribution.js";
export { updateLocalContentPool, type LocalContentPoolSettings, type UpdateLocalContentPoolInput } from "./updateLocalContentPool.js";
export { updateMainObject, type MainObjectSettings, type UpdateMainObjectInput } from "./updateMainObject.js";
export { updateMandatoryContentPreset, type MandatoryContentPresetSettings, type UpdateMandatoryContentPresetInput } from "./updateMandatoryContentPreset.js";
export { updateTemplateSettings, type GameRuleSettings, type UpdateTemplateSettingsInput } from "./updateTemplateSettings.js";
export { updateZoneLayout, type ZoneLayoutSettings, type UpdateZoneLayoutInput } from "./updateZoneLayout.js";
export { updateZoneRoad, type RoadSettings, type UpdateZoneRoadInput } from "./updateZoneRoad.js";
export { setZoneContentBudgets, type SetZoneContentBudgetsInput, type ZoneContentBudgetField, type ZoneContentBudgets } from "./updateZoneContent.js";
export { setZoneContentPools, type SetZoneContentPoolsInput, type ZoneContentPoolField } from "./updateZonePools.js";
export {
  setZoneContentCountLimitPresets,
  setZoneMandatoryContentPresets,
  type SetZoneContentCountLimitPresetsInput,
  type SetZoneMandatoryContentPresetsInput,
  type SetZonePresetAlternativesInput,
} from "./updateZonePresets.js";
export { type RoadStubInput } from "./roadHelpers.js";
export { updateZoneSettings, type UpdateZoneSettingsInput, type ZoneSettings } from "./updateZoneSettings.js";
export { addValueOverride, type AddValueOverrideInput } from "./addValueOverride.js";
export { removeValueOverride, type RemoveValueOverrideInput } from "./removeValueOverride.js";
export { updateValueOverride, type UpdateValueOverrideInput, type ValueOverrideSettings } from "./updateValueOverride.js";
export { updateGlobalBans, type UpdateGlobalBansInput, type GlobalBansSettings } from "./updateGlobalBans.js";
export { createTransactionHistory, pushTransaction, canUndo, undo, canRedo, redo, getCurrentTemplate, clearHistory } from "./transactionManager.js";
export type { TransactionFrame, TransactionHistory } from "./transactionManager.js";
export { runBulkZoneMutation, runBulkConnectionMutation, runBulkMainObjectMutation } from "./bulkMutations.js";
export type { BulkZoneMutationInput, BulkConnectionMutationInput, BulkMainObjectMutationInput } from "./bulkMutations.js";
export type * from "./mutationTypes.js";
