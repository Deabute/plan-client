<!-- EditBar.svelte Copyright 2021 Paul Beaudet MIT License -->
<script lang="ts">
  import type { memTaskI } from '../../shared/interface';
  import {
    editTask,
    moveTask,
    toggleEditDue,
    toggleEditRecur,
  } from '../../stores/settingsStore';
  import { hideTask, openFolder } from '../../stores/taskStore';
  import Trash from 'svelte-bootstrap-icons/lib/Trash';
  import CalendarEvent from 'svelte-bootstrap-icons/lib/CalendarEvent';
  import ArrowRepeat from 'svelte-bootstrap-icons/lib/ArrowRepeat';
  import ArrowDownUp from 'svelte-bootstrap-icons/lib/ArrowDownUp';
  import FolderSymlink from 'svelte-bootstrap-icons/lib/FolderSymlink';

  export let task: memTaskI;
  export let topChildShowing: boolean;

  let showDeleteConfirm = false;
  const DeleteConfirmationToggle = () => {
    showDeleteConfirm = !showDeleteConfirm;
  };

  const move = () => {
    $moveTask = task;
    topChildShowing = false;
  };
</script>

{#if $editTask?.id === task.id}
  <div class="row">
    <div class="btn-group btn-group-sm col-12" role="group">
      <div
        class="btn btn-outline-dark"
        type="button"
        on:click={openFolder(task, $moveTask, false)}
      >
        <FolderSymlink /> Open
      </div>
      {#if !task.dueDate}
        <button
          class="btn btn-outline-dark"
          type="button"
          on:click={toggleEditDue(task)}
        >
          <CalendarEvent /> When
        </button>
      {/if}
      <button
        class="btn btn-outline-dark"
        type="button"
        on:click={toggleEditRecur(task)}
      >
        <ArrowRepeat /> Recur
      </button>
      <button
        class="btn btn-outline-dark text-danger"
        type="button"
        on:click={DeleteConfirmationToggle}
      >
        <Trash /> Hide
      </button>
      <button class="btn btn-outline-dark col-2" type="button" on:click={move}>
        <ArrowDownUp /> Move
      </button>
    </div>
  </div>
  {#if showDeleteConfirm}
    <div class="row">
      <div class="btn-group btn-group-sm mb-1 mx-1 col-12" role="group">
        <button
          class="btn btn-outline-dark text-danger"
          type="button"
          on:click={hideTask(task)}
        >
          Remove
        </button>
        <button
          class="btn btn-outline-dark text-success"
          type="button"
          on:click={DeleteConfirmationToggle}
        >
          Keep
        </button>
      </div>
    </div>
  {/if}
{/if}
