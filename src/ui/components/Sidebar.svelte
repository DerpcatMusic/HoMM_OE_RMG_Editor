<script lang="ts">
  import { editor } from "../state/editor.svelte.js";
  import { PLAYER_COLORS } from "../data/shellData.js";
  import GlobalSettingsPanel from "./inspector/GlobalSettingsPanel.svelte";
  import GenerationPanel from "./inspector/GenerationPanel.svelte";
  let zones = $derived(editor.zones);
  let players = $derived(editor.projection.players);
  let errors = $derived(editor.validationErrors);
  // Sidebar section flex state (matches pre-Svelte behavior)
  let sectionFlex = $state({ settings: 6, zones: 2.5, players: 1.5 });
  function startSectionResize(e: PointerEvent, prevKey: "settings" | "zones", nextKey: "zones" | "players") {
    if (e.button !== 0) return;
    e.preventDefault();
    const handle = e.currentTarget as HTMLElement;
    const prev = handle.previousElementSibling as HTMLElement;
    const next = handle.nextElementSibling as HTMLElement;
    if (!prev || !next) return;
    const startY = e.clientY;
    const prevStart = prev.getBoundingClientRect().height;
    const nextStart = next.getBoundingClientRect().height;
    const prevFlex = sectionFlex[prevKey];
    const nextFlex = sectionFlex[nextKey];
    const totalFlex = prevFlex + nextFlex;
    const totalHeight = prevStart + nextStart;
    handle.setPointerCapture(e.pointerId);
    const onMove = (moveEvent: PointerEvent) => {
      const delta = moveEvent.clientY - startY;
      const newPrevHeight = Math.max(40, prevStart + delta);
      const newPrevFlex = (newPrevHeight / totalHeight) * totalFlex;
      const newNextFlex = totalFlex - newPrevFlex;
      sectionFlex = { ...sectionFlex, [prevKey]: newPrevFlex, [nextKey]: newNextFlex };
    };
    const onUp = () => {
      handle.releasePointerCapture(e.pointerId);
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onUp);
    };
    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onUp);
  }
</script>
<aside class="sidebar" aria-label="Sidebar">
  <div class="sidebar-tabs" role="tablist" aria-label="Sidebar tabs">
    <button class="sidebar-tab" class:is-active={editor.sidebarTab === "settings"} role="tab"
      aria-selected={editor.sidebarTab === "settings"} title="Settings"
      onclick={() => editor.sidebarTab = "settings"}>
      <span class="material-symbols-outlined sidebar-tab-icon">settings</span>
      <span class="sidebar-tab-label">Settings</span>
    </button>
    <button class="sidebar-tab" class:is-active={editor.sidebarTab === "generation"} role="tab"
      aria-selected={editor.sidebarTab === "generation"} title="Generation"
      onclick={() => editor.sidebarTab = "generation"}>
      <span class="material-symbols-outlined sidebar-tab-icon">terrain</span>
      <span class="sidebar-tab-label">Generation</span>
    </button>
  </div>
  {#if editor.sidebarTab === "generation"}
    <div class="sidebar-gen-body">
      <GenerationPanel />
    </div>
  {:else}
  <div class="sidebar-body">
    <div class="sidebar-section sidebar-settings" style="flex:{sectionFlex.settings}">
      <GlobalSettingsPanel />
    </div>
  <div class="sidebar-divider" role="separator" aria-label="Resize sections" onpointerdown={(e) => startSectionResize(e, "settings", "zones")}></div>
  <div class="sidebar-section sidebar-zones" style="flex:{sectionFlex.zones}">
    <div class="sidebar-heading">
      <h2>Zones</h2>
      <span class="sidebar-count">{zones.length}</span>
      <button class="sidebar-add-btn" onclick={() => editor.addZone()}>+</button>
    </div>
    <ul class="nav-list">
      {#each zones as zone (zone.id)}
        <li>
          <button
            class="nav-item zone-item"
            class:is-selected={zone.id === editor.selectedZone.id}
            onclick={() => editor.selectZoneByName(zone.label)}
          >
            <span class="zone-color" style="--zone-color:{zone.owner === 'Neutral' ? '#666' : (PLAYER_COLORS[zone.owner] ?? '#888')}"></span>
            <span class="nav-item-text">{zone.label}</span>
            <span class="nav-item-count">{zone.size}</span>
          </button>
        </li>
      {/each}
    </ul>
  </div>
  <div class="sidebar-divider" role="separator" aria-label="Resize sections" onpointerdown={(e) => startSectionResize(e, "zones", "players")}></div>
  <div class="sidebar-section sidebar-players" style="flex:{sectionFlex.players}">
    <div class="sidebar-heading">
      <h2>Players</h2>
      <span class="sidebar-count">{players.length}</span>
      <button class="sidebar-add-btn" onclick={() => editor.addPlayer()}>+</button>
    </div>
    <ul class="nav-list">
      {#each players as player (player.id)}
        <li>
          <div
            class="nav-item player-item"
            class:is-focused={editor.focusedPlayer === player.id}
            role="button"
            tabindex="0"
            onclick={() => editor.setFocusedPlayer(editor.focusedPlayer === player.id ? undefined : player.id)}
            onkeydown={(e) => { if (e.key === "Enter") editor.setFocusedPlayer(editor.focusedPlayer === player.id ? undefined : player.id); }}
          >
            <span class="player-color" style="--player-color:{player.color}"></span>
            <span class="nav-item-text">{player.label}</span>
            <span class="nav-item-count">{player.zoneCount}</span>
            <button class="player-remove" onclick={(e) => { e.stopPropagation(); editor.removePlayer(player.id); }}>×</button>
          </div>
        </li>
      {/each}
    </ul>
  </div>
  </div>
  {/if}
  <div class="sidebar-status-row">
    {#if errors.length > 0}
      <div class="validation-marquee is-invalid">
        {#each errors as error (error)}
          <span>{error}</span>
        {/each}
      </div>
    {:else}
      <div class="validation-marquee is-valid">
        <span>All players have spawn zones</span>
      </div>
    {/if}
    {#if editor.lastMessage}
      <span class="sidebar-status">{editor.lastMessage}</span>
    {/if}
  </div>
</aside>
<style>
  .sidebar {
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
    background: var(--color-panel);
    border-right: var(--line-strong) solid var(--color-line-strong);
  }
  .sidebar-section {
    min-height: 40px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .sidebar-divider {
    flex-shrink: 0;
    height: 5px;
    cursor: row-resize;
    background: var(--color-line-strong);
    touch-action: none;
  }
  .sidebar-divider:hover {
    background: oklch(0.55 0.14 250);
  }
  .sidebar-heading {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border-bottom: var(--line) solid var(--color-line);
    position: sticky;
    top: 0;
    background: var(--color-panel);
    z-index: 1;
  }
  .sidebar-heading h2 {
    font-size: var(--font-size-sm);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin: 0;
  }
  .sidebar-count {
    font-size: var(--font-size-xs);
    color: var(--color-muted);
    font-family: var(--font-mono);
  }
  .sidebar-add-btn {
    margin-left: auto;
    width: 1.25rem;
    height: 1.25rem;
    border: var(--line) solid var(--color-line);
    background: var(--color-panel);
    font: inherit;
    font-size: var(--font-size-sm);
    cursor: pointer;
    display: grid;
    place-items: center;
  }
  .sidebar-add-btn:hover { background: var(--color-panel-2); }
  .nav-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .nav-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    width: 100%;
    padding: var(--space-1) var(--space-3);
    border: 0;
    border-bottom: var(--line) solid var(--color-line);
    background: var(--color-panel);
    font: inherit;
    font-size: var(--font-size-sm);
    cursor: pointer;
    text-align: left;
  }
  .nav-item:hover { background: var(--color-panel-2); }
  .nav-item.is-selected { background: var(--color-active); }
  .nav-item.is-focused { box-shadow: inset 3px 0 0 var(--color-focus); }
  .nav-item-text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .nav-item-count { font-family: var(--font-mono); font-size: var(--font-size-xs); color: var(--color-muted); }
  .zone-color {
    width: 4px;
    align-self: stretch;
    background: var(--zone-color, #888);
    border-radius: 1px;
    flex-shrink: 0;
  }
  .player-color {
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 2px;
    background: var(--player-color, #888);
    flex-shrink: 0;
  }
  .player-remove {
    border: 0;
    background: none;
    font: inherit;
    font-size: var(--font-size-m);
    cursor: pointer;
    color: var(--color-muted);
    padding: 0 var(--space-1);
  }
  .player-remove:hover { color: var(--color-state-invalid); }
  .sidebar-status-row {
    border-top: var(--line-strong) solid var(--color-line-strong);
    padding: var(--space-1) var(--space-3);
    font-size: var(--font-size-xs);
  }
  .validation-marquee.is-valid { color: var(--color-muted); }
  .validation-marquee.is-invalid {
    color: var(--color-state-invalid);
  }
  .sidebar-status { color: var(--color-muted); display: block; margin-top: 2px; }
  .sidebar-tabs {
    display: flex;
    border-bottom: var(--line-strong) solid var(--color-line-strong);
    flex-shrink: 0;
  }
  .sidebar-tab {
    min-width: 0;
    flex: 1 1 0;
    height: 2rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-1);
    border: 0;
    border-right: var(--line) solid var(--color-line);
    background: var(--color-panel);
    color: var(--color-muted);
    cursor: pointer;
  }
  .sidebar-tab:last-child { border-right: 0; }
  .sidebar-tab:hover { background: var(--color-panel-2); color: var(--color-ink); }
  .sidebar-tab.is-active {
    background: var(--color-active);
    color: var(--color-ink);
    box-shadow: inset 0 calc(var(--line-strong) * -1) 0 var(--color-line-strong);
  }
  .sidebar-tab-icon { font-size: var(--font-size-m); }
  .sidebar-tab-label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: var(--font-size-sm);
  }
  .sidebar-body {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .sidebar-body .sidebar-section { min-height: 40px; }
  .sidebar-gen-body {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: var(--space-3);
  }
</style>
