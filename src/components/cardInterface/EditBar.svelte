<!-- EditBar.svelte Copyright 2021 Paul Beaudet MIT License -->
<script lang="ts">
  import type { memTaskI } from '../../shared/interface';
  import {
    moveTask,
    toggleEditDue,
    toggleEditRecur,
  } from '../../stores/settingsStore';
  import { hideTask } from '../../stores/taskStore';
  import Trash from 'svelte-bootstrap-icons/lib/Trash';
  import CalendarEvent from 'svelte-bootstrap-icons/lib/CalendarEvent';
  import ArrowRepeat from 'svelte-bootstrap-icons/lib/ArrowRepeat';
  import ArrowDownUp from 'svelte-bootstrap-icons/lib/ArrowDownUp';
  import { agendaColumnName } from '../../stores/defaultData';

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

{#if showDeleteConfirm}
  <div class="btn-group btn-group-sm col-12" role="group">
    <button
      class="btn btn-outline-dark text-danger"
      type="button"
      on:click={hideTask(task)}
    >
      Remove
    </button>
    <button
      class="btn btn-outline-dark"
      type="button"
      on:click={DeleteConfirmationToggle}
    >
      Cancel
    </button>
  </div>
{:else}
  <div class="btn-group btn-group-sm col-12" role="group">
    {#if !task.dueDate}
      <button
        class="btn btn-outline-dark"
        type="button"
        on:click={toggleEditDue(task)}
      >
        <CalendarEvent />&nbsp;{agendaColumnName}
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
      <Trash />
    </button>
    <button class="btn btn-outline-dark col-2" type="button" on:click={move}>
      <ArrowDownUp />
    </button>
  </div>
{/if}
