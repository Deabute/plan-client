<!-- AgendaItem.svelt Copyright 2021 Paul Beaudet MIT Licence -->
<script lang="ts">
  import type { taskI } from '../../shared/interface';
  import DueDate from '../cardInterface/DueDate.svelte';
  import RecordBtn from 'svelte-bootstrap-icons/lib/RecordBtn';
  import { nowTimeStamp, recordTime, timeStore } from '../../stores/timeStore';
  import RecycleButton from '../ActionButtons/RecycleButton.svelte';
  import CheckOffButton from '../ActionButtons/CheckOffButton.svelte';
  import BodyAndAction from '../ActionButtons/BodyAndAction.svelte';
  export let task: taskI;
  let done: boolean = task.status !== 'todo' ? true : false;
  $: done = task.status !== 'todo' ? true : false;

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
      <BodyAndAction id={task.parentId} body={task.body} size="8" {done} />
      {#if done}
        <RecycleButton id={task.id} colSize="2" />
      {:else}
        <CheckOffButton id={task.id} size="2" />
      {/if}
    </div>
    <DueDate {task} activtyColumn={false} />
  </div>
{/if}
