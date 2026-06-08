import type { GameDataIndex } from "../game-data/gameDataIndex.js";
import { createNamedIndex } from "../game-data/namedIndex.js";
import type {
  ContentCountLimitPreset,
  ContentList,
  ContentPoolConfig,
  MandatoryContentPreset,
  RmgTemplate,
  ZoneLayoutConfig,
} from "../rmg/rmgTypes.js";
import { normalizeStringArray } from "../rmg/stringArrayCompat.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import type {
  ResolvedConnection,
  ResolvedReference,
  ResolvedTemplate,
  ResolvedVariant,
  ResolvedZone,
} from "./resolvedTypes.js";

export interface ResolveTemplateInput {
  template: RmgTemplate;
  sourcePath: string;
  gameData: GameDataIndex;
}

export function resolveTemplate(input: ResolveTemplateInput): ResolvedTemplate {
  const diagnostics: Diagnostic[] = [];
  const template = input.template;
  const localZoneLayouts = namedLocalMap(template.zoneLayouts ?? []);
  const localContentPools = namedLocalMap(template.contentPools ?? []);
  const localContentLists = namedLocalMap(template.contentLists ?? []);
  const mandatoryPresets = namedLocalMap(template.mandatoryContent ?? []);
  const contentCountLimitPresets = namedLocalMap(template.contentCountLimits ?? []);

  const variants = Array.isArray(template.variants)
    ? template.variants.map((variant, index) =>
        resolveVariant({
          template,
          sourcePath: input.sourcePath,
          gameData: input.gameData,
          variant,
          variantIndex: index,
          localZoneLayouts,
          localContentPools,
          mandatoryPresets,
          contentCountLimitPresets,
        }),
      )
    : [];

  if (!Array.isArray(template.variants) || template.variants.length === 0) {
    diagnostics.push(
      diagnostic("error", "template.variants.missing", "Template must define at least one variant.", "$.variants", input.sourcePath),
    );
  }

  return {
    template,
    sourcePath: input.sourcePath,
    variants,
    localZoneLayouts,
    localContentPools,
    localContentLists,
    mandatoryPresets,
    contentCountLimitPresets,
    diagnostics,
  };
}

interface ResolveVariantInput {
  template: RmgTemplate;
  sourcePath: string;
  gameData: GameDataIndex;
  variant: NonNullable<RmgTemplate["variants"]>[number];
  variantIndex: number;
  localZoneLayouts: Map<string, ZoneLayoutConfig>;
  localContentPools: Map<string, ContentPoolConfig>;
  mandatoryPresets: Map<string, MandatoryContentPreset>;
  contentCountLimitPresets: Map<string, ContentCountLimitPreset>;
}

function resolveVariant(input: ResolveVariantInput): ResolvedVariant {
  const diagnostics: Diagnostic[] = [];
  const zones = Array.isArray(input.variant.zones) ? input.variant.zones : [];
  const zoneNameIndex = createNamedIndex(
    zones.map((zone, index) => ({
      name: zone.name,
      value: { zone, index },
      sourcePath: input.sourcePath,
    })),
  );

  for (const duplicate of zoneNameIndex.duplicates) {
    diagnostics.push(
      diagnostic(
        "error",
        "variant.zone.duplicateName",
        `Duplicate zone name '${duplicate.name}'.`,
        `$.variants[${input.variantIndex}].zones`,
        input.sourcePath,
      ),
    );
  }

  const resolvedZones = zones.map((zone, index) =>
    resolveZone({
      ...input,
      zone,
      zoneIndex: index,
    }),
  );

  const resolvedConnections = (input.variant.connections ?? []).map((connection, index): ResolvedConnection => {
    const path = `$.variants[${input.variantIndex}].connections[${index}]`;
    const connectionDiagnostics: Diagnostic[] = [];
    const fromZone = findZoneByName(resolvedZones, connection.from);
    const toZone = findZoneByName(resolvedZones, connection.to);
    const guardZone = findZoneByName(resolvedZones, connection.guardZone);

    if (!connection.from || !fromZone) {
      connectionDiagnostics.push(
        diagnostic("error", "connection.from.missing", `Connection 'from' zone '${connection.from ?? ""}' does not resolve.`, `${path}.from`, input.sourcePath),
      );
    }
    if (!connection.to || !toZone) {
      connectionDiagnostics.push(
        diagnostic("error", "connection.to.missing", `Connection 'to' zone '${connection.to ?? ""}' does not resolve.`, `${path}.to`, input.sourcePath),
      );
    }
    if (connection.guardZone && guardZone && fromZone && toZone && guardZone !== fromZone && guardZone !== toZone) {
      connectionDiagnostics.push(
        diagnostic(
          "warning",
          "connection.guardZone.nonEndpoint",
          `Guard zone '${connection.guardZone}' resolves but is not one of the connection endpoints.`,
          `${path}.guardZone`,
          input.sourcePath,
        ),
      );
    }

    return {
      index,
      connection,
      ...(fromZone ? { fromZone } : {}),
      ...(toZone ? { toZone } : {}),
      ...(guardZone ? { guardZone } : {}),
      diagnostics: connectionDiagnostics,
    };
  });

  return {
    index: input.variantIndex,
    variant: input.variant,
    zones: resolvedZones,
    connections: resolvedConnections,
    diagnostics,
  };
}

interface ResolveZoneInput extends ResolveVariantInput {
  zone: NonNullable<NonNullable<RmgTemplate["variants"]>[number]["zones"]>[number];
  zoneIndex: number;
}

function resolveZone(input: ResolveZoneInput): ResolvedZone {
  const path = `$.variants[${input.variantIndex}].zones[${input.zoneIndex}]`;
  const diagnostics: Diagnostic[] = [];
  const layout = resolveZoneLayout(
    input.zone.layout,
    input.localZoneLayouts,
    input.gameData,
    input.sourcePath,
    `${path}.layout`,
    diagnostics,
  );

  return {
    index: input.zoneIndex,
    zone: input.zone,
    ...(layout ? { layout } : {}),
    guardedContentPools: resolveContentPoolAlternatives(
      normalizeStringArray(input.zone.guardedContentPool),
      input,
      `${path}.guardedContentPool`,
      diagnostics,
    ),
    unguardedContentPools: resolveContentPoolAlternatives(
      normalizeStringArray(input.zone.unguardedContentPool),
      input,
      `${path}.unguardedContentPool`,
      diagnostics,
    ),
    resourcesContentPools: resolveContentPoolAlternatives(
      normalizeStringArray(input.zone.resourcesContentPool),
      input,
      `${path}.resourcesContentPool`,
      diagnostics,
    ),
    mandatoryContentPresets: resolveLocalAlternatives(
      normalizeStringArray(input.zone.mandatoryContent),
      input.mandatoryPresets,
      "mandatoryContent",
      `${path}.mandatoryContent`,
      input.sourcePath,
      diagnostics,
    ),
    contentCountLimitPresets: resolveLocalAlternatives(
      normalizeStringArray(input.zone.contentCountLimits),
      input.contentCountLimitPresets,
      "contentCountLimits",
      `${path}.contentCountLimits`,
      input.sourcePath,
      diagnostics,
    ),
    diagnostics,
  };
}

function resolveZoneLayout(
  id: string | undefined,
  localZoneLayouts: Map<string, ZoneLayoutConfig>,
  gameData: GameDataIndex,
  sourcePath: string,
  path: string,
  diagnostics: Diagnostic[],
): ResolvedReference<ZoneLayoutConfig> | undefined {
  if (!id) {
    diagnostics.push(diagnostic("error", "zone.layout.missing", "Zone layout is required.", path, sourcePath));
    return undefined;
  }
  const local = localZoneLayouts.get(id);
  if (local) {
    return { id, value: local, sourcePath, source: "template-local" };
  }
  const entry = gameData.zoneLayouts.byName.get(id);
  if (!entry) {
    diagnostics.push(diagnostic("error", "zone.layout.unresolved", `Zone layout '${id}' does not resolve.`, path, sourcePath));
    return { id, source: "missing" };
  }
  return { id, value: entry.value, sourcePath: entry.sourcePath, source: "core" };
}

function resolveContentPoolAlternatives(
  ids: string[],
  input: ResolveZoneInput,
  path: string,
  diagnostics: Diagnostic[],
): ResolvedReference<ContentPoolConfig>[] {
  return ids.map((id): ResolvedReference<ContentPoolConfig> => {
    const local = input.localContentPools.get(id);
    if (local) {
      return { id, value: local, sourcePath: input.sourcePath, source: "template-local" };
    }
    const core = input.gameData.contentPools.byName.get(id);
    if (core) {
      return { id, value: core.value, sourcePath: core.sourcePath, source: "core" };
    }
    diagnostics.push(diagnostic("error", "contentPool.unresolved", `Content pool '${id}' does not resolve.`, path, input.sourcePath));
    return { id, source: "missing" };
  });
}

function resolveLocalAlternatives<T>(
  ids: string[],
  byName: Map<string, T>,
  label: string,
  path: string,
  sourcePath: string,
  diagnostics: Diagnostic[],
): ResolvedReference<T>[] {
  return ids.map((id): ResolvedReference<T> => {
    const value = byName.get(id);
    if (value) {
      return { id, value, sourcePath, source: "template-local" };
    }
    diagnostics.push(diagnostic("error", `${label}.unresolved`, `${label} preset '${id}' does not resolve.`, path, sourcePath));
    return { id, source: "missing" };
  });
}

function namedLocalMap<T extends { name?: string }>(items: T[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) {
    if (item.name && !map.has(item.name)) {
      map.set(item.name, item);
    }
  }
  return map;
}

function findZoneByName(zones: ResolvedZone[], name: string | undefined): ResolvedZone | undefined {
  if (!name) {
    return undefined;
  }
  return zones.find((zone) => zone.zone.name === name);
}
