<!-- CheckOffButton.svelte Copyright 2022 Paul Beaudet MIT License -->
<script lang="ts">
  import Circle from 'svelte-bootstrap-icons/lib/Circle';
  import CheckCircle from 'svelte-bootstrap-icons/lib/CheckCircle';
  import BootstrapReboot from 'svelte-bootstrap-icons/lib/BootstrapReboot';
  import { checkOff } from '../../stores/taskStore';
  import { updateTaskSafe } from '../../indexDb/taskDb';
  import { reloadNextTask } from '../../stores/agendaStore';
  import { refreshAllViews } from '../../stores/taskStore';
  import type { statI } from '../../shared/interface';

  export let id: string;
  export let status: statI;
  export let cadence: string;
  export let size = '1';

  const getUndid = async () => {
    await updateTaskSafe({ id, status: 'todo' });
    reloadNextTask();
    refreshAllViews();
  };
</script>

{#if status === 'todo'}
  <div class={`col-${size}`} type="button" on:click={checkOff(id)}>
    {#if cadence === 'zero'}
      <Circle />
    {:else}
      <BootstrapReboot />
    {/if}
  </div>
{:else if status === 'done'}
  <div class={`col-${size}`} type="button" on:click={getUndid}>
    <CheckCircle />
  </div>
{:else}
  <div class={`col-${size}`} />
{/if}
