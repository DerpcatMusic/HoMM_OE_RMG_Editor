import type { BiomeRule, FactionRule, RmgTemplate, Variant } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import {
  buildMutationResult,
  getVariant,
  recordStringChange,
  replaceArg,
  replaceDifferentFromZoneArg,
  selectZone,
  validateName,
} from "./helpers.js";
import type { MutationChange, MutationResult, VariantMutationInput, ZoneSelector } from "./mutationTypes.js";

export interface RenameZoneInput extends VariantMutationInput {
  zone: ZoneSelector;
  newName: string;
}

export function renameZone(input: RenameZoneInput): MutationResult<RmgTemplate> {
  const template = cloneTemplate(input.template);
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];
  const variantSelection = getVariant({ template, variantIndex: input.variantIndex }, diagnostics);
  if (!variantSelection) {
    return buildMutationResult(template, changes, diagnostics);
  }

  const selected = selectZone(variantSelection.variant, variantSelection.path, input.zone, diagnostics);
  if (!selected) {
    return buildMutationResult(template, changes, diagnostics);
  }

  if (!validateName(input.newName, `${selected.path}.name`, "zone", diagnostics)) {
    return buildMutationResult(template, changes, diagnostics);
  }

  const oldName = selected.zone.name;
  if (!oldName) {
    diagnostics.push(diagnostic("error", "mutation.zone.oldNameMissing", "Selected zone has no name to rename.", `${selected.path}.name`));
    return buildMutationResult(template, changes, diagnostics);
  }

  const duplicateIndex = (variantSelection.variant.zones ?? []).findIndex(
    (zone, index) => index !== selected.zoneIndex && zone.name === input.newName,
  );
  if (duplicateIndex !== -1) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.zone.duplicateName",
        `Another zone already uses the name '${input.newName}'.`,
        `${variantSelection.path}.zones[${duplicateIndex}].name`,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  recordStringChange(selected.zone, "name", `${selected.path}.name`, input.newName, changes, "zone declaration");
  rewriteZoneReferences(variantSelection.variant, variantSelection.path, oldName, input.newName, changes);

  return buildMutationResult(template, changes, diagnostics);
}

function rewriteZoneReferences(
  variant: Variant,
  variantPath: string,
  oldName: string,
  newName: string,
  changes: MutationChange[],
): void {
  if (variant.orientation?.zeroAngleZone === oldName) {
    recordStringChange(
      variant.orientation,
      "zeroAngleZone",
      `${variantPath}.orientation.zeroAngleZone`,
      newName,
      changes,
      "orientation zone anchor",
    );
  }

  (variant.connections ?? []).forEach((connection, connectionIndex) => {
    const path = `${variantPath}.connections[${connectionIndex}]`;
    if (connection.from === oldName) {
      recordStringChange(connection, "from", `${path}.from`, newName, changes, "connection endpoint");
    }
    if (connection.to === oldName) {
      recordStringChange(connection, "to", `${path}.to`, newName, changes, "connection endpoint");
    }
    if (connection.guardZone === oldName) {
      recordStringChange(connection, "guardZone", `${path}.guardZone`, newName, changes, "connection guard zone");
    }
    if (connection.gatePlacement === "NearZone") {
      replaceArg(connection.gatePlacementArgs, 0, oldName, newName, `${path}.gatePlacementArgs`, changes, "gate NearZone reference");
    }
  });

  (variant.zones ?? []).forEach((zone, zoneIndex) => {
    const path = `${variantPath}.zones[${zoneIndex}]`;
    rewriteBiomeRule(zone.zoneBiome, `${path}.zoneBiome`, oldName, newName, changes);
    rewriteBiomeRule(zone.contentBiome, `${path}.contentBiome`, oldName, newName, changes);
    rewriteBiomeRule(zone.metaObjectsBiome, `${path}.metaObjectsBiome`, oldName, newName, changes);

    (zone.mainObjects ?? []).forEach((mainObject, mainObjectIndex) => {
      const mainObjectPath = `${path}.mainObjects[${mainObjectIndex}]`;
      if (mainObject.placement === "NearZone") {
        replaceArg(
          mainObject.placementArgs,
          0,
          oldName,
          newName,
          `${mainObjectPath}.placementArgs`,
          changes,
          "main object NearZone placement reference",
        );
      }
      rewriteFactionRule(mainObject.faction, `${mainObjectPath}.faction`, oldName, newName, changes);
    });
  });
}

function rewriteBiomeRule(
  rule: BiomeRule | undefined,
  path: string,
  oldName: string,
  newName: string,
  changes: MutationChange[],
): void {
  if (!rule) {
    return;
  }

  if (rule.type === "MatchZone") {
    replaceArg(rule.args, 0, oldName, newName, `${path}.args`, changes, "biome MatchZone reference");
  }
  if (rule.type === "MatchMainObject") {
    replaceArg(rule.args, 1, oldName, newName, `${path}.args`, changes, "biome MatchMainObject zone reference");
  }
  if (rule.type === "FromList") {
    replaceDifferentFromZoneArg(rule.args, oldName, newName, `${path}.args`, changes, "biome");
  }
}

function rewriteFactionRule(
  rule: FactionRule | undefined,
  path: string,
  oldName: string,
  newName: string,
  changes: MutationChange[],
): void {
  if (!rule) {
    return;
  }

  if (rule.type === "Match") {
    replaceArg(rule.args, 1, oldName, newName, `${path}.args`, changes, "faction Match zone reference");
  }
  if (rule.type === "FromList") {
    replaceDifferentFromZoneArg(rule.args, oldName, newName, `${path}.args`, changes, "faction");
  }
}
