<!-- TaskList.svelte Copyright 2021 Paul Beaudet MIT Licence -->
<script lang="ts">
  import Card from '../../shared/Card.svelte';
  import { taskStore } from '../../stores/taskStore';
  import { activitiesColumnName } from '../../stores/defaultData';
  import { editTask, moveTask } from '../../stores/settingsStore';
  import MoveTaskOptions from '../cardInterface/MoveTaskOptions.svelte';
  import { recordingTaskParent, timeStore } from '../../stores/timeStore';
  import { decedentOfWhich } from '../../indexDb/taskDb';
  import {
    showActivityColumn,
    showActivityMobile,
  } from '../../indexDb/viewStoreDb';
  import BreadCrumbs from '../Navigation/BreadCrumbs0.svelte';
  import AddFolder from '../Navigation/AddFolder.svelte';
  import BudgetAlerts from '../Folder/BudgetAlerts.svelte';
  import ViewContainer from './ViewContainer.svelte';
  import Folder from 'svelte-bootstrap-icons/lib/Folder';

  const cancelTaskMove = () => {
    $moveTask = null;
    $editTask = null;
  };

  timeStore.subscribe(({ now }) => {
    decedentOfWhich(now.taskId, $taskStore.lineage[0].id).then((value) => {
      $recordingTaskParent = value;
    });
  });
</script>

<ViewContainer
  desktopView={$showActivityColumn}
  mobileView={$showActivityMobile}
  id={activitiesColumnName}
>
  <svelte:fragment slot="headerText">
    <span>
      <Folder />
      <span class="header">
        &nbsp;
        {#if $taskStore.lineage[0].parentId !== '0'}
          {`Plan: ${$taskStore.lineage[0].body}`}
        {:else}
          {activitiesColumnName}
        {/if}
      </span>
    </span>
  </svelte:fragment>
  <svelte:fragment slot="staticHeader">
    <div class="d-none d-sm-block">
      <AddFolder />
    </div>
    <BudgetAlerts />
    {#if $moveTask}
      <button class="btn-sm btn-outline-dark m-1" on:click={cancelTaskMove}>
        {`Cancel Moving: ${$moveTask.body}`}
      </button>
    {/if}
    <MoveTaskOptions task={$taskStore.lineage[0]} after={false} />
    <BreadCrumbs />
  </svelte:fragment>
  <svelte:fragment slot="items">
    {#each $taskStore.tasks as task (task)}
      <Card {task} />
    {/each}
  </svelte:fragment>
</ViewContainer>

<style>
  .header {
    vertical-align: text-top;
  }
</style>
