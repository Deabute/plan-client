<!-- SprintLine.svelte Copyright 2021 Paul Beaudet MIT License -->
<script lang="ts">
  import type { priority } from '../shared/interface';
  import { budgetStore, getEndOfSprint } from '../stores/budgetStore';
  import CuttoffLine from './CuttoffLine.svelte';
  import EtaLine from './ETALine.svelte';
  export let priority: priority = null;
</script>

{#if priority !== null}
  {#if priority.end}
    <div class="end-line">
      Sprint End: {getEndOfSprint($budgetStore)}
    </div>
    {#if priority.eta}
      <EtaLine />
    {/if}
    {#if priority.cut}
      <CuttoffLine />
    {/if}
  {:else if priority.eta}
    <EtaLine end={true} />
    {#if priority.cut}
      <CuttoffLine />
    {/if}
  {:else if priority.cut}
    <CuttoffLine end={true} />
  {/if}
{/if}

<style>
  .end-line {
    display: flex;
    align-items: center;
    text-align: center;
  }
  .end-line::before,
  .end-line::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid #000;
  }

  .end-line:not(:empty)::before {
    margin-right: 0.25em;
  }

  .end-line:not(:empty)::after {
    margin-left: 0.25em;
  }
</style>
