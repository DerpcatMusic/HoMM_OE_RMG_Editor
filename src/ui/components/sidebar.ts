import { el } from "../dom.js";
import type { RmgTemplate } from "../../core/rmg/rmgTypes.js";
import type { GeneralNavItem, ShellPlayerItem, ShellZoneItem } from "../data/shellData.js";
import type { GlobalSettingsDraft } from "../state/editorSession.js";
import { formatFileSize, type RememberedCoreArchive } from "../state/browserFiles.js";
import { createButton } from "./primitives.js";
import { createGlobalSettingsForm } from "./inspector.js";

export interface SidebarProps {
  template: RmgTemplate;
  generalItems: readonly GeneralNavItem[];
  zones: readonly ShellZoneItem[];
  players: readonly ShellPlayerItem[];
  focusedPlayer: string | undefined;
  validationErrors: readonly string[];
  activeGeneralId: string;
  selectedZoneId: string;
  statusMessage: string;
  coreArchiveAttached: boolean;
  rememberedCoreArchive: RememberedCoreArchive | undefined;
  onAddZone: () => void;
  onAddCoreArchive: () => void;
  onApplyGlobalSettings: (draft: GlobalSettingsDraft) => void;
  onSelectGeneral: (item: GeneralNavItem) => void;
  onSelectZone: (zone: ShellZoneItem) => void;
  onAddPlayer: () => void;
  onRemovePlayer: (playerId: string) => void;
  onFocusPlayer: (playerId: string | undefined) => void;
}

export function createSidebar(props: SidebarProps): HTMLElement {
  return el("aside", { className: "shell-sidebar", attrs: { "aria-label": "Template navigation" } }, [
    el("div", { className: "sidebar-title" }, [
      el("strong", { text: "Template" }),
      el("span", { text: `${props.zones.length} zones / ${props.template.gameMode ?? "classic"}` }),
    ]),
    el("div", { className: "sidebar-split" }, [
      el("section", { className: "nav-block" }, [
        el("div", { className: "nav-list", attrs: { "aria-label": "Template sections" } }, props.generalItems.map((item) => createGeneralItem(item, props))),
        createGameDataPanel(props),
      ]),
      el("section", { className: "nav-block" }, [
        el("div", { className: "nav-heading-row" }, [
          el("h2", { text: "Players" }),
          createButton("Add", { variant: "secondary", icon: "person_add", iconOnly: true, onClick: props.onAddPlayer }),
        ]),
        el("div", { className: "nav-list", attrs: { "aria-label": "Players" } }, props.players.map((player) => createPlayerItem(player, props))),
        createPlayerStatus(props),
      ]),
      el("section", { className: "nav-block" }, [
        el("div", { className: "nav-heading-row" }, [
          el("h2", { text: "Zones" }),
          createButton("Add zone", { variant: "secondary", icon: "add", iconOnly: true, onClick: props.onAddZone }),
        ]),
        el("div", { className: "nav-list", attrs: { "aria-label": "Zones" } }, props.zones.map((zone) => createZoneItem(zone, props))),
        el("p", { className: "sidebar-status", text: props.statusMessage }),
      ]),
    ]),
    createValidationMarquee(props),
  ]);
}

function createGameDataPanel(props: SidebarProps): HTMLElement {
  if (props.activeGeneralId === "game" || props.activeGeneralId === "win") {
    return el("div", { className: "sidebar-global-body" }, [
      createCoreArchiveReminder(props),
      createGlobalSettingsForm({
        template: props.template,
        onApplyGlobalSettings: props.onApplyGlobalSettings,
      }),
    ]);
  }
  if (props.activeGeneralId === "pools") {
    return el("div", { className: "sidebar-global-body" }, [
      createCoreArchiveReminder(props),
      el("p", { className: "conditional-note", text: "Content pool editor is in the right inspector Pools tab. Zone pool pickers use Core.zip pool IDs here after loading Core.zip." }),
    ]);
  }
  return el("div", { className: "sidebar-global-body" }, [
    createCoreArchiveReminder(props),
    el("p", { className: "conditional-note", text: "Template-level data lives here. Pick Game settings or Win conditions to edit game mode, hero rules, and win conditions." }),
  ]);
}

function createCoreArchiveReminder(props: SidebarProps): HTMLElement {
  if (props.coreArchiveAttached) {
    return el("p", { className: "conditional-note", text: "Core.zip loaded for searchable catalogs." });
  }
  const remembered = props.rememberedCoreArchive;
  if (!remembered) {
    return el("div", { className: "sidebar-core-reminder" }, [
      el("p", { className: "conditional-note", text: "Core.zip not loaded. Catalog-backed dropdowns need it." }),
      createButton("Add Core.zip", { variant: "secondary", icon: "package_2", onClick: props.onAddCoreArchive }),
    ]);
  }
  return el("div", { className: "sidebar-core-reminder" }, [
    el("p", { className: "conditional-note", text: `Last Core.zip: ${remembered.name} (${formatFileSize(remembered.size)}). Select it again after reload.` }),
    createButton("Load last Core.zip", { variant: "secondary", icon: "package_2", onClick: props.onAddCoreArchive }),
  ]);
}

function createGeneralItem(item: GeneralNavItem, props: SidebarProps): HTMLElement {
  const isActive = item.id === props.activeGeneralId;
  return el("button", {
    className: isActive ? "nav-item is-active" : "nav-item",
    attrs: {
      type: "button",
      "aria-current": isActive ? "page" : undefined,
      title: item.detail,
    },
    onClick: () => props.onSelectGeneral(item),
  }, [
    el("span", { className: "material-symbols-outlined nav-item-icon", text: item.icon, attrs: { "aria-hidden": "true" } }),
    el("span", { className: "nav-item-text" }, [
      el("strong", { text: item.label }),
      el("span", { text: item.detail }),
    ]),
  ]);
}

function createZoneItem(zone: ShellZoneItem, props: SidebarProps): HTMLElement {
  const isActive = zone.id === props.selectedZoneId;
  return el("button", {
    className: isActive ? "nav-item is-active" : "nav-item",
    attrs: {
      type: "button",
      "aria-current": isActive ? "page" : undefined,
      title: `${zone.label} - ${zone.owner} - size ${zone.size}`,
    },
    dataset: { zoneRole: zone.role },
    onClick: () => props.onSelectZone(zone),
  }, [
    el("span", { className: "material-symbols-outlined nav-item-icon", text: "grid_view", attrs: { "aria-hidden": "true" } }),
    el("span", { className: "nav-item-text" }, [
      el("strong", { text: zone.label }),
      el("span", { text: `${zone.owner} / ${zone.role}` }),
    ]),
    el("span", { className: "nav-item-count", text: String(zone.size) }),
  ]);
}
function createPlayerItem(player: ShellPlayerItem, props: SidebarProps): HTMLElement {
  const isFocused = props.focusedPlayer === player.id;
  return el("button", {
    className: isFocused ? "nav-item is-active" : "nav-item",
    attrs: {
      type: "button",
      "aria-current": isFocused ? "page" : undefined,
      title: `${player.label} owns ${player.zoneCount} zone${player.zoneCount === 1 ? "" : "s"}`,
    },
    onClick: () => props.onFocusPlayer(isFocused ? undefined : player.id),
  }, [
    el("span", { className: "player-color-dot", attrs: { "aria-hidden": "true", style: `background:${player.color}` } }),
    el("span", { className: "nav-item-text" }, [
      el("strong", { text: player.label }),
      el("span", { text: `${player.zoneCount} zone${player.zoneCount === 1 ? "" : "s"}` }),
    ]),
    createButton("Remove", { variant: "secondary", icon: "person_remove", iconOnly: true, onClick: (event) => {
      event.stopPropagation();
      props.onRemovePlayer(player.id);
    } }),
  ]);
}

function createPlayerStatus(props: SidebarProps): HTMLElement {
  if (props.players.length >= 8) {
    return el("p", { className: "sidebar-status", text: "Maximum 8 players." });
  }
  return el("p", { className: "sidebar-status", text: `${props.players.length} player${props.players.length === 1 ? "" : "s"}. Click Add to expand.` });
}

function createValidationMarquee(props: SidebarProps): HTMLElement {
  if (props.validationErrors.length === 0) {
    return el("div", { className: "validation-marquee is-valid" }, [
      el("span", { text: "No player errors." }),
    ]);
  }
  return el("div", { className: "validation-marquee is-invalid" }, props.validationErrors.map((message) =>
    el("span", { text: message }),
  ));
}
