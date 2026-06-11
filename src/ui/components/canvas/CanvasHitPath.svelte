<script lang="ts">
  import { isActivationKey } from "./canvasGeometry.js";

  interface Props {
    d: string;
    class?: string;
    label?: string;
    onclick: () => void;
    oncontextmenu?: (event: MouseEvent) => void;
  }

  let {
    d,
    class: className = "",
    label = "Canvas item",
    onclick,
    oncontextmenu,
  }: Props = $props();

  function handleClick(event: MouseEvent) {
    event.stopPropagation();
    onclick();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!isActivationKey(event)) return;
    event.preventDefault();
    onclick();
  }

  function stopDoubleClick(event: MouseEvent) {
    event.stopPropagation();
  }
</script>

<path
  class={className}
  {d}
  onclick={handleClick}
  {oncontextmenu}
  role="button"
  tabindex="0"
  aria-label={label}
  onkeydown={handleKeydown}
  ondblclick={stopDoubleClick}
/>

<style>
  :global(.stage-link-hit),
  :global(.road-hit) {
    fill: none;
    stroke: transparent;
    vector-effect: non-scaling-stroke;
    pointer-events: stroke;
    cursor: pointer;
  }

  :global(.stage-link-hit) {
    stroke-width: 12;
  }

  :global(.road-hit) {
    stroke-width: 10;
  }
</style>
