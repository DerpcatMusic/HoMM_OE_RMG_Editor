import type { EditorFieldMetadata } from "../../../core/editor-schema/index.js";
import type { RmgTemplate } from "../../../core/rmg/rmgTypes.js";
import type { ShellCatalogOptions, ShellConnectionItem, ShellSectionSummary, ShellZoneItem } from "../../data/shellData.js";
import type {
  ConnectionUpdateDraft,
  ContentPoolCreateDraft,
  ContentPoolGroupCreateDraft,
  ContentPoolGroupUpdateDraft,
  MainObjectUpdateDraft,
  RoadUpdateDraft,
  ZoneUpdateDraft,
} from "../../state/editorSession.js";

export type InspectorTab = "zone" | "connection" | "objects" | "content" | "pools" | "roads" | "raw" | "validation";

export interface InspectorProps {
  template: RmgTemplate;
  section: ShellSectionSummary;
  fields: readonly EditorFieldMetadata[];
  selectedZone: ShellZoneItem;
  selectedConnection: ShellConnectionItem | undefined;
  zones: readonly ShellZoneItem[];
  connections: readonly ShellConnectionItem[];
  catalogOptions: ShellCatalogOptions;
  validationErrors: readonly string[];
  activeContentPoolName: string;
  activeTab: InspectorTab;
  onTabChange: (tab: InspectorTab) => void;
  onActiveContentPoolChange: (poolName: string) => void;
  onAddContentPool: (draft: ContentPoolCreateDraft) => void;
  onAddContentPoolGroup: (draft: ContentPoolGroupCreateDraft) => void;
  onApplyContentPoolGroup: (draft: ContentPoolGroupUpdateDraft) => void;
  onApplyConnectionSettings: (draft: ConnectionUpdateDraft) => void;
  onApplyMainObjectSettings: (draft: MainObjectUpdateDraft) => void;
  onApplyRoadSettings: (draft: RoadUpdateDraft) => void;
  onApplyZoneChanges: (draft: ZoneUpdateDraft) => void;
  onRemoveSelectedZone: () => void;
}