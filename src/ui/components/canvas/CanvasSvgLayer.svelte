<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();
</script>

<svg class="stage-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
  {@render children()}
</svg>

<style>
  .stage-svg {
    position: absolute;
    inset: 0;
    z-index: 1;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
</style>
