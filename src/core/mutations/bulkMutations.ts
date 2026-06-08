import type { RmgTemplate, Zone, Connection, MainObject } from "../rmg/rmgTypes.js";
import type { MutationResult, MutationChange } from "./mutationTypes.js";
import type { Diagnostic } from "../validation/validationTypes.js";
import { diagnostic } from "../validation/validationTypes.js";
import { getVariant, buildMutationResult } from "./helpers.js";
import { cloneTemplate } from "./cloneTemplate.js";

export interface BulkZoneMutationInput {
  template: RmgTemplate;
  variantIndex: number;
  predicate: (zone: Zone, zoneIndex: number) => boolean;
  mutate: (template: RmgTemplate, zoneIndex: number) => MutationResult<RmgTemplate>;
}

export interface BulkConnectionMutationInput {
  template: RmgTemplate;
  variantIndex: number;
  predicate: (connection: Connection, connectionIndex: number) => boolean;
  mutate: (template: RmgTemplate, connectionIndex: number) => MutationResult<RmgTemplate>;
}

export interface BulkMainObjectMutationInput {
  template: RmgTemplate;
  variantIndex: number;
  zoneIndex: number;
  predicate: (mainObject: MainObject, mainObjectIndex: number) => boolean;
  mutate: (template: RmgTemplate, mainObjectIndex: number) => MutationResult<RmgTemplate>;
}

export function runBulkZoneMutation(input: BulkZoneMutationInput): MutationResult<RmgTemplate> {
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];
  let currentTemplate = cloneTemplate(input.template);

  const variantResult = getVariant({ template: currentTemplate, variantIndex: input.variantIndex }, diagnostics);
  if (!variantResult) {
    return buildMutationResult(currentTemplate, changes, diagnostics);
  }

  const zones = variantResult.variant.zones ?? [];
  for (let zoneIndex = 0; zoneIndex < zones.length; zoneIndex++) {
    const zone = zones[zoneIndex];
    if (zone === undefined) {
      continue;
    }
    if (!input.predicate(zone, zoneIndex)) {
      continue;
    }

    const result = input.mutate(currentTemplate, zoneIndex);
    changes.push(...result.changes);
    diagnostics.push(...result.diagnostics);

    if (!result.ok) {
      diagnostics.push(
        diagnostic(
          "error",
          "mutation.bulk.zoneFailed",
          `Bulk zone mutation failed at zone index ${zoneIndex}${zone.name ? ` ('${zone.name}')` : ""}.`,
          `${variantResult.path}.zones[${zoneIndex}]`,
        ),
      );
      return buildMutationResult(currentTemplate, changes, diagnostics);
    }

    currentTemplate = result.value;
  }

  return buildMutationResult(currentTemplate, changes, diagnostics);
}

export function runBulkConnectionMutation(input: BulkConnectionMutationInput): MutationResult<RmgTemplate> {
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];
  let currentTemplate = cloneTemplate(input.template);

  const variantResult = getVariant({ template: currentTemplate, variantIndex: input.variantIndex }, diagnostics);
  if (!variantResult) {
    return buildMutationResult(currentTemplate, changes, diagnostics);
  }

  const connections = variantResult.variant.connections ?? [];
  for (let connectionIndex = 0; connectionIndex < connections.length; connectionIndex++) {
    const connection = connections[connectionIndex];
    if (connection === undefined) {
      continue;
    }
    if (!input.predicate(connection, connectionIndex)) {
      continue;
    }

    const result = input.mutate(currentTemplate, connectionIndex);
    changes.push(...result.changes);
    diagnostics.push(...result.diagnostics);

    if (!result.ok) {
      diagnostics.push(
        diagnostic(
          "error",
          "mutation.bulk.connectionFailed",
          `Bulk connection mutation failed at connection index ${connectionIndex}${connection.name ? ` ('${connection.name}')` : ""}.`,
          `${variantResult.path}.connections[${connectionIndex}]`,
        ),
      );
      return buildMutationResult(currentTemplate, changes, diagnostics);
    }

    currentTemplate = result.value;
  }

  return buildMutationResult(currentTemplate, changes, diagnostics);
}

export function runBulkMainObjectMutation(input: BulkMainObjectMutationInput): MutationResult<RmgTemplate> {
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];
  let currentTemplate = cloneTemplate(input.template);

  const variantResult = getVariant({ template: currentTemplate, variantIndex: input.variantIndex }, diagnostics);
  if (!variantResult) {
    return buildMutationResult(currentTemplate, changes, diagnostics);
  }

  const zone = variantResult.variant.zones?.[input.zoneIndex];
  if (!zone) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.zone.missing",
        `Zone index ${input.zoneIndex} does not exist.`,
        `${variantResult.path}.zones[${input.zoneIndex}]`,
      ),
    );
    return buildMutationResult(currentTemplate, changes, diagnostics);
  }

  const mainObjects = zone.mainObjects ?? [];
  for (let mainObjectIndex = 0; mainObjectIndex < mainObjects.length; mainObjectIndex++) {
    const mainObject = mainObjects[mainObjectIndex];
    if (mainObject === undefined) {
      continue;
    }
    if (!input.predicate(mainObject, mainObjectIndex)) {
      continue;
    }

    const result = input.mutate(currentTemplate, mainObjectIndex);
    changes.push(...result.changes);
    diagnostics.push(...result.diagnostics);

    if (!result.ok) {
      diagnostics.push(
        diagnostic(
          "error",
          "mutation.bulk.mainObjectFailed",
          `Bulk main object mutation failed at main object index ${mainObjectIndex}.`,
          `${variantResult.path}.zones[${input.zoneIndex}].mainObjects[${mainObjectIndex}]`,
        ),
      );
      return buildMutationResult(currentTemplate, changes, diagnostics);
    }

    currentTemplate = result.value;
  }

  return buildMutationResult(currentTemplate, changes, diagnostics);
}
