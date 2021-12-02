<!-- PriorityLine.svelte Copyright 2021 Paul Beaudet MIT Licence -->
<script lang="ts">
  import { updateTask } from '../indexDb/taskDb';
  import { taskStore } from '../stores/taskStore';

  let originLine: number = 0;
  let priorityLine: number = 0;

  taskStore.subscribe((store) => {
    originLine = store.lineage[0].priority;
    priorityLine = originLine;
  });

  const onSpotChange = () => {
    $taskStore.lineage[0].priority = priorityLine;
    updateTask($taskStore.lineage[0]);
  };

  const isValidSpot = (origin: number, line: number): boolean => {
    return origin !== line;
  };
</script>

<div class="settings">
  <label for="line">Cutoff @ task</label>
  <input
    type="number"
    name="line"
    id="line"
    maxlength="2"
    size="2"
    max={$taskStore.tasks.length}
    min="0"
    bind:value={priorityLine}
  />
  {#if isValidSpot(originLine, priorityLine)}
    <button class="btn btn-outline-dark" on:click={onSpotChange}>
      Prioritize
    </button>
  {/if}
</div>

<style>
  .settings {
    margin-top: 0.25rem;
  }
</style>
