<!-- ToolTipBar Copyright 2021 Paul Beaudet MIT License -->
<script lang="ts">
  import { showToolTips, visibleTip, toggleToolTips } from './tipStore';
</script>

{#if $showToolTips}
  <div>
    <span>{$visibleTip}</span>
    <button class="btn btn-outline-dark" on:click={toggleToolTips}>
      Got it!
    </button>
  </div>
{/if}
