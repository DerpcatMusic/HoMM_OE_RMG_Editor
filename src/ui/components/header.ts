import { el } from "../dom.js";
import type { ShellMetrics } from "../data/shellData.js";
import { createButton } from "./primitives.js";

export interface ShellHeaderProps {
  metrics: ShellMetrics;
  templateName: string;
  sourceFileName: string | undefined;
  coreArchiveLabel: string;
  coreArchiveLoaded: boolean;
  dirty: boolean;
  canUndo: boolean;
  canRedo: boolean;
  canSave: boolean;
  onLoadTemplate: () => void;
  onNewTemplate: () => void;
  onSaveTemplate: () => void;
  onAddCoreArchive: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

export function createShellHeader(props: ShellHeaderProps): HTMLElement {
  return el("header", { className: "shell-header" }, [
    el("div", { className: "brand-lockup" }, [
      el("strong", { text: "RMG" }),
      el("span", { text: props.templateName }),
    ]),
    el("div", { className: "header-actions", attrs: { "aria-label": "Shell actions" } }, [
      createButton("Load", { variant: "secondary", icon: "file_open", onClick: props.onLoadTemplate }),
      createButton("New", { variant: "secondary", icon: "note_add", onClick: props.onNewTemplate }),
      createButton("Save", { variant: "primary", icon: "save", onClick: props.onSaveTemplate, disabled: !props.canSave }),
      createButton("Load Core", { variant: "secondary", icon: "package_2", onClick: props.onAddCoreArchive }),
      createButton("Undo", { variant: "secondary", icon: "undo", onClick: props.onUndo, disabled: !props.canUndo }),
      createButton("Redo", { variant: "secondary", icon: "redo", onClick: props.onRedo, disabled: !props.canRedo }),
    ]),
    el("div", { className: "header-status", attrs: { "aria-label": "Editor status" } }, [
      el("span", { className: "header-status-dot", attrs: { "data-state": props.dirty ? "dirty" : "saved", title: props.dirty ? "Unsaved changes" : "Saved", "aria-hidden": "true" } }),
      el("span", { text: props.dirty ? "Unsaved" : "Saved" }),
      el("span", { className: "header-status-core", text: props.coreArchiveLabel, attrs: { title: props.coreArchiveLabel, "data-state": props.coreArchiveLoaded ? "loaded" : "missing" } }),
    ]),
  ]);
}
