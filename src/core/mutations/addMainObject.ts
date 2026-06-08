import type { MainObject, RmgTemplate } from "../rmg/rmgTypes.js";
import {
  MAIN_OBJECT_PLACEMENTS,
  MAIN_OBJECT_TYPES,
  PLAYER_REFS,
  isEnumValue,
} from "../rmg/enums.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { createDefaultMainObject, type DefaultMainObjectOptions } from "./defaultObjects.js";
import { buildMutationResult, getVariant, selectZone } from "./helpers.js";
import type { MutationChange, MutationResult, VariantMutationInput, ZoneSelector } from "./mutationTypes.js";

export interface AddMainObjectInput extends VariantMutationInput {
  zone: ZoneSelector;
  mainObject?: MainObject | DefaultMainObjectOptions;
  insertIndex?: number;
}

export function addMainObject(input: AddMainObjectInput): MutationResult<RmgTemplate> {
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

  const mainObject = input.mainObject && isCompleteMainObject(input.mainObject)
    ? cloneMainObject(input.mainObject)
    : createDefaultMainObject(input.mainObject);
  validateMainObjectForInsert(mainObject, `${selected.path}.mainObjects`, diagnostics);
  if (diagnostics.some((item) => item.severity === "error")) {
    return buildMutationResult(template, changes, diagnostics);
  }

  const mainObjects = selected.zone.mainObjects ?? [];
  selected.zone.mainObjects = mainObjects;
  const insertIndex = input.insertIndex ?? mainObjects.length;
  if (!Number.isInteger(insertIndex) || insertIndex < 0 || insertIndex > mainObjects.length) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.mainObject.insertIndexInvalid",
        `Main object insert index ${insertIndex} is outside 0..${mainObjects.length}.`,
        `${selected.path}.mainObjects`,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  mainObjects.splice(insertIndex, 0, mainObject);
  changes.push({
    path: `${selected.path}.mainObjects[${insertIndex}]`,
    before: undefined,
    after: mainObject,
    reason: "main object added",
  });

  return buildMutationResult(template, changes, diagnostics);
}

function validateMainObjectForInsert(mainObject: MainObject, path: string, diagnostics: Diagnostic[]): void {
  if (!isEnumValue(MAIN_OBJECT_TYPES, mainObject.type)) {
    diagnostics.push(diagnostic("error", "mutation.mainObject.typeInvalid", `Invalid main object type '${mainObject.type}'.`, `${path}.type`));
  }
  if (!isEnumValue(MAIN_OBJECT_PLACEMENTS, mainObject.placement)) {
    diagnostics.push(
      diagnostic("error", "mutation.mainObject.placementInvalid", `Invalid main object placement '${mainObject.placement}'.`, `${path}.placement`),
    );
  }
  if (mainObject.type === "Spawn" && !isEnumValue(PLAYER_REFS, mainObject.spawn)) {
    diagnostics.push(
      diagnostic("error", "mutation.mainObject.spawnMissing", "Spawn main objects require spawn Player1..Player8.", `${path}.spawn`),
    );
  }
  if (mainObject.owner !== undefined && !isEnumValue(PLAYER_REFS, mainObject.owner)) {
    diagnostics.push(diagnostic("error", "mutation.mainObject.ownerInvalid", `Invalid owner '${mainObject.owner}'.`, `${path}.owner`));
  }
  if (mainObject.type === "City" && !mainObject.faction) {
    diagnostics.push(diagnostic("error", "mutation.mainObject.factionMissing", "Main object faction rule is required.", `${path}.faction`));
  }
}

function isCompleteMainObject(mainObject: MainObject | DefaultMainObjectOptions): mainObject is MainObject {
  return "faction" in mainObject || "placementArgs" in mainObject || "isKeyObject" in mainObject;
}

function cloneMainObject(mainObject: MainObject): MainObject {
  return JSON.parse(JSON.stringify(mainObject)) as MainObject;
}
