<!-- FolderTab.svelte Copyright 2021 Paul Beaudet MIT License -->
<script lang="ts">
  import type { memTaskI } from '../../shared/interface';
  import { moveTask } from '../../stores/settingsStore';
  import { modifyBody } from '../../stores/taskStore';
  import RecordBtn from 'svelte-bootstrap-icons/lib/RecordBtn';
  import { recordTime, timeStore } from '../../stores/timeStore';
  import RecycleButton from '../ActionButtons/RecycleButton.svelte';
  import CheckOffButton from '../ActionButtons/CheckOffButton.svelte';
  import OpenFolderButton from '../ActionButtons/OpenFolderButton.svelte';
  import BodyAndAction from '../ActionButtons/BodyAndAction.svelte';

  export let task: memTaskI | null = null;
  export let topChildMode: boolean = false;
  export let topChildShowing: boolean;

  const { id, body, parentId, status } = task;
  const done = status === 'todo' ? false : true;
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
      if (id === runningTask) return true;
    }
    return false;
  };

  const record = () => {
    const { topChild, ...baseTask } = task;
    // Note: This is if topChild is showing not if it exist
    // The later is handled internally to record time
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
    {#if !topChildMode && $moveTask?.id !== id}
      <OpenFolderButton {id} />
    {:else}
      <div class="col-1" />
    {/if}
    <BodyAndAction {id} {body} size="10" {done} />
  {:else if topChildMode}
    <BodyAndAction id={parentId} {body} size="12" />
  {:else}
    {#if status === 'todo' && !recording($timeStore.now.taskId, topChildShowing)}
      <div class="col-1 text-danger" type="button" on:click={record}>
        <RecordBtn />
      </div>
    {:else if done}
      <RecycleButton {id} />
    {:else}
      <div class="col-1" />
    {/if}
    <span
      id={`folder-${id}`}
      class="text-center col-10"
      role="textbox"
      contenteditable
      on:input={onNameChange}
    >
      {#if done}
        <s>{body}</s>
      {:else}
        {body}
      {/if}
    </span>
    <CheckOffButton {id} />
  {/if}
  {#if showUpdate}
    <button class="btn btn-outline-dark" on:click={onRename}> update </button>
  {/if}
</div>
