<!-- RecycleButton.svelte Copyright 2022 Paul Beaudet MIT License -->
<script lang="ts">
  import Recycle from 'svelte-bootstrap-icons/lib/Recycle';
  import { updateTaskSafe } from '../../indexDb/taskDb';
  import { loadAgenda, reloadNextTask } from '../../stores/agendaStore';
  import { refreshTime } from '../../stores/timeStore';

  export let id: string;
  export let colSize = '1';
  export let view = 'intent';
  export let done: boolean = true;

  const getUndid = async () => {
    await updateTaskSafe({ id, status: 'todo' });
    done = false;
    reloadNextTask();
    if (view === 'intent') {
      loadAgenda();
      refreshTime();
    } else if (view === 'track') {
      loadAgenda();
    } else if (view === 'when') {
      refreshTime();
    }
  };
</script>

<div class={`col-${colSize}`} type="button" on:click={getUndid}>
  <Recycle />
</div>
