<!-- Card.svelte Copyright 2021 Paul Beaudet MIT License -->
<script lang="ts">
  import type { memTaskI } from './interface';
  import FolderTab from '../components/cardInterface/FolderTab.svelte';
  import FolderBudget from '../components/cardInterface/FolderBudget.svelte';
  import { editTask, moveTask } from '../stores/settingsStore';
  import MoveTaskOptions from '../components/cardInterface/MoveTaskOptions.svelte';
  import EditBar from '../components/cardInterface/EditBar.svelte';
  import RecurEditBar from '../components/cardInterface/RecurEditBar.svelte';
  import { showTopChild } from '../indexDb/viewStoreDb';
  import DueDate from '../components/cardInterface/DueDate.svelte';
  // Exposed component props
  export let task: memTaskI;

  let topChildShowing = false;

  showTopChild.subscribe((show) => {
    topChildShowing = !show ? false : task.topChild ? true : false;
  });
</script>

<div class="pb-1 border-bottom container-fluid" id={task.id}>
  <FolderTab {task} bind:topChildShowing />
  {#if !$moveTask}
    <EditBar {task} bind:topChildShowing />
    <RecurEditBar {task} />
    <DueDate {task} />
    <FolderBudget {task} />
    {#if topChildShowing && task.topChild && $editTask?.id !== task.id}
      <FolderTab
        task={task.topChild}
        topChildMode={true}
        bind:topChildShowing
      />
    {/if}
  {/if}
  <MoveTaskOptions {task} />
</div>
