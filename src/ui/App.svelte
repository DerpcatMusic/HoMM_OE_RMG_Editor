<script lang="ts">
  import { editor } from "./state/editor.svelte.js";
  import Header from "./components/Header.svelte";
  import Sidebar from "./components/Sidebar.svelte";
  import Workspace from "./components/Workspace.svelte";
  import Inspector from "./components/Inspector.svelte";
  import RightDock from "./components/RightDock.svelte";
  import ResizeHandle from "./components/ResizeHandle.svelte";

  let sidebarWidth = $state(224);
  let inspectorWidth = $state(448);

  // Keyboard shortcuts: undo/redo, copy/paste
  function onkeydown(e: KeyboardEvent) {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;

    if (e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
      if (e.key === "z") { editor.undo(); e.preventDefault(); return; }
      if (e.key === "y") { editor.redo(); e.preventDefault(); return; }

      const isConn = editor.inspectorTab === "connection" && editor.session.selectedConnectionName;
      if (e.key === "c") {
        if (isConn) editor.copySelectedConnection();
        else editor.copySelectedZone();
        e.preventDefault();
        return;
      }
      if (e.key === "v") {
        if (isConn) editor.pasteOntoSelectedConnection();
        else editor.pasteOntoSelectedZone();
        e.preventDefault();
        return;
      }
    }
    if (e.ctrlKey && e.altKey && !e.shiftKey && !e.metaKey) {
      if (e.key === "z") { editor.redo(); e.preventDefault(); return; }
    }
  }

  // Init once — async, non-blocking
  editor.init();
</script>
<svelte:window {onkeydown} />

<div class="app-shell" style="--sidebar-width:{sidebarWidth}px;--inspector-width:{inspectorWidth}px;">
  <Header />
  <div class="shell-body">
    <Sidebar />
    <ResizeHandle panel="sidebar" bind:width={sidebarWidth} />
    <Workspace />
    <ResizeHandle panel="inspector" bind:width={inspectorWidth} />
    <RightDock />
  </div>
</div>

<style>
  :global(html, body) {
    margin: 0;
    padding: 0;
    height: 100%;
    overflow: hidden;
  }
  .app-shell {
    width: 100%;
    height: 100dvh;
    min-height: 0;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    overflow: hidden;
  }
  .shell-body {
    min-height: 0;
    display: grid;
    grid-template-columns: var(--sidebar-width) var(--resize-handle-width) minmax(18rem, 1fr) var(--resize-handle-width) minmax(28rem, var(--inspector-width));
    grid-template-rows: minmax(0, 1fr);
    overflow: hidden;
  }
</style>
