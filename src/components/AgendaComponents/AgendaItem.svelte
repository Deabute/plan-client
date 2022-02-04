<!-- AgendaItem.svelt Copyright 2021 Paul Beaudet MIT Licence -->
<script lang="ts">
  import type { taskI } from '../../shared/interface';
  import DueDate from '../cardInterface/DueDate.svelte';
  import CheckOffButton from '../ActionButtons/CheckOffButton.svelte';
  import BodyAndAction from '../ActionButtons/BodyAndAction.svelte';
  import { showDone } from '../../indexDb/viewStoreDb';
  export let task: taskI;
  let done: boolean = task.status !== 'todo' ? true : false;
  $: done = task.status !== 'todo' ? true : false;
</script>

{#if task.status === 'todo' || $showDone}
  <div class="pb-1 border-bottom container-fluid">
    <div class="row text-center">
      <CheckOffButton id={task.id} status={task.status} />
      <BodyAndAction id={task.id} body={task.body} {done} />
    </div>
    <DueDate {task} activtyColumn={false} />
  </div>
{/if}
