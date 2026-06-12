<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    children: Snippet;
    onclick?: (event: MouseEvent) => void;
    type?: "button" | "submit" | "reset";
    variant?: "default" | "secondary" | "primary" | "icon" | "danger";
    size?: "default" | "sm";
    disabled?: boolean;
    title?: string;
    ariaLabel?: string;
    class?: string;
  }

  let {
    children,
    onclick,
    type = "button",
    variant = "default",
    size = "default",
    disabled = false,
    title,
    ariaLabel,
    class: className = "",
  }: Props = $props();
</script>

<button
  {type}
  class="ui-button ui-button-{variant} ui-button-{size} {className}"
  {onclick}
  {disabled}
  {title}
  aria-label={ariaLabel}
>
  {@render children()}
</button>

<style>
  .ui-button {
    min-height: calc(var(--topbar-height) - var(--line-strong));
    padding: 0 var(--space-3);
    border: var(--line) solid var(--color-line-strong);
    border-radius: 0;
    background: var(--color-panel);
    color: var(--color-ink);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-1);
    font: inherit;
    white-space: nowrap;
    cursor: pointer;
  }
  .ui-button:hover {
    background: var(--color-panel-2);
  }
  .ui-button:disabled {
    color: var(--color-muted);
    cursor: not-allowed;
    opacity: 0.55;
  }
  .ui-button-primary {
    background: var(--color-ink);
    color: var(--color-panel);
  }
  .ui-button-primary:hover {
    background: oklch(0.30 0 0);
  }
  .ui-button-secondary {
    background: var(--color-panel);
  }
  .ui-button-icon {
    min-width: 1.75rem;
    min-height: 1.75rem;
    padding: 0;
  }
  .ui-button-danger {
    color: var(--color-state-invalid);
  }
  .ui-button-sm {
    min-height: 1.375rem;
    padding: 1px var(--space-1);
    font-size: var(--font-size-xxs);
  }
</style>
