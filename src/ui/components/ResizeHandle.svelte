<script lang="ts">


  let { panel, width = $bindable() }: { panel: "sidebar" | "inspector"; width: number } = $props();

  let dragging = $state(false);
  let startX = $state(0);
  let startWidth = $state(0);

  function onpointerdown(e: PointerEvent) {
    dragging = true;
    startX = e.clientX;
    startWidth = width;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  function onpointermove(e: PointerEvent) {
    if (!dragging) return;
    const delta = e.clientX - startX;
    if (panel === "sidebar") {
      width = Math.max(120, Math.min(400, startWidth + delta));
    } else {
      width = Math.max(200, Math.min(600, startWidth - delta));
    }
  }

  function onpointerup() {
    dragging = false;
  }
</script>

<div
  class="shell-resize-handle shell-resize-handle-{panel}"
  role="separator"
  tabindex="0"
  aria-orientation="vertical"
  aria-label={panel === "sidebar" ? "Resize sidebar" : "Resize inspector"}
  onpointerdown={onpointerdown}
  onpointermove={onpointermove}
  onpointerup={onpointerup}
></div>

<style>
  .shell-resize-handle {
    width: var(--resize-handle-width);
    cursor: col-resize;
    background: var(--color-line);
    user-select: none;
    touch-action: none;
  }
  .shell-resize-handle:hover,
  .shell-resize-handle:active {
    background: var(--color-focus);
  }
</style>
