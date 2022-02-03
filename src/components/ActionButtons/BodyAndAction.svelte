<!-- BodyAndAction.svelte Copyright 2022 Paul Beaudet MIT License -->
<script lang="ts">
  import { getTaskById } from '../../indexDb/taskDb';
  import { cancelFund } from '../../stores/fundingStore';
  import { editTask, moveTask } from '../../stores/settingsStore';
  import { loadChildren } from '../../stores/taskStore';
  import PencilSquare from 'svelte-bootstrap-icons/lib/PencilSquare';

  export let id: string;
  export let body: string;
  export let size: string = '10';
  export let sib: boolean = false;
  export let done: boolean = false;
  export let grey: boolean = $moveTask?.id === id ? true : false;

  const open = async () => {
    if (sib) {
      const task = await getTaskById(id);
      if (!task) return;
      id = task.parentId;
    }
    if ($moveTask?.id === id) return;
    cancelFund();
    loadChildren(id);
    $editTask = null;
  };
</script>

<div
  class={`col-${size} text-center${grey ? ' text-secondary' : ''}`}
  type="button"
  on:click={open}
>
  {#if done}
    <s>{body}</s>
  {:else}
    {body}
  {/if}
</div>
{#if !grey && !$moveTask}
  <div class="col-1"><PencilSquare /></div>
{/if}
