<!-- AgendaItem.svelt Copyright 2021 Paul Beaudet MIT Licence -->
<script lang="ts">
  import type { taskI } from '../../shared/interface';
  import DueDate from '../cardInterface/DueDate.svelte';
  import Check from 'svelte-bootstrap-icons/lib/Check';
  import RecordBtn from 'svelte-bootstrap-icons/lib/RecordBtn';
  import {
    nowTimeStamp,
    recordTime,
    refreshTime,
    timeStore,
  } from '../../stores/timeStore';
  import { moveTask } from '../../stores/settingsStore';
  import { checkOff, undoAndPlace, openFolder } from '../../stores/taskStore';
  import Recycle from 'svelte-bootstrap-icons/lib/Recycle';

  export let task: taskI;

  const record = () => {
    recordTime(task);
  };

  const getUndid = async () => {
    await undoAndPlace(task.id);
    task.status = 'todo';
    refreshTime();
  };
</script>

<div class="pb-1 border-bottom">
  <div class="row text-center">
    {#if task.status === 'done'}
      <div class="col-2" />
    {:else if $timeStore.now.taskId === task.id}
      <span class="col-2 text-danger">{$nowTimeStamp}</span>
    {:else}
      <div class="col-2 text-danger" type="button" on:click={record}>
        <RecordBtn />
      </div>
    {/if}
    <span
      class={`col-8 ${task.status}`}
      type="button"
      on:click={openFolder(task, $moveTask)}
    >
      {task.body}
    </span>
    {#if task.status === 'done'}
      <div class="col-2" type="button" on:click={getUndid}><Recycle /></div>
    {:else}
      <div
        class="col-2 text-success"
        type="button"
        on:click={checkOff(task.id)}
      >
        <Check />
      </div>
    {/if}
  </div>
  <DueDate {task} activtyColumn={false} />
</div>

<style>
  .done {
    text-decoration: line-through;
  }
</style>
