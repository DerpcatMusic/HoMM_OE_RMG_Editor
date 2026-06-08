import type {
  Connection,
  ContentCountLimitPreset,
  ContentList,
  ContentPoolConfig,
  MandatoryContentPreset,
  RmgTemplate,
  Zone,
  ZoneLayoutConfig,
} from "../rmg/rmgTypes.js";
import type { Diagnostic } from "../validation/validationTypes.js";

export interface MutationChange {
  path: string;
  before: unknown;
  after: unknown;
  reason?: string;
}

export interface MutationResult<T = RmgTemplate> {
  value: T;
  changes: MutationChange[];
  diagnostics: Diagnostic[];
  ok: boolean;
}

export type ZoneSelector = { zoneIndex: number } | { zoneName: string };

export type ConnectionSelector = { connectionIndex: number } | { connectionName: string };

export type MainObjectSelector = { mainObjectIndex: number };

export type MandatoryContentPresetSelector = { presetIndex: number } | { presetName: string };

export type ContentCountLimitPresetSelector = { presetIndex: number } | { presetName: string };

export type ContentPoolSelector = { poolIndex: number } | { poolName: string };

export type ContentListSelector = { listIndex: number } | { listName: string };

export type ZoneLayoutSelector = { layoutIndex: number } | { layoutName: string };

export interface TemplateMutationInput {
  template: RmgTemplate;
}

export interface VariantMutationInput {
  template: RmgTemplate;
  variantIndex: number;
}

export interface SelectedZone {
  zone: Zone;
  zoneIndex: number;
  path: string;
}

export interface SelectedConnection {
  connection: Connection;
  connectionIndex: number;
  path: string;
}

export interface SelectedMainObject {
  mainObject: NonNullable<Zone["mainObjects"]>[number];
  mainObjectIndex: number;
  path: string;
}

export interface SelectedMandatoryContentPreset {
  preset: MandatoryContentPreset;
  presetIndex: number;
  path: string;
}

export interface SelectedContentCountLimitPreset {
  preset: ContentCountLimitPreset;
  presetIndex: number;
  path: string;
}

export interface SelectedContentPool {
  pool: ContentPoolConfig;
  poolIndex: number;
  path: string;
}

export interface SelectedContentList {
  list: ContentList;
  listIndex: number;
  path: string;
}

export interface SelectedZoneLayout {
  layout: ZoneLayoutConfig;
  layoutIndex: number;
  path: string;
}
