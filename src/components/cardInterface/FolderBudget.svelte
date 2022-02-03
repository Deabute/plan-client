<!-- FolderBudget.svelte Copyright 2021 Paul Beaudet MIT License -->
<script lang="ts">
  import type { memTaskI } from '../../shared/interface';
  import {
    cancelFund,
    fundSetting,
    openFundSettings,
  } from '../../stores/fundingStore';
  import { budgetAvail } from '../../stores/taskStore';
  import MoveTime from './MoveTime.svelte';
  import BudgetSlider from './BudgetSlider.svelte';
  import UtilizedText from './UtilizedText.svelte';
  import { editRecur, editTask, editToggle } from '../../stores/settingsStore';
  import Gear from 'svelte-bootstrap-icons/lib/Gear';
  import Sliders from 'svelte-bootstrap-icons/lib/Sliders';
  import EditBar from './EditBar.svelte';
  import RecordActionButton from '../ActionButtons/RecordActionButton.svelte';
  import { nowTimeStamp, timeStore } from '../../stores/timeStore';
  import { showTopChild } from '../../indexDb/viewStoreDb';

  export let task: memTaskI;

  // !! this is a bug !!! Will show last task fraction
  let { fraction, autoAssigned } = task;

  const editInsteadOfFund = () => {
    cancelFund();
    editToggle(task)();
  };
</script>

<div class="text-center text-small row">
  {#if task.status === 'todo'}
    {#if $timeStore.now.taskId === task.id || task?.topChild?.id === $timeStore.now.taskId}
      <span class="col-1 text-danger">{$nowTimeStamp}</span>
    {:else}
      <RecordActionButton
        id={$showTopChild && task.topChild ? task.topChild.id : task.id}
        body={task.body}
      />
    {/if}
  {:else}
    <div class="col-1" />
  {/if}
  {#if $fundSetting.task?.id === task.id}
    <div class="col-10">
      <MoveTime bind:fraction>
        <UtilizedText {task} />
      </MoveTime>
    </div>
    <div class="col-1" type="button" on:click={editInsteadOfFund}>
      <Gear />
    </div>
    <BudgetSlider
      {task}
      bind:fraction
      bind:autoAssigned
      availableFunds={$budgetAvail}
    />
  {:else}
    {#if $editTask?.id === task.id && !$editRecur}
      <div class="col-10">
        <EditBar {task} />
      </div>
    {:else}
      <div
        class="col-10"
        type="button"
        on:click={openFundSettings(task, $budgetAvail)}
      >
        <UtilizedText {task} {fraction} />&nbsp;
        <Sliders />
      </div>
    {/if}
    <div class="col-1" type="button" on:click={editToggle(task)}>
      <Gear />
    </div>
  {/if}
</div>
