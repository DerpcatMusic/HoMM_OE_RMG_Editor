export type EditorSchemaSectionId =
  | "templateSettings"
  | "gameRules"
  | "winConditions"
  | "zones"
  | "connections"
  | "roads"
  | "contentPools"
  | "mandatoryContent"
  | "compatibility";

export type EditorFieldKind =
  | "string"
  | "localizedString"
  | "integer"
  | "number"
  | "boolean"
  | "enum"
  | "stringArray"
  | "numberArray"
  | "object"
  | "objectArray"
  | "rule"
  | "contentId"
  | "contentIdArray"
  | "contentWeightArray";

export type EditorFieldEditLevel = "firstClass" | "advanced" | "compatibility" | "preserveOnly";

export type EditorFieldSourceStatus =
  | "declared"
  | "declaredUnverifiedRuntime"
  | "officialObservedOnly"
  | "sourceMismatch"
  | "derived";

export type EditorFieldScope =
  | "template"
  | "variant"
  | "zone"
  | "connection"
  | "mainObject"
  | "road"
  | "roadTarget"
  | "contentPool"
  | "contentPoolGroup"
  | "contentList"
  | "mandatoryContentPreset"
  | "mandatoryContentEntry"
  | "contentCountLimitPreset"
  | "contentCountLimitEntry";

export type EditorReferenceTarget =
  | "zone"
  | "connection"
  | "mainObjectIndex"
  | "mandatoryContentEntry"
  | "contentPool"
  | "contentList"
  | "zoneLayout"
  | "mandatoryContentPreset"
  | "contentCountLimitPreset"
  | "rmgContentSid"
  | "artifactSid"
  | "biome"
  | "faction"
  | "player"
  | "mapBonus";

export interface EditorFieldCondition {
  field: string;
  operator: "equals" | "notEquals" | "present" | "absent";
  value?: string | number | boolean;
  note?: string;
}

export interface EditorFieldValidation {
  required?: boolean;
  nonEmpty?: boolean;
  min?: number;
  integer?: boolean;
  finite?: boolean;
  exactLength?: number;
  allowedValues?: readonly string[];
  reference?: EditorReferenceTarget;
  note?: string;
}

export interface EditorPickerMetadata {
  source:
    | "coreCatalog"
    | "generatedCatalog"
    | "localTemplate"
    | "enum"
    | "winConditionPresets"
    | "freeform";
  catalog?: "artifacts" | "biomes" | "contentLists" | "contentPools" | "factions" | "heroes" | "magics" | "rmgContent" | "units";
  mode?: "single" | "multi" | "weighted" | "sampledAlternatives";
}

export interface EditorFieldMetadata {
  id: string;
  section: EditorSchemaSectionId;
  scope: EditorFieldScope;
  path: string;
  label: string;
  kind: EditorFieldKind;
  editLevel: EditorFieldEditLevel;
  sourceStatus: EditorFieldSourceStatus;
  description: string;
  valueMeaning: string;
  sourceEvidence: readonly string[];
  docRefs?: readonly string[];
  mutation?: string;
  picker?: EditorPickerMetadata;
  validation?: EditorFieldValidation;
  conditions?: readonly EditorFieldCondition[];
  sampledAlternative?: boolean;
  compatibilityNote?: string;
}

export interface EditorSchemaSection {
  id: EditorSchemaSectionId;
  label: string;
  description: string;
  docRefs?: readonly string[];
}

export interface EditorSchema {
  version: 1;
  sections: readonly EditorSchemaSection[];
  fields: readonly EditorFieldMetadata[];
}
