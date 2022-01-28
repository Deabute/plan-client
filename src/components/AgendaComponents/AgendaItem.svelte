<!-- AgendaItem.svelt Copyright 2021 Paul Beaudet MIT Licence -->
<script lang="ts">
  import type { taskI } from '../../shared/interface';
  import DueDate from '../cardInterface/DueDate.svelte';
  import RecordBtn from 'svelte-bootstrap-icons/lib/RecordBtn';
  import { nowTimeStamp, recordTime, timeStore } from '../../stores/timeStore';
  import { moveTask } from '../../stores/settingsStore';
  import { openFolder } from '../../stores/taskStore';
  import RecycleButton from '../ActionButtons/RecycleButton.svelte';
  import CheckOffButton from '../ActionButtons/CheckOffButton.svelte';
  export let task: taskI;
  let done: boolean = task.status !== 'todo' ? true : false;

  const record = () => {
    recordTime(task);
  };
</script>

{#if task.status !== 'hide'}
  <div class="pb-1 border-bottom">
    <div class="row text-center">
      {#if done}
        <div class="col-2" />
      {:else if $timeStore.now.taskId === task.id}
        <span class="col-2 text-danger">{$nowTimeStamp}</span>
      {:else}
        <div class="col-2 text-danger" type="button" on:click={record}>
          <RecordBtn />
        </div>
      {/if}
      <span class="col-8" type="button" on:click={openFolder(task, $moveTask)}>
        {#if done}
          <s>{task.body}</s>
        {:else}
          {task.body}
        {/if}
      </span>
      {#if done}
        <RecycleButton id={task.id} colSize="2" bind:done view="when" />
      {:else}
        <CheckOffButton id={task.id} size="2" />
      {/if}
    </div>
    <DueDate {task} activtyColumn={false} />
  </div>
{/if}
