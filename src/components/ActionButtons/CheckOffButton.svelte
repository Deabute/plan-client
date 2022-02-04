<!-- CheckOffButton.svelte Copyright 2022 Paul Beaudet MIT License -->
<script lang="ts">
  import Square from 'svelte-bootstrap-icons/lib/Square';
  import CheckSquare from 'svelte-bootstrap-icons/lib/CheckSquare';
  import { checkOff } from '../../stores/taskStore';
  import { updateTaskSafe } from '../../indexDb/taskDb';
  import { reloadNextTask } from '../../stores/agendaStore';
  import { refreshAllViews } from '../../stores/taskStore';
  import type { statI } from '../../shared/interface';

  export let id: string;
  export let status: statI;
  export let size = '1';

  const getUndid = async () => {
    await updateTaskSafe({ id, status: 'todo' });
    reloadNextTask();
    refreshAllViews();
  };
</script>

{#if status === 'todo'}
  <div class={`col-${size}`} type="button" on:click={checkOff(id)}>
    <Square />
  </div>
{:else if status === 'done'}
  <div class={`col-${size}`} type="button" on:click={getUndid}>
    <CheckSquare />
  </div>
{:else}
  <div class={`col-${size}`} />
{/if}
