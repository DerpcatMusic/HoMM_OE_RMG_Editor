<script lang="ts">
  import { editor } from "../state/editor.svelte.js";

  type BrowserScope = "content" | "pools" | "biomes" | "factions";

  interface BrowserEntry {
    id: string;
    label: string;
    scope: BrowserScope;
    category: string;
    draggable: boolean;
  }

  let catalogOptions = $derived(editor.catalogOptions);
  let search = $state("");
  let scope = $state<BrowserScope>("content");
  let category = $state("All");
  let activeEntry = $state<BrowserEntry | undefined>(undefined);

  let entries = $derived(buildEntries(catalogOptions));
  let scopedEntries = $derived(entries.filter((e) => e.scope === scope));
  let categories = $derived(["All", ...Array.from(new Set(scopedEntries.map((e) => e.category))).sort()]);
  let filtered = $derived(
    scopedEntries
      .filter((e) => category === "All" || e.category === category)
      .filter((e) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return [e.id, e.label, e.category, e.scope].join(" ").toLowerCase().includes(q);
      })
      .slice(0, 120)
  );

  function buildEntries(opts: typeof catalogOptions): BrowserEntry[] {
    return [
      ...opts.rmgContent.map((e) => ({ id: e.id, label: e.label, scope: "content" as const, category: inferContentCategory(e), draggable: true })),
      ...opts.contentPools.map((e) => ({ id: e.id, label: e.label, scope: "pools" as const, category: inferPoolCategory(e), draggable: false })),
      ...opts.biomes.map((e) => ({ id: e.id, label: e.label, scope: "biomes" as const, category: "Biome", draggable: false })),
      ...opts.factions.map((e) => ({ id: e.id, label: e.label, scope: "factions" as const, category: "Faction", draggable: false })),
    ];
  }

  function inferContentCategory(e: { id: string; label: string }): string {
    const parts = e.label.split(" / ").map((p) => p.trim()).filter(Boolean);
    const explicit = parts.slice(1).find(Boolean);
    if (explicit) return explicit;
    if (e.id.startsWith("random_")) return "Random";
    return "Object";
  }

  function inferPoolCategory(e: { id: string }): string {
    const n = e.id.toLowerCase();
    if (n.includes("unguarded")) return "Unguarded";
    if (n.includes("resources")) return "Resources";
    if (n.includes("guarded")) return "Guarded";
    if (n.includes("random")) return "Random";
    return "General";
  }

  function onRowClick(entry: BrowserEntry) {
    activeEntry = entry;
    if (entry.draggable) {
      void navigator.clipboard?.writeText(entry.id);
    }
  }

  function onDragStart(e: DragEvent, entry: BrowserEntry) {
    if (!entry.draggable) {
      e.preventDefault();
      return;
    }
    e.dataTransfer?.setData("text/plain", entry.id);
    e.dataTransfer?.setData("application/x-rmg-content-sid", entry.id);
    if (e.dataTransfer) e.dataTransfer.effectAllowed = "copy";
  }

  function copyId() {
    if (activeEntry) void navigator.clipboard?.writeText(activeEntry.id);
  }

  $effect(() => {
    // Reset category if current scope doesn't have it
    if (!categories.includes(category)) {
      category = "All";
    }
  });
</script>

<section class="content-browser-pane">
  <h3>Content browser</h3>
  <div class="browser-filter-grid">
    <div class="control-row">
      <span>Scope</span>
      <select bind:value={scope}>
        <option value="content">content</option>
        <option value="pools">pools</option>
        <option value="biomes">biomes</option>
        <option value="factions">factions</option>
      </select>
    </div>
    <div class="control-row">
      <span>Category</span>
      <select bind:value={category}>
        {#each categories as c}
          <option value={c}>{c}</option>
        {/each}
      </select>
    </div>
    <div class="control-row">
      <span>Search</span>
      <input type="text" bind:value={search} placeholder="Search SID, name, tag" />
    </div>
  </div>
  <p class="conditional-note">{scopedEntries.length} {scope} entries{search || category !== "All" ? ` / ${filtered.length} shown` : ""}. Click copies ID; draggable rows can be dropped into compatible editors.</p>
  <div class="content-browser-split">
    <div class="content-browser-list">
      {#each filtered as entry (entry.id + entry.scope)}
        <button
          type="button"
          class="content-browser-row"
          class:is-active={activeEntry?.id === entry.id && activeEntry?.scope === entry.scope}
          draggable={entry.draggable}
          title={entry.label}
          onclick={() => onRowClick(entry)}
          ondragstart={(e) => onDragStart(e, entry)}
        >
          <strong>{entry.id}</strong>
          <span>{entry.label}</span>
          <small>{entry.scope} / {entry.category}</small>
        </button>
      {/each}
    </div>
    <div class="content-browser-detail">
      {#if activeEntry}
        <h3>Details</h3>
        <div class="value-row"><strong>ID</strong><span>{activeEntry.id}</span></div>
        <div class="value-row"><strong>Scope</strong><span>{activeEntry.scope}</span></div>
        <div class="value-row"><strong>Category</strong><span>{activeEntry.category}</span></div>
        <div class="value-row"><strong>Label</strong><span>{activeEntry.label}</span></div>
        <div class="inspector-actions">
          <button class="button button-secondary" onclick={copyId}>Copy ID</button>
        </div>
      {:else}
        <h3>Details</h3>
        <p class="conditional-note">Select an entry to see details.</p>
      {/if}
    </div>
  </div>
</section>
