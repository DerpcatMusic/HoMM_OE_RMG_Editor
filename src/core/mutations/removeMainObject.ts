import type { BiomeRule, FactionRule, RmgTemplate, RoadTargetConfig, Variant } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import {
  buildMutationResult,
  getVariant,
  recordArrayRemove,
  selectMainObject,
  selectZone,
} from "./helpers.js";
import type { MainObjectSelector, MutationChange, MutationResult, VariantMutationInput, ZoneSelector } from "./mutationTypes.js";

export interface RemoveMainObjectInput extends VariantMutationInput {
  zone: ZoneSelector;
  mainObject: MainObjectSelector;
  cleanupExactReferences?: boolean;
  allowIndexShift?: boolean;
}

interface IndexedReference {
  path: string;
  index: number;
  kind: "road" | "biome" | "faction";
  args: string[];
  argIndex: number;
}

export function removeMainObject(input: RemoveMainObjectInput): MutationResult<RmgTemplate> {
  const template = cloneTemplate(input.template);
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];
  const cleanupExactReferences = input.cleanupExactReferences ?? false;
  const allowIndexShift = input.allowIndexShift ?? false;
  const variantSelection = getVariant({ template, variantIndex: input.variantIndex }, diagnostics);
  if (!variantSelection) {
    return buildMutationResult(template, changes, diagnostics);
  }
  const selectedZone = selectZone(variantSelection.variant, variantSelection.path, input.zone, diagnostics);
  if (!selectedZone) {
    return buildMutationResult(template, changes, diagnostics);
  }
  const selectedMainObject = selectMainObject(selectedZone, input.mainObject, diagnostics);
  if (!selectedMainObject) {
    return buildMutationResult(template, changes, diagnostics);
  }

  const references = collectMainObjectIndexReferences(
    variantSelection.variant,
    variantSelection.path,
    selectedZone.zone.name,
    selectedZone.zoneIndex,
    selectedMainObject.mainObjectIndex,
  );
  const shiftingReferences = references.filter((reference) => reference.index > selectedMainObject.mainObjectIndex);
  if (!allowIndexShift && shiftingReferences.length > 0) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.mainObject.indexShiftBlocked",
        `Removing main object ${selectedMainObject.mainObjectIndex} would shift ${shiftingReferences.length} known index reference(s).`,
        selectedMainObject.path,
      ),
    );
  }
  if (!cleanupExactReferences && references.some((reference) => reference.index === selectedMainObject.mainObjectIndex)) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.mainObject.exactReferencesBlocked",
        "Selected main object is still referenced. Enable cleanupExactReferences or update references first.",
        selectedMainObject.path,
      ),
    );
  }
  if (diagnostics.some((item) => item.severity === "error")) {
    return buildMutationResult(template, changes, diagnostics);
  }

  if (cleanupExactReferences || allowIndexShift) {
    rewriteMainObjectIndexReferences(references, selectedMainObject.mainObjectIndex, cleanupExactReferences, allowIndexShift, changes);
  }
  recordArrayRemove(
    selectedZone.zone.mainObjects ?? [],
    selectedMainObject.mainObjectIndex,
    selectedMainObject.path,
    changes,
    "main object removed",
  );

  for (const reference of references) {
    diagnostics.push(
      diagnostic(
        "warning",
        "mutation.mainObject.indexReferenceTouched",
        `Main object removal affected ${reference.kind} reference at index ${reference.index}.`,
        reference.path,
      ),
    );
  }

  return buildMutationResult(template, changes, diagnostics);
}

function collectMainObjectIndexReferences(
  variant: Variant,
  variantPath: string,
  targetZoneName: string | undefined,
  targetZoneIndex: number,
  removedIndex: number,
): IndexedReference[] {
  const references: IndexedReference[] = [];
  (variant.zones ?? []).forEach((zone, zoneIndex) => {
    const zonePath = `${variantPath}.zones[${zoneIndex}]`;
    const isTargetZone = zoneIndex === targetZoneIndex;

    if (isTargetZone) {
      (zone.roads ?? []).forEach((road, roadIndex) => {
        collectRoadTargetReference(road.from, `${zonePath}.roads[${roadIndex}].from.args`, removedIndex, references);
        collectRoadTargetReference(road.to, `${zonePath}.roads[${roadIndex}].to.args`, removedIndex, references);
      });
    }

    collectBiomeReference(zone.zoneBiome, `${zonePath}.zoneBiome.args`, zoneIndex, targetZoneName, targetZoneIndex, removedIndex, references);
    collectBiomeReference(zone.contentBiome, `${zonePath}.contentBiome.args`, zoneIndex, targetZoneName, targetZoneIndex, removedIndex, references);
    collectBiomeReference(zone.metaObjectsBiome, `${zonePath}.metaObjectsBiome.args`, zoneIndex, targetZoneName, targetZoneIndex, removedIndex, references);

    (zone.mainObjects ?? []).forEach((mainObject, mainObjectIndex) => {
      collectFactionReference(
        mainObject.faction,
        `${zonePath}.mainObjects[${mainObjectIndex}].faction.args`,
        zoneIndex,
        targetZoneName,
        targetZoneIndex,
        removedIndex,
        references,
      );
    });
  });
  return references;
}

function collectRoadTargetReference(
  target: RoadTargetConfig | undefined,
  path: string,
  removedIndex: number,
  references: IndexedReference[],
): void {
  if (target?.type !== "MainObject" || !target.args) {
    return;
  }
  const index = Number.parseInt(target.args[0] ?? "", 10);
  if (Number.isInteger(index) && index >= removedIndex) {
    references.push({ path, index, kind: "road", args: target.args, argIndex: 0 });
  }
}

function collectBiomeReference(
  rule: BiomeRule | undefined,
  path: string,
  currentZoneIndex: number,
  targetZoneName: string | undefined,
  targetZoneIndex: number,
  removedIndex: number,
  references: IndexedReference[],
): void {
  if (rule?.type !== "MatchMainObject" || !rule.args) {
    return;
  }
  if (!ruleTargetsZone(rule.args, currentZoneIndex, targetZoneName, targetZoneIndex)) {
    return;
  }
  const index = Number.parseInt(rule.args[0] ?? "", 10);
  if (Number.isInteger(index) && index >= removedIndex) {
    references.push({ path, index, kind: "biome", args: rule.args, argIndex: 0 });
  }
}

function collectFactionReference(
  rule: FactionRule | undefined,
  path: string,
  currentZoneIndex: number,
  targetZoneName: string | undefined,
  targetZoneIndex: number,
  removedIndex: number,
  references: IndexedReference[],
): void {
  if (!rule?.args) {
    return;
  }
  const args = rule.args;
  if (rule.type === "Match" && ruleTargetsZone(args, currentZoneIndex, targetZoneName, targetZoneIndex)) {
    const index = Number.parseInt(args[0] ?? "", 10);
    if (Number.isInteger(index) && index >= removedIndex) {
      references.push({ path, index, kind: "faction", args, argIndex: 0 });
    }
  }
  if (rule.type === "FromList") {
    args.forEach((arg, argIndex) => {
      const parts = arg.trim().split(/\s+/u);
      if (parts[0] !== "differentFrom:") {
        return;
      }
      const index = Number.parseInt(parts[1] ?? "", 10);
      const zoneMatches = parts[2] === undefined ? currentZoneIndex === targetZoneIndex : parts[2] === targetZoneName;
      if (zoneMatches && Number.isInteger(index) && index >= removedIndex) {
        references.push({ path: `${path}[${argIndex}]`, index, kind: "faction", args, argIndex });
      }
    });
  }
}

function ruleTargetsZone(
  args: string[],
  currentZoneIndex: number,
  targetZoneName: string | undefined,
  targetZoneIndex: number,
): boolean {
  return args[1] === undefined ? currentZoneIndex === targetZoneIndex : args[1] === targetZoneName;
}

function rewriteMainObjectIndexReferences(
  references: IndexedReference[],
  removedIndex: number,
  cleanupExactReferences: boolean,
  allowIndexShift: boolean,
  changes: MutationChange[],
): void {
  for (const reference of references) {
    if (reference.index === removedIndex && cleanupExactReferences) {
      cleanupReference(reference, changes);
      continue;
    }
    if (reference.index > removedIndex && allowIndexShift) {
      decrementReference(reference, changes);
    }
  }
}

function cleanupReference(reference: IndexedReference, changes: MutationChange[]): void {
  if (reference.path.endsWith("]")) {
    const before = reference.args[reference.argIndex];
    reference.args.splice(reference.argIndex, 1);
    changes.push({ path: reference.path, before, after: undefined, reason: "removed main-object index reference" });
    return;
  }
  decrementOrResetReference(reference, 0, "reset removed main-object index reference", changes);
}

function decrementReference(reference: IndexedReference, changes: MutationChange[]): void {
  if (reference.path.endsWith("]") && reference.kind === "faction") {
    const before = reference.args[reference.argIndex];
    const parts = before?.trim().split(/\s+/u) ?? [];
    if (parts.length >= 2) {
      parts[1] = String(reference.index - 1);
      reference.args[reference.argIndex] = parts.join(" ");
      changes.push({ path: reference.path, before, after: reference.args[reference.argIndex], reason: "shifted main-object index reference" });
    }
    return;
  }
  decrementOrResetReference(reference, reference.index - 1, "shifted main-object index reference", changes);
}

function decrementOrResetReference(
  reference: IndexedReference,
  nextIndex: number,
  reason: string,
  changes: MutationChange[],
): void {
  const before = reference.args[reference.argIndex];
  const after = String(nextIndex);
  if (before === after) {
    return;
  }
  reference.args[reference.argIndex] = after;
  changes.push({ path: reference.path, before, after, reason });
}
