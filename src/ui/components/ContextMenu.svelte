<script lang="ts">
  import { tick } from "svelte";
  import type { ContextMenuItem } from "./contextMenu.svelte.js";

  interface Props {
    items: ContextMenuItem[];
    x: number;
    y: number;
    onClose: () => void;
  }

  let { items, x, y, onClose }: Props = $props();
  let menuElement: HTMLDivElement | undefined = $state();
  let menuX = $state(0);
  let menuY = $state(0);

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

  $effect(() => {
    x; y; items; menuElement;
    void tick().then(() => {
      if (!menuElement) return;
      const pad = 8;
      const rect = menuElement.getBoundingClientRect();
      menuX = Math.max(pad, Math.min(x, window.innerWidth - rect.width - pad));
      menuY = Math.max(pad, Math.min(y, window.innerHeight - rect.height - pad));
    });
  });
</script>

<div class="context-menu" bind:this={menuElement} style="left:{menuX}px;top:{menuY}px;">
  {#each items as item (item.label)}
    <button type="button" class="context-menu-item" class:is-danger={item.variant === "danger"} onclick={() => handleClick(item)}>
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
    max-width: calc(100vw - 1rem);
    background: var(--color-panel);
    border: var(--line-strong) solid var(--color-line-strong);
    display: grid;
    overflow: visible;
  }
  .context-menu-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 1.75rem;
    padding: var(--space-1) var(--space-3);
    border: 0;
    border-bottom: var(--line) solid var(--color-line);
    background: var(--color-panel);
    font: inherit;
    font-size: var(--font-size-sm);
    color: var(--color-ink);
    cursor: pointer;
    text-align: left;
    white-space: nowrap;
  }
  .context-menu-item:last-child { border-bottom: 0; }
  .context-menu-item:hover { background: var(--color-panel-2); }
  .context-menu-item.is-danger {
    color: var(--color-state-invalid);
  }
  .context-menu-item.is-danger:hover {
    background: color-mix(in srgb, var(--color-state-invalid) 12%, var(--color-panel));
    color: var(--color-state-invalid);
  }
  .context-menu-item .material-symbols-outlined {
    font-family: var(--font-icon);
    font-size: var(--font-size-m);
    opacity: 0.7;
  }
  .context-menu-item.is-danger .material-symbols-outlined {
    opacity: 1;
  }
</style>
