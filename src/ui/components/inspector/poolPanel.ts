import type { RmgTemplate } from "../../../core/rmg/rmgTypes.js";
import type { ShellCatalogOptions } from "../../data/shellData.js";
import { el } from "../../dom.js";
import { createButton, createValueRow } from "../primitives.js";
import {
  createControlRow,
  createOptionalNumberInput,
  createSelect,
  createSelectWithLabels,
  createTextarea,
  createTextInput,
  optionalNumber,
  parseContentWeights,
  parseStringList,
  safeParseContentWeights,
} from "./controls.js";
import type { InspectorProps } from "./types.js";

export function createContentPoolEditor(props: InspectorProps): HTMLElement {
  const localPools = props.template.contentPools ?? [];
  const selectedPoolIndex = Math.max(0, localPools.findIndex((pool) => pool.name === props.activeContentPoolName));
  const selectedPool = localPools[selectedPoolIndex] ?? localPools[0];
  const createNameInput = createTextInput(nextPoolName(localPools));
  const poolSelect = createSelectWithLabels(selectedPool?.name ?? "", localPools.map((pool, index) => ({
    value: pool.name ?? String(index),
    label: `${pool.name ?? `Pool ${index + 1}`} (${pool.groups?.length ?? 0} groups)`,
  })));
  poolSelect.addEventListener("change", () => props.onActiveContentPoolChange(poolSelect.value));

  if (!selectedPool) {
    return el("div", { className: "inspector-body" }, [
      el("h3", { text: "Content pools" }),
      el("p", { className: "conditional-note", text: "No template-local content pools yet. Create one, then add content SIDs from the browser." }),
      createControlRow("New pool", createNameInput),
      el("div", { className: "inspector-actions" }, [
        createButton("Create pool", { variant: "primary", icon: "add", onClick: () => props.onAddContentPool({ name: createNameInput.value }) }),
      ]),
      createContentBrowserPanel({ catalogOptions: props.catalogOptions }),
    ]);
  }

  const groups = selectedPool.groups ?? [];
  const groupSelect = createSelectWithLabels("0", groups.map((group, index) => ({
    value: String(index),
    label: `Group ${index + 1}: weight ${group.weight ?? "none"}, content ${group.content?.length ?? 0}`,
  })));
  const selectedGroup = groups[0];
  const weightInput = createOptionalNumberInput(selectedGroup?.weight);
  const includeListsInput = createTextarea((selectedGroup?.includeLists ?? []).join("\n"));
  const contentInput = createTextarea(JSON.stringify(selectedGroup?.content ?? [], null, 2));
  contentInput.classList.add("pool-content-drop-target");

  const syncGroup = () => {
    const group = groups[Number(groupSelect.value)] ?? groups[0];
    weightInput.value = group?.weight === undefined ? "" : String(group.weight);
    includeListsInput.value = (group?.includeLists ?? []).join("\n");
    contentInput.value = JSON.stringify(group?.content ?? [], null, 2);
  };
  groupSelect.addEventListener("change", syncGroup);

  const appendContentSid = (sid: string) => {
    const current = safeParseContentWeights(contentInput.value);
    current.push({ sid, weight: 100 });
    contentInput.value = JSON.stringify(current, null, 2);
  };
  enableContentDrop(contentInput, appendContentSid);

  return el("div", { className: "inspector-body pool-inspector-body" }, [
    el("h3", { text: "Content pool editor" }),
    createControlRow("Local pool", poolSelect),
    createControlRow("New pool", createNameInput),
    el("div", { className: "inspector-actions" }, [
      createButton("Create pool", { variant: "secondary", icon: "add", onClick: () => props.onAddContentPool({ name: createNameInput.value }) }),
    ]),
    el("section", { className: "pool-editor-pane" }, [
      el("h3", { text: selectedPool.name ?? "Pool" }),
      createValueRow("Groups", String(groups.length)),
      createValueRow("Bans", String(selectedPool.bans?.length ?? 0)),
      createControlRow("Group", groupSelect),
      createControlRow("Weight", weightInput),
      createControlRow("Include lists", includeListsInput),
      createControlRow("Content JSON", contentInput),
      el("p", { className: "conditional-note", text: "Use the Browser panel to find valid SIDs. Drop/paste JSON rows here as { sid, weight, variant, biome }." }),
      el("div", { className: "inspector-actions" }, [
        createButton("Add group", { variant: "secondary", icon: "add", onClick: () => props.onAddContentPoolGroup({ poolIndex: selectedPoolIndex }) }),
        createButton("Apply group", { variant: "primary", icon: "check", onClick: () => {
          try {
            props.onApplyContentPoolGroup({
              poolIndex: selectedPoolIndex,
              groupIndex: Number(groupSelect.value),
              weight: optionalNumber(weightInput),
              includeLists: parseStringList(includeListsInput.value),
              content: parseContentWeights(contentInput.value),
            });
          } catch (error) {
            window.alert(error instanceof Error ? error.message : "Content JSON is invalid.");
          }
        }})
    ])
  ])
]);
}

type BrowserScope = "content" | "pools" | "biomes" | "factions";

interface BrowserEntry {
  id: string;
  label: string;
  scope: BrowserScope;
  category: string;
  draggable: boolean;
}

export function createContentBrowserPanel(props: { catalogOptions: ShellCatalogOptions; onAppend?: (sid: string) => void }): HTMLElement {
  const searchInput = createTextInput("");
  searchInput.placeholder = "Search SID, name, tag";
  const scopeInput = createSelect("content", ["content", "pools", "biomes", "factions"]);
  const categoryInput = createSelect("All", ["All"]);
  const entries = createBrowserEntries(props.catalogOptions);
  let activeEntry = entries[0];
  const detail = el("div", { className: "content-browser-detail" });
  const list = el("div", { className: "content-browser-list" });
  const stats = el("p", { className: "conditional-note" });

  const updateDetail = (entry: BrowserEntry | undefined) => {
    activeEntry = entry;
    detail.replaceChildren(...createBrowserDetail(entry));
  };
  const renderList = () => {
    const scopedEntries = entries.filter((entry) => entry.scope === scopeInput.value);
    const categories = ["All", ...Array.from(new Set(scopedEntries.map((entry) => entry.category))).sort()];
    const previousCategory = categoryInput.value;
    categoryInput.replaceChildren(...categories.map((category) => el("option", { text: category, attrs: { value: category } })));
    categoryInput.value = categories.includes(previousCategory) ? previousCategory : "All";
    const query = searchInput.value.trim().toLocaleLowerCase();
    const filtered = scopedEntries
      .filter((entry) => categoryInput.value === "All" || entry.category === categoryInput.value)
      .filter((entry) => !query || [entry.id, entry.label, entry.category, entry.scope].join(" ").toLocaleLowerCase().includes(query))
      .slice(0, 120);
    stats.textContent = `${scopedEntries.length} ${scopeInput.value} entries${query || categoryInput.value !== "All" ? ` / ${filtered.length} shown` : ""}. Click copies ID; draggable rows can be dropped into compatible editors.`;
    list.replaceChildren(...filtered.map((entry) => createContentBrowserRow(entry, props.onAppend, () => updateDetail(entry))));
    updateDetail(filtered.find((entry) => entry.id === activeEntry?.id && entry.scope === activeEntry.scope) ?? filtered[0]);
  };
  searchInput.addEventListener("input", renderList);
  scopeInput.addEventListener("change", renderList);
  categoryInput.addEventListener("change", renderList);
  renderList();
  return el("section", { className: "content-browser-pane" }, [
    el("h3", { text: "Content browser" }),
    el("div", { className: "browser-filter-grid" }, [
      createControlRow("Scope", scopeInput),
      createControlRow("Category", categoryInput),
      createControlRow("Search", searchInput),
    ]),
    stats,
    el("div", { className: "content-browser-split" }, [
      list,
      detail,
    ]),
  ]);
}

function createBrowserEntries(catalogOptions: ShellCatalogOptions): BrowserEntry[] {
  return [
    ...catalogOptions.rmgContent.map((entry) => ({
      id: entry.id,
      label: entry.label,
      scope: "content" as const,
      category: inferContentCategory(entry),
      draggable: true,
    })),
    ...catalogOptions.contentPools.map((entry) => ({
      id: entry.id,
      label: entry.label,
      scope: "pools" as const,
      category: inferPoolCategory(entry),
      draggable: false,
    })),
    ...catalogOptions.biomes.map((entry) => ({
      id: entry.id,
      label: entry.label,
      scope: "biomes" as const,
      category: "Biome",
      draggable: false,
    })),
    ...catalogOptions.factions.map((entry) => ({
      id: entry.id,
      label: entry.label,
      scope: "factions" as const,
      category: "Faction",
      draggable: false,
    })),
  ];
}

function createContentBrowserRow(
  entry: BrowserEntry,
  onAppend: ((sid: string) => void) | undefined,
  onSelect: () => void,
): HTMLElement {
  const row = el("button", {
    className: "content-browser-row",
    attrs: {
      type: "button",
      draggable: entry.draggable ? "true" : "false",
      title: entry.label,
    },
    onClick: () => {
      onSelect();
      if (onAppend && entry.draggable) {
        onAppend(entry.id);
        return;
      }
      void navigator.clipboard?.writeText(entry.id);
    },
  }, [
    el("strong", { text: entry.id }),
    el("span", { text: entry.label }),
    el("small", { text: `${entry.scope} / ${entry.category}` }),
  ]);
  row.addEventListener("dragstart", (event) => {
    if (!entry.draggable) {
      event.preventDefault();
      return;
    }
    event.dataTransfer?.setData("text/plain", entry.id);
    event.dataTransfer?.setData("application/x-rmg-content-sid", entry.id);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "copy";
    }
  });
  return row;
}

function createBrowserDetail(entry: BrowserEntry | undefined): HTMLElement[] {
  if (!entry) {
    return [
      el("h3", { text: "Details" }),
      el("p", { className: "conditional-note", text: "No matching entry." }),
    ];
  }
  return [
    el("h3", { text: "Details" }),
    createValueRow("ID", entry.id),
    createValueRow("Scope", entry.scope),
    createValueRow("Category", entry.category),
    createValueRow("Label", entry.label),
    el("div", { className: "inspector-actions" }, [
      createButton("Copy ID", "secondary", () => {
        void navigator.clipboard?.writeText(entry.id);
      }),
    ]),
  ];
}

function inferContentCategory(entry: ShellCatalogOptions["rmgContent"][number]): string {
  const parts = entry.label.split(" / ").map((part) => part.trim()).filter(Boolean);
  const explicit = parts.slice(1).find(Boolean);
  if (explicit) {
    return explicit;
  }
  if (entry.id.startsWith("random_")) {
    return "Random";
  }
  return "Object";
}

function inferPoolCategory(entry: ShellCatalogOptions["contentPools"][number]): string {
  const normalized = entry.id.toLocaleLowerCase();
  if (normalized.includes("unguarded")) {
    return "Unguarded";
  }
  if (normalized.includes("resources")) {
    return "Resources";
  }
  if (normalized.includes("guarded")) {
    return "Guarded";
  }
  if (normalized.includes("random")) {
    return "Random";
  }
  return "General";
}

function enableContentDrop(target: HTMLTextAreaElement, onAppend: (sid: string) => void): void {
  target.addEventListener("dragover", (event) => {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "copy";
    }
  });
  target.addEventListener("drop", (event) => {
    event.preventDefault();
    const sid = event.dataTransfer?.getData("application/x-rmg-content-sid") || event.dataTransfer?.getData("text/plain");
    if (sid) {
      onAppend(sid);
    }
  });
}

function nextPoolName(pools: NonNullable<RmgTemplate["contentPools"]>): string {
  const used = new Set(pools.map((pool) => pool.name).filter((name): name is string => Boolean(name)));
  let index = pools.length + 1;
  while (used.has(`local_pool_${index}`)) {
    index += 1;
  }
  return `local_pool_${index}`;
}
