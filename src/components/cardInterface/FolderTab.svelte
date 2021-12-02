<!-- FolderTab.svelte Copyright 2021 Paul Beaudet MIT License -->
<script lang="ts">
  import type { memTaskI } from '../../shared/interface';
  import { editTask, moveTask } from '../../stores/settingsStore';
  import { modifyBody, checkOff, openFolder } from '../../stores/taskStore';
  import RecordBtn from 'svelte-bootstrap-icons/lib/RecordBtn';
  import Check from 'svelte-bootstrap-icons/lib/Check';
  import { recordTime, timeStore } from '../../stores/timeStore';
  import FolderSymlink from 'svelte-bootstrap-icons/lib/FolderSymlink';

  export let task: memTaskI | null = null;
  export let topChildMode: boolean = false;
  export let topChildShowing: boolean;

  let grey: boolean = topChildMode ? true : false;
  let showUpdate: boolean = false;
  let renameInput: string = '';

  // Grey out other task while moving a task
  moveTask.subscribe((taskToMove) => {
    if (topChildMode) return;
    if (taskToMove && taskToMove.id !== task.id) return;
    grey = taskToMove ? true : false;
  });

  const onNameChange = () => {
    // TODO: This is probably dangerous and needs to be validated against injection
    // seems like gt & lt get converted in chrome
    renameInput = document
      .getElementById(`folder-${task.id}`)
      .innerHTML.valueOf();
    showUpdate = renameInput && renameInput !== task.body ? true : false;
  };

  const recording = (runningTask: string, topChild: boolean): boolean => {
    if (topChild) {
      if (task.topChild && task.topChild.id === runningTask) return true;
    } else {
      if (task.id === runningTask) return true;
    }
    return false;
  };

  const record = () => {
    const { topChild, ...baseTask } = task;
    recordTime(topChildShowing ? topChild : baseTask);
  };

  const onRename = () => {
    if (renameInput) {
      modifyBody(task, renameInput);
      showUpdate = false;
    }
  };
</script>

<div class={`row text-center py-1${grey ? ' text-secondary' : ''}`}>
  {#if $moveTask}
    {#if !topChildMode && $moveTask?.id !== task.id}
      <div
        class="col-2"
        type="button"
        on:click={openFolder(task, $moveTask, false)}
      >
        <FolderSymlink />
      </div>
    {:else}
      <div class="col-1" />
    {/if}
    <span
      class="col-8"
      type="button"
      on:click={openFolder(task, $moveTask, false)}
    >
      {task.body}
    </span>
  {:else}
    {#if !topChildMode && !recording($timeStore.now.taskId, topChildShowing)}
      <div class="col-2 text-danger" type="button" on:click={record}>
        <RecordBtn />
        {`${topChildShowing ? ' ↓' : ''}`}
      </div>
    {:else}
      <div class="col-2" />
    {/if}
    {#if topChildMode}
      <span
        id={`topTask-${task.id}`}
        class="text-center col-12"
        on:click={openFolder(task, $moveTask)}
        role="button">{task.body}</span
      >
    {:else}
      <span
        id={`folder-${task.id}`}
        class={`text-center col-8`}
        role="textbox"
        contenteditable
        on:input={onNameChange}
      >
        {task.body}
      </span>
    {/if}

    {#if !topChildMode}
      <div
        class="text-success col-2"
        type="button"
        on:click={checkOff(task.id)}
      >
        <Check />
      </div>
    {/if}
  {/if}
  {#if showUpdate}
    <button class="btn btn-outline-dark" on:click={onRename}> update </button>
  {/if}
</div>
