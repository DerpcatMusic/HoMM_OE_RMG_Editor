<script lang="ts">
  /**
   * Reusable percentage input for multiplicative decimal fields.
   *
   * Stores the raw decimal (e.g. 0.15) internally, displays it as
   * a percentage (15%) to the user. When the field is empty the
   * placeholder shows a gray default percentage.
   */

  let {
    value = $bindable(undefined as number | undefined),
    placeholder = "",
    label = "",
    hint = "",
    step = 1,
    min = 0,
    max = 100,
    onchange = () => {},
    disabled = false,
    id = "",
  }: {
    value?: number | undefined;
    placeholder?: string;
    label?: string;
    hint?: string;
    step?: number;
    min?: number;
    max?: number;
    onchange?: () => void;
    disabled?: boolean;
    id?: string;
  } = $props();

  /** Decimal -> percentage string for display. */
  function toPercent(v: number | undefined): string {
    if (v === undefined || v === null || Number.isNaN(v)) return "";
    return String(Math.round(v * 100));
  }

  /** Percentage string -> decimal for storage. */
  function fromPercent(s: string): number | undefined {
    const trimmed = s.trim();
    if (trimmed === "") return undefined;
    const n = Number(trimmed);
    if (Number.isNaN(n)) return undefined;
    return n / 100;
  }

  // Internal display string, synced from prop
  let display = $state(toPercent(value));

  // When the prop changes externally (zone switch), re-sync only when not focused
  let focused = $state(false);
  $effect(() => {
    const next = toPercent(value);
    if (!focused) {
      display = next;
    }
  });

  function handleInput(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    display = input.value;
    value = fromPercent(input.value);
  }

  function handleChange() {
    focused = false;
    display = toPercent(value);
    onchange();
  }

  function handleFocus() {
    focused = true;
  }
</script>

<label class="percent-field" class:disabled>
  {#if label}
    <span class="pf-label">{label}</span>
  {/if}
  <span class="pf-wrap">
    <input
      type="number"
      class="pf-input"
      {id}
      value={display}
      {placeholder}
      {step}
      {min}
      {max}
      {disabled}
      oninput={handleInput}
      onfocus={handleFocus}
      onblur={handleChange}
      onkeydown={(e) => { if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur(); }}
    />
    <span class="pf-suffix">%</span>
  </span>
  {#if hint}
    <span class="pf-hint">{hint}</span>
  {/if}
</label>

<style>
  .percent-field {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: var(--space-2, 0.5rem);
    padding: var(--space-1, 0.25rem) 0;
  }

  .pf-label {
    font-size: var(--font-size-sm);
    color: var(--color-muted, #888);
    white-space: nowrap;
  }

  .pf-wrap {
    position: relative;
    display: inline-flex;
    align-items: center;
    width: fit-content;
    min-width: 5ch;
    max-width: 100%;
  }

  .pf-input {
    width: 100%;
    min-width: 3ch;
    padding-right: 1.75rem;
    box-sizing: border-box;
    font-family: var(--font-mono, monospace);
    font-size: var(--font-size-sm);
    background: var(--color-panel, #1a1a1a);
    color: var(--color-ink, #eee);
    border: var(--line, 1px) solid var(--color-line, #333);
    border-radius: 0;
    min-height: 1.5rem;
    padding: 2px var(--space-2, 0.5rem);
  }

  .pf-input::placeholder {
    font-size: var(--font-size-xs);
  }

  .pf-input:focus {
    outline: 1px solid var(--color-accent, #5a9);
    outline-offset: -1px;
  }

  .pf-suffix {
    position: absolute;
    right: 0.4rem;
    pointer-events: none;
    font-size: var(--font-size-xs);
    color: var(--color-muted, #666);
    font-family: var(--font-mono, monospace);
    user-select: none;
  }

  .pf-hint {
    font-size: var(--font-size-xxs);
    color: var(--color-muted, #666);
    line-height: 1.3;
  }

  .percent-field.disabled {
    opacity: 0.5;
    pointer-events: none;
  }
</style>
