import type { IndexedEntry } from "../game-data/namedIndex.js";
import type {
  Connection,
  ContentCountLimitPreset,
  ContentList,
  ContentPoolConfig,
  MandatoryContentPreset,
  RmgTemplate,
  Variant,
  Zone,
  ZoneLayoutConfig,
} from "../rmg/rmgTypes.js";
import type { Diagnostic } from "../validation/validationTypes.js";

export interface ResolvedTemplate {
  template: RmgTemplate;
  sourcePath: string;
  variants: ResolvedVariant[];
  localZoneLayouts: Map<string, ZoneLayoutConfig>;
  localContentPools: Map<string, ContentPoolConfig>;
  localContentLists: Map<string, ContentList>;
  mandatoryPresets: Map<string, MandatoryContentPreset>;
  contentCountLimitPresets: Map<string, ContentCountLimitPreset>;
  diagnostics: Diagnostic[];
}

export interface ResolvedVariant {
  index: number;
  variant: Variant;
  zones: ResolvedZone[];
  connections: ResolvedConnection[];
  diagnostics: Diagnostic[];
}

export interface ResolvedZone {
  index: number;
  zone: Zone;
  layout?: ResolvedReference<ZoneLayoutConfig>;
  guardedContentPools: ResolvedReference<ContentPoolConfig>[];
  unguardedContentPools: ResolvedReference<ContentPoolConfig>[];
  resourcesContentPools: ResolvedReference<ContentPoolConfig>[];
  mandatoryContentPresets: ResolvedReference<MandatoryContentPreset>[];
  contentCountLimitPresets: ResolvedReference<ContentCountLimitPreset>[];
  diagnostics: Diagnostic[];
}

export interface ResolvedConnection {
  index: number;
  connection: Connection;
  fromZone?: ResolvedZone;
  toZone?: ResolvedZone;
  guardZone?: ResolvedZone;
  diagnostics: Diagnostic[];
}

export interface ResolvedReference<T> {
  id: string;
  value?: T;
  sourcePath?: string;
  source: "template-local" | "core" | "missing";
}

export function fromIndexedEntry<T>(id: string, entry: IndexedEntry<T> | undefined): ResolvedReference<T> | undefined {
  if (!entry) {
    return undefined;
  }
  return {
    id,
    value: entry.value,
    sourcePath: entry.sourcePath,
    source: "core",
  };
}
