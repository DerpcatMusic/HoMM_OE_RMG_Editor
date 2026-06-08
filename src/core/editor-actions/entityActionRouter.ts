import { addConnection } from "../mutations/addConnection.js";
import { addContentCountLimitPreset } from "../mutations/addContentCountLimitPreset.js";
import { addContentList } from "../mutations/addContentList.js";
import { addContentPoolBan } from "../mutations/addContentPoolBan.js";
import { addContentPoolGroup } from "../mutations/addContentPoolGroup.js";
import { addLocalContentPool } from "../mutations/addLocalContentPool.js";
import { addMainObject } from "../mutations/addMainObject.js";
import { addMandatoryContentPreset } from "../mutations/addMandatoryContentPreset.js";
import { addValueOverride } from "../mutations/addValueOverride.js";
import { addVariant } from "../mutations/addVariant.js";
import { addZone } from "../mutations/addZone.js";
import { addZoneLayout } from "../mutations/addZoneLayout.js";
import { addZoneRoad } from "../mutations/addZoneRoad.js";
import { cloneCoreContentPoolToLocal } from "../mutations/cloneCoreContentPoolToLocal.js";
import { cloneZone } from "../mutations/cloneZone.js";
import { moveContentPoolBan } from "../mutations/moveContentPoolBan.js";
import { moveContentPoolGroup } from "../mutations/moveContentPoolGroup.js";
import type { MutationResult } from "../mutations/mutationTypes.js";
import { removeConnection } from "../mutations/removeConnection.js";
import { removeContentCountLimitPreset } from "../mutations/removeContentCountLimitPreset.js";
import { removeContentList } from "../mutations/removeContentList.js";
import { removeContentPoolBan } from "../mutations/removeContentPoolBan.js";
import { removeContentPoolGroup } from "../mutations/removeContentPoolGroup.js";
import { removeLocalContentPool } from "../mutations/removeLocalContentPool.js";
import { removeMainObject } from "../mutations/removeMainObject.js";
import { removeMandatoryContentPreset } from "../mutations/removeMandatoryContentPreset.js";
import { removeValueOverride } from "../mutations/removeValueOverride.js";
import { removeVariant } from "../mutations/removeVariant.js";
import { removeZone } from "../mutations/removeZone.js";
import { removeZoneLayout } from "../mutations/removeZoneLayout.js";
import { removeZoneRoad } from "../mutations/removeZoneRoad.js";
import { renameConnection } from "../mutations/renameConnection.js";
import { renameContentCountLimitPreset } from "../mutations/renameContentCountLimitPreset.js";
import { renameContentList } from "../mutations/renameContentList.js";
import { renameLocalContentPool } from "../mutations/renameLocalContentPool.js";
import { renameMandatoryContentPreset } from "../mutations/renameMandatoryContentPreset.js";
import { renameZone } from "../mutations/renameZone.js";
import { renameZoneLayout } from "../mutations/renameZoneLayout.js";
import { updateConnectionEndpoints } from "../mutations/updateConnection.js";
import { updateConnectionSettings } from "../mutations/updateConnectionSettings.js";
import { updateConnectionType } from "../mutations/updateConnectionType.js";
import { updateContentCountLimitPreset } from "../mutations/updateContentCountLimitPreset.js";
import { updateContentList } from "../mutations/updateContentList.js";
import { updateContentPoolBan } from "../mutations/updateContentPoolBan.js";
import { updateContentPoolGroup } from "../mutations/updateContentPoolGroup.js";
import { updateContentPoolValueDistribution } from "../mutations/updateContentPoolValueDistribution.js";
import { updateGlobalBans } from "../mutations/updateGlobalBans.js";
import { updateLocalContentPool } from "../mutations/updateLocalContentPool.js";
import { updateMainObject } from "../mutations/updateMainObject.js";
import { updateMandatoryContentPreset } from "../mutations/updateMandatoryContentPreset.js";
import { updateTemplateSettings } from "../mutations/updateTemplateSettings.js";
import { updateValueOverride } from "../mutations/updateValueOverride.js";
import { updateZoneLayout } from "../mutations/updateZoneLayout.js";
import { updateZoneRoad } from "../mutations/updateZoneRoad.js";
import { setZoneContentBudgets } from "../mutations/updateZoneContent.js";
import { setZoneContentPools } from "../mutations/updateZonePools.js";
import { setZoneContentCountLimitPresets, setZoneMandatoryContentPresets } from "../mutations/updateZonePresets.js";
import { updateZoneSettings } from "../mutations/updateZoneSettings.js";
import type { RmgTemplate } from "../rmg/rmgTypes.js";
import type { EditorEntityAction } from "./editorActionTypes.js";

export function applyEntityAction(template: RmgTemplate, action: EditorEntityAction): MutationResult<RmgTemplate> {
  switch (action.type) {
    case "template.update":
      return updateTemplateSettings({ template, ...action.input });
    case "globalBans.update":
      return updateGlobalBans({ template, ...action.input });
    case "variant.add":
      return addVariant({ template, ...action.input });
    case "variant.remove":
      return removeVariant({ template, ...action.input });
    case "zone.add":
      return addZone({ template, ...action.input });
    case "zone.remove":
      return removeZone({ template, ...action.input });
    case "zone.clone":
      return cloneZone({ template, ...action.input });
    case "zone.rename":
      return renameZone({ template, ...action.input });
    case "zone.updateSettings":
      return updateZoneSettings({ template, ...action.input });
    case "zone.setContentPools":
      return setZoneContentPools({ template, ...action.input });
    case "zone.setContentBudgets":
      return setZoneContentBudgets({ template, ...action.input });
    case "zone.setMandatoryContentPresets":
      return setZoneMandatoryContentPresets({ template, ...action.input });
    case "zone.setContentCountLimitPresets":
      return setZoneContentCountLimitPresets({ template, ...action.input });
    case "connection.add":
      return addConnection({ template, ...action.input });
    case "connection.remove":
      return removeConnection({ template, ...action.input });
    case "connection.rename":
      return renameConnection({ template, ...action.input });
    case "connection.updateEndpoints":
      return updateConnectionEndpoints({ template, ...action.input });
    case "connection.updateType":
      return updateConnectionType({ template, ...action.input });
    case "connection.updateSettings":
      return updateConnectionSettings({ template, ...action.input });
    case "mainObject.add":
      return addMainObject({ template, ...action.input });
    case "mainObject.remove":
      return removeMainObject({ template, ...action.input });
    case "mainObject.update":
      return updateMainObject({ template, ...action.input });
    case "road.add":
      return addZoneRoad({ template, ...action.input });
    case "road.update":
      return updateZoneRoad({ template, ...action.input });
    case "road.remove":
      return removeZoneRoad({ template, ...action.input });
    case "contentPool.add":
      return addLocalContentPool({ template, ...action.input });
    case "contentPool.remove":
      return removeLocalContentPool({ template, ...action.input });
    case "contentPool.rename":
      return renameLocalContentPool({ template, ...action.input });
    case "contentPool.update":
      return updateLocalContentPool({ template, ...action.input });
    case "contentPool.cloneCore":
      return cloneCoreContentPoolToLocal({ template, ...action.input });
    case "contentPool.valueDistribution.update":
      return updateContentPoolValueDistribution({ template, ...action.input });
    case "contentPool.group.add":
      return addContentPoolGroup({ template, ...action.input });
    case "contentPool.group.update":
      return updateContentPoolGroup({ template, ...action.input });
    case "contentPool.group.move":
      return moveContentPoolGroup({ template, ...action.input });
    case "contentPool.group.remove":
      return removeContentPoolGroup({ template, ...action.input });
    case "contentPool.ban.add":
      return addContentPoolBan({ template, ...action.input });
    case "contentPool.ban.update":
      return updateContentPoolBan({ template, ...action.input });
    case "contentPool.ban.move":
      return moveContentPoolBan({ template, ...action.input });
    case "contentPool.ban.remove":
      return removeContentPoolBan({ template, ...action.input });
    case "contentList.add":
      return addContentList({ template, ...action.input });
    case "contentList.remove":
      return removeContentList({ template, ...action.input });
    case "contentList.rename":
      return renameContentList({ template, ...action.input });
    case "contentList.update":
      return updateContentList({ template, ...action.input });
    case "mandatoryContentPreset.add":
      return addMandatoryContentPreset({ template, ...action.input });
    case "mandatoryContentPreset.remove":
      return removeMandatoryContentPreset({ template, ...action.input });
    case "mandatoryContentPreset.rename":
      return renameMandatoryContentPreset({ template, ...action.input });
    case "mandatoryContentPreset.update":
      return updateMandatoryContentPreset({ template, ...action.input });
    case "contentCountLimitPreset.add":
      return addContentCountLimitPreset({ template, ...action.input });
    case "contentCountLimitPreset.remove":
      return removeContentCountLimitPreset({ template, ...action.input });
    case "contentCountLimitPreset.rename":
      return renameContentCountLimitPreset({ template, ...action.input });
    case "contentCountLimitPreset.update":
      return updateContentCountLimitPreset({ template, ...action.input });
    case "valueOverride.add":
      return addValueOverride({ template, ...action.input });
    case "valueOverride.remove":
      return removeValueOverride({ template, ...action.input });
    case "valueOverride.update":
      return updateValueOverride({ template, ...action.input });
    case "zoneLayout.add":
      return addZoneLayout({ template, ...action.input });
    case "zoneLayout.remove":
      return removeZoneLayout({ template, ...action.input });
    case "zoneLayout.rename":
      return renameZoneLayout({ template, ...action.input });
    case "zoneLayout.update":
      return updateZoneLayout({ template, ...action.input });
  }
}
