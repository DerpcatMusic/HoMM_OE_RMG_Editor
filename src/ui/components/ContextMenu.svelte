<script lang="ts">
  import type { ContextMenuItem } from "./contextMenu.svelte.js";

  interface Props {
    items: ContextMenuItem[];
    x: number;
    y: number;
    onClose: () => void;
  }

  let { items, x, y, onClose }: Props = $props();

  function handleClick(item: ContextMenuItem) {
    item.onClick();
    onClose();
  }

  function handlePointerDown(e: PointerEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('.context-menu')) {
      onClose();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose();
  }

  $effect(() => {
    const frame = requestAnimationFrame(() => {
      document.addEventListener('pointerdown', handlePointerDown);
      document.addEventListener('keydown', handleKeydown);
    });
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeydown);
    };
  });
</script>

<div class="context-menu" style="left:{x}px;top:{y}px;">
  {#each items as item (item.label)}
    <button type="button" class="context-menu-item" onclick={() => handleClick(item)}>
      {#if item.icon}
        <span class="material-symbols-outlined" aria-hidden="true">{item.icon}</span>
      {/if}
      <span>{item.label}</span>
    </button>
  {/each}
</div>

<style>
  .context-menu {
    position: fixed;
    z-index: 1000;
    min-width: 10rem;
    background: var(--color-panel);
    border: var(--line-strong) solid var(--color-line-strong);
    box-shadow: 0 4px 16px rgba(0,0,0,0.4);
    display: grid;
  }
  .context-menu-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border: 0;
    border-bottom: var(--line) solid var(--color-line);
    background: var(--color-panel);
    font: inherit;
    font-size: var(--font-size-sm);
    color: var(--color-ink);
    cursor: pointer;
    text-align: left;
  }
  .context-menu-item:last-child { border-bottom: 0; }
  .context-menu-item:hover { background: var(--color-panel-2); }
  .context-menu-item .material-symbols-outlined {
    font-family: var(--font-icon);
    font-size: var(--font-size-m);
    opacity: 0.7;
  }
</style>
