<script lang="ts">
  import { editor } from "../state/editor.svelte.js";

  let templateNameInput = $state(editor.templateName);
  let templateNameFocused = $state(false);

  $effect(() => {
    if (!templateNameFocused) {
      templateNameInput = editor.templateName;
    }
  });

  function commitTemplateName() {
    const nextName = templateNameInput.trim();
    if (!nextName) {
      templateNameInput = editor.templateName;
      return;
    }
    editor.renameTemplate(nextName);
    templateNameInput = editor.templateName;
  }

  function onTemplateNameKeydown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.currentTarget instanceof HTMLInputElement && event.currentTarget.blur();
      return;
    }
    if (event.key === "Escape") {
      templateNameInput = editor.templateName;
      event.currentTarget instanceof HTMLInputElement && event.currentTarget.blur();
    }
  }
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
    <label class="header-template-field">
      <span class="sr-only">Template name</span>
      <input
        class="header-template-input"
        bind:value={templateNameInput}
        onfocus={() => { templateNameFocused = true; }}
        onblur={() => { templateNameFocused = false; commitTemplateName(); }}
        onkeydown={onTemplateNameKeydown}
        spellcheck="false"
        aria-label="Template name"
      />
    </label>
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
    font-size: var(--font-size-sm);
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
  .header-file { color: var(--color-muted); font-family: var(--font-mono); font-size: var(--font-size-sm); }
  .header-dot { color: var(--color-state-uncertain); font-size: var(--font-size-xxs); }
  .header-template-field {
    min-width: 10rem;
    max-width: min(24rem, 42vw);
    display: block;
  }
  .header-template-input {
    width: 100%;
    height: 1.5rem;
    box-sizing: border-box;
    border: var(--line) solid transparent;
    background: transparent;
    color: var(--color-ink);
    font: inherit;
    font-family: var(--font-mono);
    font-weight: 500;
    font-size: var(--font-size-sm);
    padding: 0 var(--space-1);
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .header-template-input:hover {
    border-color: var(--color-line);
    background: var(--color-panel-2);
  }
  .header-template-input:focus {
    border-color: var(--color-focus);
    outline: var(--line) solid var(--color-focus);
    outline-offset: 0;
    background: var(--color-panel);
  }
  .header-message { color: var(--color-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  .header-btn {
    height: 1.5rem;
    padding: 0 var(--space-2);
    border: var(--line) solid var(--color-line-strong);
    background: var(--color-panel);
    font: inherit;
    font-size: var(--font-size-sm);
    cursor: pointer;
  }
  .header-btn:hover { background: var(--color-panel-2); }
  .header-btn:disabled { opacity: 0.4; cursor: default; }
  .header-sep { width: var(--line); height: 1rem; background: var(--color-line); }
</style>
