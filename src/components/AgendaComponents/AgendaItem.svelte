<!-- AgendaItem.svelt Copyright 2021 Paul Beaudet MIT Licence -->
<script lang="ts">
  import type { taskI } from '../../shared/interface';
  import DueDate from '../cardInterface/DueDate.svelte';
  import { nowTimeStamp, timeStore } from '../../stores/timeStore';
  import RecycleButton from '../ActionButtons/RecycleButton.svelte';
  import CheckOffButton from '../ActionButtons/CheckOffButton.svelte';
  import BodyAndAction from '../ActionButtons/BodyAndAction.svelte';
  import { showDone } from '../../indexDb/viewStoreDb';
  import RecordActionButton from '../ActionButtons/RecordActionButton.svelte';
  export let task: taskI;
  let done: boolean = task.status !== 'todo' ? true : false;
  $: done = task.status !== 'todo' ? true : false;
</script>

{#if task.status === 'todo' || $showDone}
  <div class="pb-1 border-bottom">
    <div class="row text-center">
      {#if done}
        <div class="col-2" />
      {:else if $timeStore.now.taskId === task.id}
        <span class="col-2 text-danger">{$nowTimeStamp}</span>
      {:else}
        <RecordActionButton id={task.id} body={task.body} size="2" />
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
