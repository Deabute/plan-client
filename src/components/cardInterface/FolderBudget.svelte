<!-- FolderBudget.svelte Copyright 2021 Paul Beaudet MIT License -->
<script lang="ts">
  import type { memTaskI } from '../../shared/interface';
  import {
    cancelFund,
    fundSetting,
    openFundSettings,
  } from '../../stores/fundingStore';
  import {
    taskStore,
    budgetAvail,
    openFolder,
    refreshTask,
  } from '../../stores/taskStore';
  import MoveTime from './MoveTime.svelte';
  import BudgetSlider from './BudgetSlider.svelte';
  import UtilizateText from './UtilizateText.svelte';
  import {
    editTask,
    editToggle,
    moveTask,
    toggleEditDue,
  } from '../../stores/settingsStore';
  import HourglassSplit from 'svelte-bootstrap-icons/lib/HourglassSplit';
  import Gear from 'svelte-bootstrap-icons/lib/Gear';
  import FolderSymlink from 'svelte-bootstrap-icons/lib/FolderSymlink';
  import { addEvent } from '../../indexDb/eventsDb';
  import { updateTaskSafe } from '../../indexDb/taskDb';

  export let task: memTaskI;

  let { fraction, autoAssigned } = task;

  const openExactFunding = () => {
    if ($fundSetting.task?.id === task.id) return;
    openFundSettings(task, $taskStore.tasks)();
  };
</script>

{#if $editTask?.id === task.id}
  {#if $fundSetting.task?.id === task.id}
    <MoveTime>
      <UtilizateText {task} />
    </MoveTime>
  {:else}
    <div class="text-center text-small row" on:click={toggleEditDue(task)}>
      <div
        class="col-1"
        type="button"
        on:click={openFundSettings(task, $taskStore.tasks)}
      >
        <HourglassSplit />
      </div>
      <div
        class="col-10"
        type="button"
        on:click={openFundSettings(task, $taskStore.tasks)}
        id={`budget ${task.body}`}
      >
        <UtilizateText {task} {fraction} />
      </div>
      <div class="col-1" />
    </div>
    <BudgetSlider
      {task}
      bind:fraction
      bind:autoAssigned
      availableFunds={$budgetAvail}
    />
  {/if}
{:else}
  <div class="text-center text-small row">
    <div
      class="col-1"
      type="button"
      on:click={openFolder(task, $moveTask, false)}
    >
      <FolderSymlink />
    </div>
    <!-- <div class="col-1" type="button" on:click={openExactFunding}>
      {#if $fundSetting.task?.id === task.id}
        <XLg />
      {:else}
        <HourglassSplit />
      {/if}
    </div> -->
    <div class="col-10" type="button" on:click={openExactFunding}>
      {#if $fundSetting.task?.id === task.id}
        <MoveTime>
          <UtilizateText {task} />
        </MoveTime>
      {:else}
        <UtilizateText {task} {fraction} />
      {/if}
    </div>
    <!-- <div class="col-1 text-warning" type="button" on:click={onLockChange}>
      {#if autoAssigned}
        <Unlock />
      {:else}
        <Lock />
      {/if}
    </div> -->
    <div class="col-1" type="button" on:click={editToggle(task)}>
      <Gear />
    </div>
  </div>
{/if}
