<script lang="ts">


  const MIN_SIDEBAR_WIDTH = 120;
  const MAX_SIDEBAR_WIDTH = 400;
  const MIN_INSPECTOR_WIDTH = 448;
  const MAX_INSPECTOR_WIDTH = 720;

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
      width = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, startWidth + delta));
    } else {
      width = Math.max(MIN_INSPECTOR_WIDTH, Math.min(MAX_INSPECTOR_WIDTH, startWidth - delta));
    }
  }

  function onpointerup() {
    dragging = false;
  }
</script>

<button
  type="button"
  class="shell-resize-handle shell-resize-handle-{panel}"
  aria-label={panel === "sidebar" ? "Resize sidebar" : "Resize inspector"}
  onpointerdown={onpointerdown}
  onpointermove={onpointermove}
  onpointerup={onpointerup}
></button>

<style>
  .shell-resize-handle {
    width: var(--resize-handle-width);
    padding: 0;
    border: 0;
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
