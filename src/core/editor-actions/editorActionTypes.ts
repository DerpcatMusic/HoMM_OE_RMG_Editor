import type { AddConnectionInput } from "../mutations/addConnection.js";
import type { AddContentCountLimitPresetInput } from "../mutations/addContentCountLimitPreset.js";
import type { AddContentListInput } from "../mutations/addContentList.js";
import type { AddContentPoolBanInput } from "../mutations/addContentPoolBan.js";
import type { AddContentPoolGroupInput } from "../mutations/addContentPoolGroup.js";
import type { AddLocalContentPoolInput } from "../mutations/addLocalContentPool.js";
import type { AddMainObjectInput } from "../mutations/addMainObject.js";
import type { AddMandatoryContentPresetInput } from "../mutations/addMandatoryContentPreset.js";
import type { AddValueOverrideInput } from "../mutations/addValueOverride.js";
import type { AddVariantInput } from "../mutations/addVariant.js";
import type { AddZoneInput } from "../mutations/addZone.js";
import type { AddZoneLayoutInput } from "../mutations/addZoneLayout.js";
import type { AddZoneRoadInput } from "../mutations/addZoneRoad.js";
import type { CloneCoreContentPoolToLocalInput } from "../mutations/cloneCoreContentPoolToLocal.js";
import type { CloneZoneInput } from "../mutations/cloneZone.js";
import type { MoveContentPoolBanInput } from "../mutations/moveContentPoolBan.js";
import type { MoveContentPoolGroupInput } from "../mutations/moveContentPoolGroup.js";
import type { MutationResult } from "../mutations/mutationTypes.js";
import type {
  ConnectionSelector,
  ContentCountLimitPresetSelector,
  ContentListSelector,
  ContentPoolSelector,
  MainObjectSelector,
  MandatoryContentPresetSelector,
  ZoneLayoutSelector,
  ZoneSelector,
} from "../mutations/mutationTypes.js";
import type { RemoveConnectionInput } from "../mutations/removeConnection.js";
import type { RemoveContentCountLimitPresetInput } from "../mutations/removeContentCountLimitPreset.js";
import type { RemoveContentListInput } from "../mutations/removeContentList.js";
import type { RemoveContentPoolBanInput } from "../mutations/removeContentPoolBan.js";
import type { RemoveContentPoolGroupInput } from "../mutations/removeContentPoolGroup.js";
import type { RemoveLocalContentPoolInput } from "../mutations/removeLocalContentPool.js";
import type { RemoveMainObjectInput } from "../mutations/removeMainObject.js";
import type { RemoveMandatoryContentPresetInput } from "../mutations/removeMandatoryContentPreset.js";
import type { RemoveValueOverrideInput } from "../mutations/removeValueOverride.js";
import type { RemoveVariantInput } from "../mutations/removeVariant.js";
import type { RemoveZoneInput } from "../mutations/removeZone.js";
import type { RemoveZoneLayoutInput } from "../mutations/removeZoneLayout.js";
import type { RemoveZoneRoadInput } from "../mutations/removeZoneRoad.js";
import type { RenameConnectionInput } from "../mutations/renameConnection.js";
import type { RenameContentCountLimitPresetInput } from "../mutations/renameContentCountLimitPreset.js";
import type { RenameContentListInput } from "../mutations/renameContentList.js";
import type { RenameLocalContentPoolInput } from "../mutations/renameLocalContentPool.js";
import type { RenameMandatoryContentPresetInput } from "../mutations/renameMandatoryContentPreset.js";
import type { RenameZoneInput } from "../mutations/renameZone.js";
import type { RenameZoneLayoutInput } from "../mutations/renameZoneLayout.js";
import type { TransactionHistory } from "../mutations/transactionManager.js";
import type { UpdateConnectionEndpointsInput } from "../mutations/updateConnection.js";
import type { UpdateConnectionSettingsInput } from "../mutations/updateConnectionSettings.js";
import type { UpdateConnectionTypeInput } from "../mutations/updateConnectionType.js";
import type { UpdateContentCountLimitPresetInput } from "../mutations/updateContentCountLimitPreset.js";
import type { UpdateContentListInput } from "../mutations/updateContentList.js";
import type { UpdateContentPoolBanInput } from "../mutations/updateContentPoolBan.js";
import type { UpdateContentPoolGroupInput } from "../mutations/updateContentPoolGroup.js";
import type { UpdateContentPoolValueDistributionInput } from "../mutations/updateContentPoolValueDistribution.js";
import type { UpdateGlobalBansInput } from "../mutations/updateGlobalBans.js";
import type { UpdateLocalContentPoolInput } from "../mutations/updateLocalContentPool.js";
import type { UpdateMainObjectInput } from "../mutations/updateMainObject.js";
import type { UpdateMandatoryContentPresetInput } from "../mutations/updateMandatoryContentPreset.js";
import type { UpdateTemplateSettingsInput } from "../mutations/updateTemplateSettings.js";
import type { UpdateValueOverrideInput } from "../mutations/updateValueOverride.js";
import type { UpdateZoneLayoutInput } from "../mutations/updateZoneLayout.js";
import type { UpdateZoneRoadInput } from "../mutations/updateZoneRoad.js";
import type { SetZoneContentBudgetsInput } from "../mutations/updateZoneContent.js";
import type { SetZoneContentPoolsInput } from "../mutations/updateZonePools.js";
import type {
  SetZoneContentCountLimitPresetsInput,
  SetZoneMandatoryContentPresetsInput,
} from "../mutations/updateZonePresets.js";
import type { UpdateZoneSettingsInput } from "../mutations/updateZoneSettings.js";
import type { RmgTemplate } from "../rmg/rmgTypes.js";

export interface EditorActionSelection {
  variantIndex?: number;
  zone?: ZoneSelector;
  connection?: ConnectionSelector;
  mainObject?: MainObjectSelector;
  roadIndex?: number;
  pool?: ContentPoolSelector;
  groupIndex?: number;
  banIndex?: number;
  list?: ContentListSelector;
  mandatoryContentPreset?: MandatoryContentPresetSelector;
  mandatoryContentEntryIndex?: number;
  contentCountLimitPreset?: ContentCountLimitPresetSelector;
  valueOverrideIndex?: number;
  zoneLayout?: ZoneLayoutSelector;
}

export interface EditorFieldUpdateAction {
  type: "field.update";
  fieldId: string;
  value: unknown;
  selection?: EditorActionSelection;
}

type WithoutTemplate<TInput extends { template: RmgTemplate }> = Omit<TInput, "template">;

export type EditorEntityAction =
  | { type: "template.update"; input: WithoutTemplate<UpdateTemplateSettingsInput> }
  | { type: "globalBans.update"; input: WithoutTemplate<UpdateGlobalBansInput> }
  | { type: "variant.add"; input: WithoutTemplate<AddVariantInput> }
  | { type: "variant.remove"; input: WithoutTemplate<RemoveVariantInput> }
  | { type: "zone.add"; input: WithoutTemplate<AddZoneInput> }
  | { type: "zone.remove"; input: WithoutTemplate<RemoveZoneInput> }
  | { type: "zone.clone"; input: WithoutTemplate<CloneZoneInput> }
  | { type: "zone.rename"; input: WithoutTemplate<RenameZoneInput> }
  | { type: "zone.updateSettings"; input: WithoutTemplate<UpdateZoneSettingsInput> }
  | { type: "zone.setContentPools"; input: WithoutTemplate<SetZoneContentPoolsInput> }
  | { type: "zone.setContentBudgets"; input: WithoutTemplate<SetZoneContentBudgetsInput> }
  | { type: "zone.setMandatoryContentPresets"; input: WithoutTemplate<SetZoneMandatoryContentPresetsInput> }
  | { type: "zone.setContentCountLimitPresets"; input: WithoutTemplate<SetZoneContentCountLimitPresetsInput> }
  | { type: "connection.add"; input: WithoutTemplate<AddConnectionInput> }
  | { type: "connection.remove"; input: WithoutTemplate<RemoveConnectionInput> }
  | { type: "connection.rename"; input: WithoutTemplate<RenameConnectionInput> }
  | { type: "connection.updateEndpoints"; input: WithoutTemplate<UpdateConnectionEndpointsInput> }
  | { type: "connection.updateType"; input: WithoutTemplate<UpdateConnectionTypeInput> }
  | { type: "connection.updateSettings"; input: WithoutTemplate<UpdateConnectionSettingsInput> }
  | { type: "mainObject.add"; input: WithoutTemplate<AddMainObjectInput> }
  | { type: "mainObject.remove"; input: WithoutTemplate<RemoveMainObjectInput> }
  | { type: "mainObject.update"; input: WithoutTemplate<UpdateMainObjectInput> }
  | { type: "road.add"; input: WithoutTemplate<AddZoneRoadInput> }
  | { type: "road.update"; input: WithoutTemplate<UpdateZoneRoadInput> }
  | { type: "road.remove"; input: WithoutTemplate<RemoveZoneRoadInput> }
  | { type: "contentPool.add"; input: WithoutTemplate<AddLocalContentPoolInput> }
  | { type: "contentPool.remove"; input: WithoutTemplate<RemoveLocalContentPoolInput> }
  | { type: "contentPool.rename"; input: WithoutTemplate<RenameLocalContentPoolInput> }
  | { type: "contentPool.update"; input: WithoutTemplate<UpdateLocalContentPoolInput> }
  | { type: "contentPool.cloneCore"; input: WithoutTemplate<CloneCoreContentPoolToLocalInput> }
  | { type: "contentPool.valueDistribution.update"; input: WithoutTemplate<UpdateContentPoolValueDistributionInput> }
  | { type: "contentPool.group.add"; input: WithoutTemplate<AddContentPoolGroupInput> }
  | { type: "contentPool.group.update"; input: WithoutTemplate<UpdateContentPoolGroupInput> }
  | { type: "contentPool.group.move"; input: WithoutTemplate<MoveContentPoolGroupInput> }
  | { type: "contentPool.group.remove"; input: WithoutTemplate<RemoveContentPoolGroupInput> }
  | { type: "contentPool.ban.add"; input: WithoutTemplate<AddContentPoolBanInput> }
  | { type: "contentPool.ban.update"; input: WithoutTemplate<UpdateContentPoolBanInput> }
  | { type: "contentPool.ban.move"; input: WithoutTemplate<MoveContentPoolBanInput> }
  | { type: "contentPool.ban.remove"; input: WithoutTemplate<RemoveContentPoolBanInput> }
  | { type: "contentList.add"; input: WithoutTemplate<AddContentListInput> }
  | { type: "contentList.remove"; input: WithoutTemplate<RemoveContentListInput> }
  | { type: "contentList.rename"; input: WithoutTemplate<RenameContentListInput> }
  | { type: "contentList.update"; input: WithoutTemplate<UpdateContentListInput> }
  | { type: "mandatoryContentPreset.add"; input: WithoutTemplate<AddMandatoryContentPresetInput> }
  | { type: "mandatoryContentPreset.remove"; input: WithoutTemplate<RemoveMandatoryContentPresetInput> }
  | { type: "mandatoryContentPreset.rename"; input: WithoutTemplate<RenameMandatoryContentPresetInput> }
  | { type: "mandatoryContentPreset.update"; input: WithoutTemplate<UpdateMandatoryContentPresetInput> }
  | { type: "contentCountLimitPreset.add"; input: WithoutTemplate<AddContentCountLimitPresetInput> }
  | { type: "contentCountLimitPreset.remove"; input: WithoutTemplate<RemoveContentCountLimitPresetInput> }
  | { type: "contentCountLimitPreset.rename"; input: WithoutTemplate<RenameContentCountLimitPresetInput> }
  | { type: "contentCountLimitPreset.update"; input: WithoutTemplate<UpdateContentCountLimitPresetInput> }
  | { type: "valueOverride.add"; input: WithoutTemplate<AddValueOverrideInput> }
  | { type: "valueOverride.remove"; input: WithoutTemplate<RemoveValueOverrideInput> }
  | { type: "valueOverride.update"; input: WithoutTemplate<UpdateValueOverrideInput> }
  | { type: "zoneLayout.add"; input: WithoutTemplate<AddZoneLayoutInput> }
  | { type: "zoneLayout.remove"; input: WithoutTemplate<RemoveZoneLayoutInput> }
  | { type: "zoneLayout.rename"; input: WithoutTemplate<RenameZoneLayoutInput> }
  | { type: "zoneLayout.update"; input: WithoutTemplate<UpdateZoneLayoutInput> };

export type EditorAction = EditorFieldUpdateAction | EditorEntityAction;

export interface EditorActionOptions {
  applyGameModeDefaults?: boolean;
  normalizePortalDefaults?: boolean;
}

export interface ApplyEditorActionInput {
  template: RmgTemplate;
  action: EditorAction;
  options?: EditorActionOptions;
  history?: TransactionHistory;
  transactionLabel?: string;
}

export interface EditorActionResult extends MutationResult<RmgTemplate> {
  actionType: EditorAction["type"];
  transactionPushed: boolean;
  history?: TransactionHistory;
}
