<!-- RecycleButton.svelte Copyright 2022 Paul Beaudet MIT License -->
<script lang="ts">
  import Recycle from 'svelte-bootstrap-icons/lib/Recycle';
  import { updateTaskSafe } from '../../indexDb/taskDb';
  import { reloadNextTask } from '../../stores/agendaStore';
  import { refreshAllViews } from '../../stores/taskStore';

  export let id: string;
  export let size = '1';

  const getUndid = async () => {
    await updateTaskSafe({ id, status: 'todo' });
    reloadNextTask();
    refreshAllViews();
  };
</script>

<div class={`col-${size}`} type="button" on:click={getUndid}>
  <Recycle />
</div>
