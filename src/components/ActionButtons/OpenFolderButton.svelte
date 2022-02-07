<!-- OpenFolderButton.svelte Copyright 2022 Paul Beaudet MIT License -->
<script lang="ts">
  import FolderSymlink from 'svelte-bootstrap-icons/lib/FolderSymlink';
  import { getTaskById } from '../../indexDb/taskDb';
  import { fundingTask } from '../../stores/fundingStore';
  import { editTask, moveTask } from '../../stores/settingsStore';
  import { loadChildren } from '../../stores/taskStore';

  export let size: string = '1';
  export let siblings: boolean = false;
  export let id: string = '1';

  const open = async () => {
    if (siblings) {
      const task = await getTaskById(id);
      if (!task) return;
      id = task.parentId;
    }
    if ($moveTask?.id === id) return;
    $fundingTask = '';
    loadChildren(id);
    $editTask = null;
  };
</script>

<div class={`col-${size}`} type="button" on:click={open}>
  <FolderSymlink />
</div>
