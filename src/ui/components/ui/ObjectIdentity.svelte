<script lang="ts">
  interface Props {
    label: string;
    detail?: string;
    meta?: string;
    metaPosition?: "before" | "after";
    icon?: string;
    variant?: "canvas" | "row" | "dialog" | "summary";
    tone?: "neutral" | "main" | "connection" | "crossroads" | "mandatory";
    class?: string;
  }

  let {
    label,
    detail,
    meta,
    metaPosition = "before",
    icon,
    variant = "row",
    tone = "neutral",
    class: className = "",
  }: Props = $props();
</script>

<span class="object-identity object-identity-{variant} object-identity-{tone} {className}">
  {#if icon}
    <span class="material-symbols-outlined object-identity-icon" aria-hidden="true">{icon}</span>
  {/if}
  <span class="object-identity-copy">
    <span class="object-identity-line">
      {#if meta && metaPosition === "before"}
        <span class="object-identity-meta">{meta}</span>
      {/if}
      <span class="object-identity-label">{label}</span>
      {#if meta && metaPosition === "after"}
        <span class="object-identity-meta object-identity-meta-after">{meta}</span>
      {/if}
    </span>
    {#if detail}
      <span class="object-identity-detail">{detail}</span>
    {/if}
  </span>
</span>

<style>
  .object-identity {
    --object-identity-color: var(--color-muted);
    min-width: 0;
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    color: inherit;
  }

  .object-identity-main {
    --object-identity-color: var(--color-object-city);
  }

  .object-identity-connection {
    --object-identity-color: var(--color-connection-default);
  }

  .object-identity-crossroads {
    --object-identity-color: var(--color-role-connector);
  }

  .object-identity-mandatory {
    --object-identity-color: oklch(0.50 0.13 185);
  }

  .object-identity-icon {
    flex: 0 0 auto;
    color: var(--object-identity-color);
    font-family: var(--font-icon);
    font-size: var(--font-size-m);
    line-height: 1;
    font-variation-settings: "wght" 400, "grad" 0, "opsz" 20;
  }

  .object-identity-copy {
    min-width: 0;
    display: grid;
    gap: 1px;
  }

  .object-identity-line {
    min-width: 0;
    display: flex;
    align-items: baseline;
    gap: var(--space-1);
  }

  .object-identity-label,
  .object-identity-detail,
  .object-identity-meta {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .object-identity-label {
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
    font-weight: 600;
  }

  .object-identity-meta {
    flex: 0 0 auto;
    color: var(--object-identity-color);
    font-size: var(--font-size-xxs);
    font-weight: 600;
  }

  .object-identity-meta-after {
    flex: 1 1 auto;
    color: var(--color-muted);
    font-family: var(--font-mono);
    font-weight: 400;
  }

  .object-identity-detail {
    color: var(--color-muted);
    font-size: var(--font-size-xxs);
  }

  .object-identity-canvas {
    max-width: 5.5rem;
    gap: 2px;
  }

  .object-identity-canvas .object-identity-icon {
    font-size: var(--font-size-sm);
  }

  .object-identity-canvas .object-identity-label {
    max-width: 4.25rem;
    font-size: var(--font-size-xxs);
  }

  .object-identity-canvas .object-identity-meta,
  .object-identity-canvas .object-identity-detail {
    display: none;
  }

  .object-identity-dialog .object-identity-label {
    font-family: var(--font-sans);
    font-size: var(--font-size-sm);
  }

  .object-identity-summary {
    gap: var(--space-2);
  }

  .object-identity-summary .object-identity-icon {
    font-size: var(--font-size-l);
  }

  .object-identity-summary .object-identity-label {
    font-family: var(--font-sans);
    font-size: var(--font-size-m);
  }

  .object-identity-summary .object-identity-detail {
    font-size: var(--font-size-sm);
  }
</style>
