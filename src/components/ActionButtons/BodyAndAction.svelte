<!-- BodyAndAction.svelte Copyright 2022 Paul Beaudet MIT License -->
<script lang="ts">
  import { getTaskById } from '../../indexDb/taskDb';
  import { cancelFund } from '../../stores/fundingStore';
  import { editTask, moveTask } from '../../stores/settingsStore';
  import { loadChildren } from '../../stores/taskStore';

  export let id: string;
  export let body: string;
  export let size: string = '1';
  export let sib: boolean = false;
  export let done: boolean = false;

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

<div class={`col-${size} text-center`} type="button" on:click={open}>
  {#if done}
    <s>{body}</s>
  {:else}
    {body}
  {/if}
</div>
