import type { RmgTemplate } from "../../core/rmg/rmgTypes.js";
import { el } from "../dom.js";
import type { ShellPlayerItem, ShellZoneItem } from "../data/shellData.js";
import type { GlobalSettingsDraft } from "../state/editorSession.js";
import { createButton } from "./primitives.js";
import { createGlobalSettingsForm } from "./inspector/globalSettingsPanel.js";

export interface SidebarSectionFlex {
  settings: number;
  zones: number;
  players: number;
}

export interface SidebarProps {
  template: RmgTemplate;
  zones: readonly ShellZoneItem[];
  players: readonly ShellPlayerItem[];
  focusedPlayer: string | undefined;
  validationErrors: readonly string[];
  selectedZoneId: string;
  statusMessage: string;
  sectionFlex: SidebarSectionFlex;
  onSectionResize: (section: keyof SidebarSectionFlex, flex: number) => void;
  onAddZone: () => void;
  onApplyGlobalSettings: (draft: GlobalSettingsDraft) => void;
  onSelectZone: (zone: ShellZoneItem) => void;
  onAddPlayer: () => void;
  onRemovePlayer: (playerId: string) => void;
  onFocusPlayer: (playerId: string | undefined) => void;
}

export function createSidebar(props: SidebarProps): HTMLElement {
  return el("aside", { className: "shell-sidebar", attrs: { "aria-label": "Template navigation" } }, [
    el("div", { className: "sidebar-section sidebar-section--settings", attrs: { style: `flex:${props.sectionFlex.settings}` } }, [
      createGlobalSettingsForm({
        template: props.template,
        onApplyGlobalSettings: props.onApplyGlobalSettings,
      }),
    ]),
    createSidebarDivider("settings-zones", props),
    el("div", { className: "sidebar-section sidebar-section--zones", attrs: { style: `flex:${props.sectionFlex.zones}` } }, [
      el("div", { className: "nav-heading-row" }, [
        el("h2", { text: "Zones" }),
        createButton("Add zone", { variant: "secondary", icon: "add", iconOnly: true, onClick: props.onAddZone }),
      ]),
      el("div", { className: "nav-list", attrs: { "aria-label": "Zones" } }, props.zones.map((zone) => createZoneItem(zone, props))),
      el("p", { className: "sidebar-status", text: props.statusMessage }),
    ]),
    createSidebarDivider("zones-players", props),
    el("div", { className: "sidebar-section sidebar-section--players", attrs: { style: `flex:${props.sectionFlex.players}` } }, [
      el("div", { className: "nav-heading-row" }, [
        el("h2", { text: "Players" }),
        createButton("Add", { variant: "secondary", icon: "person_add", iconOnly: true, onClick: props.onAddPlayer }),
      ]),
      el("div", { className: "nav-list", attrs: { "aria-label": "Players" } }, props.players.map((player) => createPlayerItem(player, props))),
      createPlayerStatus(props),
    ]),
    createValidationMarquee(props),
  ]);
}

function createSidebarDivider(id: string, props: SidebarProps): HTMLElement {
  const handle = el("div", { className: "sidebar-divider", attrs: { role: "separator", "aria-label": "Resize section" } });
  handle.dataset.dividerId = id;
  handle.addEventListener("pointerdown", (event) => startSidebarResize(event, handle, id, props));
  return handle;
}

const DIVIDER_SECTIONS: Record<string, [keyof SidebarSectionFlex, keyof SidebarSectionFlex]> = {
  "settings-zones": ["settings", "zones"],
  "zones-players": ["zones", "players"],
};

function startSidebarResize(event: PointerEvent, handle: HTMLElement, dividerId: string, props: SidebarProps): void {
  event.preventDefault();
  const prev = handle.previousElementSibling as HTMLElement | null;
  const next = handle.nextElementSibling as HTMLElement | null;
  if (!prev || !next) return;
  const sections = DIVIDER_SECTIONS[dividerId];
  if (!sections) return;
  const startY = event.clientY;
  const prevStart = prev.getBoundingClientRect().height;
  const nextStart = next.getBoundingClientRect().height;
  const prevFlex = props.sectionFlex[sections[0]];
  const nextFlex = props.sectionFlex[sections[1]];
  const totalFlex = prevFlex + nextFlex;
  const totalHeight = prevStart + nextStart;

  const onMove = (moveEvent: PointerEvent) => {
    const delta = moveEvent.clientY - startY;
    const newPrevHeight = Math.max(40, prevStart + delta);
    const newNextHeight = Math.max(40, nextStart - delta);
    const newPrevFlex = (newPrevHeight / totalHeight) * totalFlex;
    const newNextFlex = (newNextHeight / totalHeight) * totalFlex;
    prev.style.flex = String(newPrevFlex);
    next.style.flex = String(newNextFlex);
    props.onSectionResize(sections[0], newPrevFlex);
    props.onSectionResize(sections[1], newNextFlex);
  };
  const onUp = () => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
  };
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
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
    className: isFocused ? "nav-item is-active player-nav-item" : "nav-item player-nav-item",
    attrs: {
      type: "button",
      "aria-current": isFocused ? "page" : undefined,
      title: `${player.label} owns ${player.zoneCount} zone${player.zoneCount === 1 ? "" : "s"}`,
      style: `--player-color:${player.color}`,
    },
    onClick: () => props.onFocusPlayer(isFocused ? undefined : player.id),
  }, [
    el("span", { className: "player-color-strip", attrs: { "aria-hidden": "true" } }),
    el("span", { className: "nav-item-text" }, [
      el("strong", { text: player.label }),
      el("span", { text: `${player.zoneCount}z` }),
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
