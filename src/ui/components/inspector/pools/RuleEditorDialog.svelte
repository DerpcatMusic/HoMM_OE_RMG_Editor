<script lang="ts">
  import type { MandatoryContent, PlacementRule } from "../../../../core/rmg/rmgTypes.js";
  import type { ShellCatalogOption } from "../../../data/shellData.js";

  interface Props {
    entryIndex: number;
    entry: MandatoryContent;
    ruleTypes: readonly string[];
    ruleSummary: (entry: MandatoryContent) => string;
    ruleNeedsArgs: (type: string) => boolean;
    ruleArgLabel: (type: string) => string;
    ruleArgOptions: (type: string) => readonly ShellCatalogOption[];
    onClose: () => void;
    onAddRule: (entryIndex: number, type: string) => void;
    onRemoveRule: (entryIndex: number, ruleIndex: number) => void;
    onUpdateRuleField: (entryIndex: number, ruleIndex: number, field: keyof PlacementRule | string, value: unknown) => void;
  }

  let {
    entryIndex,
    entry,
    ruleTypes,
    ruleSummary,
    ruleNeedsArgs,
    ruleArgLabel,
    ruleArgOptions,
    onClose,
    onAddRule,
    onRemoveRule,
    onUpdateRuleField,
  }: Props = $props();

  let selectedRuleType = $state("Road");

  function parseOptionalNumber(value: string): number | undefined {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  function parseArgs(value: string): string[] | undefined {
    const args = value.split(/[,]+/).map((part) => part.trim()).filter(Boolean);
    return args.length > 0 ? args : undefined;
  }

  function handleDialogKeydown(event: KeyboardEvent) {
    if (event.key !== "Escape") return;
    event.preventDefault();
    onClose();
  }
</script>

<div class="modal-backdrop" role="presentation" onclick={onClose}>
  <div
    class="rule-dialog"
    role="dialog"
    aria-modal="true"
    aria-label="Edit placement rules for E{entryIndex}"
    tabindex="-1"
    onclick={(event) => event.stopPropagation()}
    onkeydown={handleDialogKeydown}
  >
    <header class="rule-dialog-head">
      <div>
        <h2>E{entryIndex} rules</h2>
        <small>{entry.sid ?? "Random"}: {ruleSummary(entry)}</small>
      </div>
      <button class="button-icon" onclick={onClose} title="Close rules editor">x</button>
    </header>

    <div class="rule-list">
      {#each entry.rules ?? [] as rule, ri (rule)}
        <div class="rule-card">
          <div class="rule-card-head">
            <strong>R{ri}</strong>
            <select value={rule.type ?? ""} onchange={(event) => onUpdateRuleField(entryIndex, ri, "type", event.currentTarget.value)}>
              {#each ruleTypes as rt (rt)}<option value={rt}>{rt}</option>{/each}
            </select>
            <button class="button-icon danger" onclick={() => onRemoveRule(entryIndex, ri)} title="Remove rule">x</button>
          </div>

          {#if ruleNeedsArgs(rule.type ?? "")}
            <label class="rule-field wide">
              <span>{ruleArgLabel(rule.type ?? "")}</span>
              <input
                type="search"
                list={`rule-arg-options-${entryIndex}-${ri}`}
                value={(rule.args ?? []).join(", ")}
                oninput={(event) => onUpdateRuleField(entryIndex, ri, "args", parseArgs(event.currentTarget.value))}
              />
            </label>
            <datalist id={`rule-arg-options-${entryIndex}-${ri}`}>
              {#each ruleArgOptions(rule.type ?? "") as option (option.id)}
                <option value={option.id} label={option.label}></option>
              {/each}
            </datalist>
          {/if}

          <div class="rule-field-grid">
            <label class="rule-field">
              <span>Weight</span>
              <input type="text" inputmode="decimal" value={rule.weight ?? ""} placeholder="default" oninput={(event) => onUpdateRuleField(entryIndex, ri, "weight", parseOptionalNumber(event.currentTarget.value))} />
            </label>
            <label class="rule-field">
              <span>Target</span>
              <input type="text" inputmode="decimal" value={rule.target ?? ""} placeholder="default" oninput={(event) => onUpdateRuleField(entryIndex, ri, "target", parseOptionalNumber(event.currentTarget.value))} />
            </label>
            <label class="rule-field">
              <span>Min</span>
              <input type="text" inputmode="decimal" value={rule.targetMin ?? ""} placeholder="default" oninput={(event) => onUpdateRuleField(entryIndex, ri, "targetMin", parseOptionalNumber(event.currentTarget.value))} />
            </label>
            <label class="rule-field">
              <span>Max</span>
              <input type="text" inputmode="decimal" value={rule.targetMax ?? ""} placeholder="default" oninput={(event) => onUpdateRuleField(entryIndex, ri, "targetMax", parseOptionalNumber(event.currentTarget.value))} />
            </label>
          </div>
        </div>
      {/each}
      {#if (entry.rules ?? []).length === 0}
        <p class="placeholder pane-empty">No placement rules on this entry.</p>
      {/if}
    </div>

    <footer class="rule-dialog-foot">
      <select bind:value={selectedRuleType} aria-label="Rule type to add">
        {#each ruleTypes as rt (rt)}<option value={rt}>{rt}</option>{/each}
      </select>
      <button class="btn primary" onclick={() => onAddRule(entryIndex, selectedRuleType)}>Add rule</button>
    </footer>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 40;
    display: grid;
    place-items: center;
    padding: var(--space-4);
    background: color-mix(in srgb, var(--color-ink) 18%, transparent);
  }
  .rule-dialog {
    inline-size: min(58rem, calc(100vw - 2rem));
    max-block-size: min(42rem, calc(100dvh - 2rem));
    min-inline-size: 0;
    display: grid;
    grid-template-rows: 2.75rem minmax(0, 1fr) 2.35rem;
    border: var(--line-strong) solid var(--color-line-strong);
    background: var(--color-panel);
    overflow: hidden;
  }
  .rule-dialog-head,
  .rule-dialog-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    padding: 0 var(--space-3);
    border-bottom: var(--line) solid var(--color-line);
    background: var(--color-panel-2);
  }
  .rule-dialog-foot {
    justify-content: end;
    border-top: var(--line) solid var(--color-line);
    border-bottom: 0;
  }
  .rule-dialog h2 {
    margin: 0;
    font-family: var(--font-mono);
    font-size: 0.95rem;
  }
  .rule-dialog small {
    color: var(--color-muted);
    font-size: 0.6875rem;
  }
  .rule-dialog select,
  .rule-dialog input {
    min-inline-size: 0;
    border: var(--line) solid var(--color-line);
    background: var(--color-panel);
    color: inherit;
    font: inherit;
  }
  .rule-list {
    min-block-size: 0;
    overflow: auto;
    display: grid;
    align-content: start;
  }
  .rule-card {
    display: grid;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border-bottom: var(--line) solid var(--color-line);
    background: var(--color-panel);
  }
  .rule-card-head {
    display: grid;
    grid-template-columns: 2.5rem minmax(10rem, 1fr) auto;
    align-items: center;
    gap: var(--space-2);
  }
  .rule-card-head strong {
    font-family: var(--font-mono);
  }
  .rule-field-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(5rem, 1fr));
    gap: var(--space-2);
  }
  .rule-field {
    display: grid;
    gap: 0.125rem;
    min-inline-size: 0;
    color: var(--color-muted);
    font-size: 0.6875rem;
  }
  .rule-field span {
    font-weight: 600;
  }
  .rule-field input {
    block-size: 1.6rem;
    padding: 0 var(--space-1);
    color: var(--color-ink);
    font-family: var(--font-mono);
  }
  .rule-field.wide {
    max-inline-size: none;
  }
  .btn {
    block-size: 1.45rem;
    border: var(--line) solid var(--color-line-strong);
    background: var(--color-panel);
    padding: 0 var(--space-2);
    cursor: pointer;
    white-space: nowrap;
    font: inherit;
  }
  .btn.primary {
    background: var(--color-ink);
    color: var(--color-panel);
  }
  .button-icon {
    border: 0;
    background: transparent;
    cursor: pointer;
    font-size: var(--font-size-sm);
    padding: 0.125rem;
    color: var(--color-muted);
    line-height: 1;
  }
  .button-icon:hover {
    color: var(--color-text);
  }
  .button-icon.danger:hover {
    color: #e55;
  }
  .placeholder {
    color: var(--color-muted);
    font-size: var(--font-size-sm);
    margin: 0;
    padding: var(--space-2);
  }
</style>
