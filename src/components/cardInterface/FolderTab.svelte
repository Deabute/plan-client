<!-- FolderTab.svelte Copyright 2021 Paul Beaudet MIT License -->
<script lang="ts">
  import type { memTaskI } from '../../shared/interface';
  import { moveTask } from '../../stores/settingsStore';
  import { modifyBody } from '../../stores/taskStore';
  import RecycleButton from '../ActionButtons/RecycleButton.svelte';
  import CheckOffButton from '../ActionButtons/CheckOffButton.svelte';
  import OpenFolderButton from '../ActionButtons/OpenFolderButton.svelte';
  import BodyAndAction from '../ActionButtons/BodyAndAction.svelte';

  export let task: memTaskI | null = null;
  export let topChildMode: boolean = false;

  let done = task.status === 'todo' ? false : true;
  $: done = task.status === 'todo' ? false : true;
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
      <OpenFolderButton id={task.id} />
    {:else}
      <div class="col-1" />
    {/if}
    <BodyAndAction id={task.id} body={task.body} size="10" {done} />
  {:else if topChildMode}
    <BodyAndAction id={task.parentId} body={task.body} size="12" {grey} />
  {:else}
    {#if done}
      <RecycleButton id={task.id} />
    {:else}
      <CheckOffButton id={task.id} />
    {/if}
    <span
      id={`folder-${task.id}`}
      class="text-center col-10"
      role="textbox"
      contenteditable
      on:input={onNameChange}
    >
      {#if done}
        <s>{task.body}</s>
      {:else}
        {task.body}
      {/if}
    </span>
  {/if}
  {#if showUpdate}
    <button class="btn btn-outline-dark" on:click={onRename}> update </button>
  {/if}
</div>
