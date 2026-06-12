<script lang="ts">
  import { editor } from "../../state/editor.svelte.js";

  let zone = $derived(editor.selectedZone);
  let conn = $derived(editor.selectedConnection);
  let inspectorTab = $derived(editor.inspectorTab);

  let rawJson = $derived.by(() => {
    if (inspectorTab === "connection" && conn) {
      return JSON.stringify(conn, null, 2);
    }
    if (zone.id !== "__no_zone__") {
      return JSON.stringify(zone, null, 2);
    }
    return "Nothing selected";
  });
</script>

<div class="raw-panel">
  <pre class="raw-json">{rawJson}</pre>
</div>

<style>
  .raw-panel { min-height: 0; }
  .raw-json {
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
    white-space: pre-wrap;
    word-break: break-all;
    margin: 0;
    color: var(--color-ink);
  }
</style>
