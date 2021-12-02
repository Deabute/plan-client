<!-- Todo.svelt Copyright 2021 Paul Beaudet MIT Licence -->
<script lang="ts">
  import { taskStore, newActivity } from '../../stores/taskStore';

  let taskToAdd: string = null;
  const addTask = async () => {
    if (taskToAdd) {
      newActivity(taskToAdd, $taskStore.lineage);
      taskToAdd = null;
    }
  };

  const onKeyEvent = (e) => {
    if (e.keyCode === 13) {
      addTask();
    }
  };

  const onFocus = (el) => {
    el.focus();
  };
</script>

<div class={`input-group my-1`}>
  <input
    class="form-control border-dark"
    type="text"
    bind:value={taskToAdd}
    placeholder="Type & press enter"
    use:onFocus
    aria-label="Input to title and create folders"
  />
  <button class="btn btn-dark" id="add-button" on:click={addTask}> Add </button>
</div>

<svelte:window on:keydown={onKeyEvent} />

<style>
</style>
