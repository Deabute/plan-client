<!-- CuttoffLine.svelte Copyright 2021 Paul Beaudet MIT License -->
<script lang="ts">
  import { updateTask } from '../indexDb/taskDb';
  import { getDuration } from '../shared/duration';
  import { getHourAndMinutes } from '../shared/velocity';
  import { budgetStore } from '../stores/budgetStore';
  import { taskStore } from '../stores/taskStore';
  import { tachStore } from '../stores/velocityStore';
  export let end: boolean = false;

  const upAction = () => {
    if ($taskStore.lineage[0].priority === $taskStore.tasks.length - 1) {
      $taskStore.lineage[0].priority = 0;
    } else {
      $taskStore.lineage[0].priority++;
    }
    updateTask($taskStore.lineage[0]);
  };

  const downAction = () => {
    $taskStore.lineage[0].priority--;
    updateTask($taskStore.lineage[0]);
  };
</script>

<div class={end ? 'end-line' : 'extra'}>
  <button on:click={upAction}> down </button> - Cuttoff {getHourAndMinutes(
    getDuration($taskStore, $tachStore, $budgetStore, true),
  )} -
  <button on:click={downAction}> up </button>
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
