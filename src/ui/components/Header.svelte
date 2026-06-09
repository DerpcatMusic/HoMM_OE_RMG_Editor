<script lang="ts">
  import { editor } from "../state/editor.svelte.js";
</script>

<div class="shell-header">
  <div class="header-left">
    <strong class="header-title">Olden Era RMG Editor</strong>
    {#if editor.sourceFileName}
      <span class="header-file">{editor.sourceFileName}</span>
    {/if}
    {#if editor.dirty}
      <span class="header-dot">●</span>
    {/if}
  </div>
  <div class="header-center">
    <span class="header-template">{editor.templateName}</span>
    {#if editor.lastMessage}
      <span class="header-message">{editor.lastMessage}</span>
    {/if}
  </div>
  <div class="header-right">
    <button class="header-btn" onclick={() => editor.newTemplate()}>New</button>
    <button class="header-btn" onclick={() => editor.loadTemplate()}>Load</button>
    <button class="header-btn" onclick={() => editor.saveTemplate()} disabled={editor.validationErrors.length > 0}>Save</button>
    <span class="header-sep"></span>
    <button class="header-btn" onclick={() => editor.undo()} disabled={!editor.canUndo}>Undo</button>
    <button class="header-btn" onclick={() => editor.redo()} disabled={!editor.canRedo}>Redo</button>
    <span class="header-sep"></span>
    <button class="header-btn" onclick={() => editor.addCoreArchive()}>
      {editor.coreArchiveLoaded ? "Replace Core.zip" : "Attach Core.zip"}
    </button>
  </div>
</div>

<style>
  .shell-header {
    min-height: var(--topbar-height);
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: stretch;
    border-bottom: var(--line-strong) solid var(--color-line-strong);
    background: var(--color-panel);
    font-size: 0.75rem;
  }
  .header-left, .header-center, .header-right {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: 0 var(--space-3);
    min-width: 0;
  }
  .header-left { border-right: var(--line) solid var(--color-line); }
  .header-right { border-left: var(--line) solid var(--color-line); }
  .header-title { font-weight: 600; white-space: nowrap; }
  .header-file { color: var(--color-muted); font-family: var(--font-mono); font-size: 0.6875rem; }
  .header-dot { color: var(--color-state-uncertain); font-size: 0.5rem; }
  .header-template { font-family: var(--font-mono); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .header-message { color: var(--color-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .header-btn {
    height: 1.5rem;
    padding: 0 var(--space-2);
    border: var(--line) solid var(--color-line-strong);
    background: var(--color-panel);
    font: inherit;
    font-size: 0.6875rem;
    cursor: pointer;
  }
  .header-btn:hover { background: var(--color-panel-2); }
  .header-btn:disabled { opacity: 0.4; cursor: default; }
  .header-sep { width: var(--line); height: 1rem; background: var(--color-line); }
</style>
