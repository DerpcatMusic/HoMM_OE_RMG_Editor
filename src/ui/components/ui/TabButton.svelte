<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    children?: Snippet;
    icon?: string;
    label: string;
    active: boolean;
    onclick: (event: MouseEvent) => void;
    orientation?: "horizontal" | "vertical";
    class?: string;
  }

  let {
    children,
    icon,
    label,
    active,
    onclick,
    orientation = "horizontal",
    class: className = "",
  }: Props = $props();
</script>

<button
  class="ui-tab ui-tab-{orientation} {className}"
  class:is-active={active}
  role="tab"
  aria-selected={active}
  title={label}
  aria-label={label}
  {onclick}
>
  {#if icon}
    <span class="material-symbols-outlined tab-icon" aria-hidden="true">{icon}</span>
  {/if}
  {#if children}
    {@render children()}
  {:else}
    <span class="tab-label">{label}</span>
  {/if}
</button>

<style>
  .ui-tab {
    border: 0;
    border-right: var(--line) solid var(--color-line);
    background: var(--color-panel);
    color: var(--color-muted);
    cursor: pointer;
    font: inherit;
  }
  .ui-tab:hover {
    background: var(--color-panel-2);
    color: var(--color-ink);
  }
  .ui-tab.is-active {
    background: var(--color-active);
    color: var(--color-ink);
    box-shadow: inset 0 calc(var(--line-strong) * -1) 0 var(--color-line-strong);
  }
  .ui-tab-horizontal {
    min-width: 2.25rem;
    height: 2rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-1);
    padding: 0 var(--space-2);
  }
  .ui-tab-vertical {
    min-width: 0;
    min-height: 3.5rem;
    display: grid;
    place-items: center;
    gap: 2px;
    padding: var(--space-1) 0;
    border-right: 0;
    border-bottom: var(--line) solid var(--color-line-strong);
  }
  .ui-tab-vertical.is-active {
    box-shadow: inset calc(var(--line-strong) * -1) 0 0 var(--color-line-strong);
  }
  .tab-icon {
    font-family: var(--font-icon);
    font-size: 1rem;
    line-height: 1;
  }
  .tab-label {
    font-size: 0.75rem;
  }
</style>
