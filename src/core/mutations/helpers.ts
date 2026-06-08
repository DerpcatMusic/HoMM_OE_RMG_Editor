import type { Variant } from "../rmg/rmgTypes.js";
import { stringReferenceIncludes } from "../rmg/stringArrayCompat.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import type {
  ConnectionSelector,
  MainObjectSelector,
  MutationChange,
  MutationResult,
  SelectedConnection,
  SelectedMainObject,
  SelectedZone,
  VariantMutationInput,
  ZoneSelector,
} from "./mutationTypes.js";

export function buildMutationResult<T>(
  value: T,
  changes: MutationChange[],
  diagnostics: Diagnostic[],
): MutationResult<T> {
  return {
    value,
    changes,
    diagnostics,
    ok: diagnostics.every((item) => item.severity !== "error"),
  };
}

export function getVariant(
  input: VariantMutationInput,
  diagnostics: Diagnostic[],
): { variant: Variant; path: string } | undefined {
  const variant = input.template.variants?.[input.variantIndex];
  const path = `$.variants[${input.variantIndex}]`;
  if (!variant) {
    diagnostics.push(
      diagnostic("error", "mutation.variant.missing", `Variant index ${input.variantIndex} does not exist.`, path),
    );
    return undefined;
  }
  return { variant, path };
}

export function selectZone(
  variant: Variant,
  variantPath: string,
  selector: ZoneSelector,
  diagnostics: Diagnostic[],
): SelectedZone | undefined {
  const zones = variant.zones ?? [];
  const zoneIndex =
    "zoneIndex" in selector
      ? selector.zoneIndex
      : zones.findIndex((zone) => zone.name === selector.zoneName);
  const zone = zones[zoneIndex];
  const path = `${variantPath}.zones[${zoneIndex}]`;

  if (!zone) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.zone.missing",
        "zoneIndex" in selector
          ? `Zone index ${selector.zoneIndex} does not exist.`
          : `Zone '${selector.zoneName}' does not exist.`,
        path,
      ),
    );
    return undefined;
  }

  return { zone, zoneIndex, path };
}

export function selectConnection(
  variant: Variant,
  variantPath: string,
  selector: ConnectionSelector,
  diagnostics: Diagnostic[],
): SelectedConnection | undefined {
  const connections = variant.connections ?? [];
  const connectionIndex =
    "connectionIndex" in selector
      ? selector.connectionIndex
      : connections.findIndex((connection) => connection.name === selector.connectionName);
  const connection = connections[connectionIndex];
  const path = `${variantPath}.connections[${connectionIndex}]`;

  if (!connection) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.connection.missing",
        "connectionIndex" in selector
          ? `Connection index ${selector.connectionIndex} does not exist.`
          : `Connection '${selector.connectionName}' does not exist.`,
        path,
      ),
    );
    return undefined;
  }

  return { connection, connectionIndex, path };
}

export function selectMainObject(
  selectedZone: SelectedZone,
  selector: MainObjectSelector,
  diagnostics: Diagnostic[],
): SelectedMainObject | undefined {
  const mainObjects = selectedZone.zone.mainObjects ?? [];
  const mainObject = mainObjects[selector.mainObjectIndex];
  const path = `${selectedZone.path}.mainObjects[${selector.mainObjectIndex}]`;

  if (!mainObject) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.mainObject.missing",
        `Main object index ${selector.mainObjectIndex} does not exist.`,
        path,
      ),
    );
    return undefined;
  }

  return { mainObject, mainObjectIndex: selector.mainObjectIndex, path };
}

export function validateName(
  newName: string,
  path: string,
  label: string,
  diagnostics: Diagnostic[],
): boolean {
  if (newName.trim().length === 0) {
    diagnostics.push(diagnostic("error", `mutation.${label}.emptyName`, `${label} name cannot be empty.`, path));
    return false;
  }
  return true;
}

export function recordStringChange(
  target: Record<string, unknown>,
  key: string,
  path: string,
  after: string,
  changes: MutationChange[],
  reason?: string,
): void {
  const before = target[key];
  if (before === after) {
    return;
  }
  target[key] = after;
  changes.push(reason === undefined ? { path, before, after } : { path, before, after, reason });
}

export function recordValueChange(
  target: Record<string, unknown>,
  key: string,
  path: string,
  after: unknown,
  changes: MutationChange[],
  reason?: string,
): void {
  const before = target[key];
  if (Object.is(before, after)) {
    return;
  }
  target[key] = after;
  changes.push(reason === undefined ? { path, before, after } : { path, before, after, reason });
}

export function recordDelete(
  target: Record<string, unknown>,
  key: string,
  path: string,
  changes: MutationChange[],
  reason?: string,
): void {
  if (!(key in target)) {
    return;
  }
  const before = target[key];
  delete target[key];
  changes.push(reason === undefined ? { path, before, after: undefined } : { path, before, after: undefined, reason });
}

export function recordArrayRemove<T>(
  target: T[],
  index: number,
  path: string,
  changes: MutationChange[],
  reason: string,
): T | undefined {
  const before = target[index];
  if (before === undefined) {
    return undefined;
  }
  target.splice(index, 1);
  changes.push({ path, before, after: undefined, reason });
  return before;
}

export function replaceArg(
  args: string[] | undefined,
  index: number,
  from: string,
  to: string,
  path: string,
  changes: MutationChange[],
  reason?: string,
): void {
  if (!args || args[index] !== from) {
    return;
  }
  const before = args[index];
  args[index] = to;
  changes.push(reason === undefined ? { path: `${path}[${index}]`, before, after: to } : { path: `${path}[${index}]`, before, after: to, reason });
}

export function replaceStringReference(
  target: Record<string, unknown>,
  key: string,
  from: string,
  to: string,
  path: string,
  changes: MutationChange[],
  reason: string,
): void {
  const value = target[key];
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      if (item !== from) {
        return;
      }
      value[index] = to;
      changes.push({ path: `${path}[${index}]`, before: item, after: to, reason });
    });
    return;
  }

  if (value === from) {
    target[key] = [to];
    changes.push({
      path,
      before: value,
      after: [to],
      reason: `${reason}; normalized legacy scalar field shape`,
    });
  }
}

export function hasStringReference(target: Record<string, unknown>, key: string, expected: string): boolean {
  return stringReferenceIncludes(target[key], expected);
}

export function removeStringReference(
  target: Record<string, unknown>,
  key: string,
  expected: string,
  path: string,
  changes: MutationChange[],
  reason: string,
): void {
  const value = target[key];
  if (Array.isArray(value)) {
    for (let index = value.length - 1; index >= 0; index--) {
      if (value[index] === expected) {
        recordArrayRemove(value, index, `${path}[${index}]`, changes, reason);
      }
    }
    return;
  }
  if (value === expected) {
    target[key] = [];
    changes.push({
      path,
      before: value,
      after: [],
      reason: `${reason}; normalized legacy scalar field shape`,
    });
  }
}

export function replaceDifferentFromZoneArg(
  args: string[] | undefined,
  from: string,
  to: string,
  path: string,
  changes: MutationChange[],
  mode: "biome" | "faction",
): void {
  if (!args) {
    return;
  }

  args.forEach((arg, index) => {
    const parts = arg.trim().split(/\s+/u);
    if (parts.length < 2 || parts[0] !== "differentFrom:") {
      return;
    }

    const zoneTokenIndex = mode === "faction" ? 2 : inferBiomeDifferentFromZoneToken(parts);
    if (zoneTokenIndex === undefined || parts[zoneTokenIndex] !== from) {
      return;
    }

    const before = args[index];
    parts[zoneTokenIndex] = to;
    args[index] = parts.join(" ");
    changes.push({
      path: `${path}[${index}]`,
      before,
      after: args[index],
      reason: `${mode} differentFrom zone reference`,
    });
  });
}

function inferBiomeDifferentFromZoneToken(parts: string[]): number | undefined {
  if (parts.length >= 3) {
    return 2;
  }
  return 1;
}
