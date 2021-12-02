<!-- ETALine.svelte Copyright 2021 Paul Beaudet MIT License -->
<script lang="ts">
  import { updateTask } from '../indexDb/taskDb';
  import { getHourAndMinutes } from '../shared/velocity';
  import { taskStore } from '../stores/taskStore';
  import { tachStore } from '../stores/velocityStore';
  import { budgetStore } from '../stores/budgetStore';
  import { getDuration } from '../shared/duration';
  export let end: boolean = false;

  const onCuttoffAdd = () => {
    $taskStore.lineage[0].priority = $taskStore.tasks.length - 1;
    updateTask($taskStore.lineage[0]);
  };
</script>

<div class={end ? 'end-line' : 'extra'}>
  Total: {getHourAndMinutes(getDuration($taskStore, $tachStore, $budgetStore))}
  {#if !$taskStore.lineage[0].priority && $taskStore.lineage[0].id !== '1' && $taskStore.tasks.length > 1}
    <button on:click={onCuttoffAdd}> Add Cutoff </button>
  {/if}
</div>

<style>
  button {
    border: none;
    color: blue;
  }
  .extra {
    align-items: center;
    text-align: center;
  }
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
