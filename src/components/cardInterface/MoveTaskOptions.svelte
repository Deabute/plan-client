<!-- MoveTaskOptions.svelte Copyright 2021 Paul Beaudet MIT License -->
<script lang="ts">
  import type { memTaskI, taskI } from '../../shared/interface';
  import { editTask, moveTask } from '../../stores/settingsStore';
  import { placeFolder, taskStore } from '../../stores/taskStore';
  import ArrowBarDown from 'svelte-bootstrap-icons/lib/ArrowBarDown';
  // Exposed component props
  export let task: memTaskI;
  // answer "in folder?" or "after folder?"
  export let after: boolean = true;

  const moveToHere = () => {
    placeFolder($moveTask.id, task, after);
    $editTask = null;
  };

  const position = after ? task.position : -1;
  // const parentId = after ? task.parentId : task.id;

  let currentParent = $taskStore.lineage[0];
  taskStore.subscribe((store) => {
    currentParent = store.lineage[0];
  });

  const canMoveHere = (
    goToTask: memTaskI,
    moveT: memTaskI,
    parent: taskI,
    pos: number,
  ): boolean => {
    if (goToTask.id === moveT.id) return false;
    if (moveT.parentId === parent.id && moveT.position - 1 === pos) {
      return false;
    }
    return true;
  };
</script>

{#if $moveTask}
  {#if after}
    <div class="card-body row py-1">
      {#if canMoveHere(task, $moveTask, currentParent, position)}
        <button class="btn-sm btn-outline-dark" on:click={moveToHere}>
          <ArrowBarDown />
          {`Place after ${task.body}`}
        </button>
      {/if}
    </div>
  {:else if canMoveHere(task, $moveTask, currentParent, position)}
    <button class="btn-sm btn-outline-dark m-1" on:click={moveToHere}>
      <ArrowBarDown />
      {`Place to top of:  ${task.body}`}
    </button>
  {/if}
{/if}
