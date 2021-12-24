<!-- FolderBudget.svelte Copyright 2021 Paul Beaudet MIT License -->
<script lang="ts">
  import type { memTaskI } from '../../shared/interface';
  import {
    cancelFund,
    fundSetting,
    openFundSettings,
  } from '../../stores/fundingStore';
  import { budgetAvail, openFolder } from '../../stores/taskStore';
  import MoveTime from './MoveTime.svelte';
  import BudgetSlider from './BudgetSlider.svelte';
  import UtilizateText from './UtilizateText.svelte';
  import {
    editRecur,
    editTask,
    editToggle,
    moveTask,
  } from '../../stores/settingsStore';
  import Gear from 'svelte-bootstrap-icons/lib/Gear';
  import FolderSymlink from 'svelte-bootstrap-icons/lib/FolderSymlink';
  import Sliders from 'svelte-bootstrap-icons/lib/Sliders';
  import EditBar from './EditBar.svelte';

  export let task: memTaskI;
  export let topChildShowing: boolean;

  let { fraction, autoAssigned } = task;

  const editInsteadOfFund = () => {
    cancelFund();
    editToggle(task)();
  };
</script>

<div class="text-center text-small row">
  <div
    class="col-1"
    type="button"
    on:click={openFolder(task, $moveTask, false)}
  >
    <FolderSymlink />
  </div>
  {#if $fundSetting.task?.id === task.id}
    <div class="col-10">
      <MoveTime bind:fraction>
        <UtilizateText {task} />
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
        <EditBar {task} bind:topChildShowing />
      </div>
    {:else}
      <div
        class="col-10"
        type="button"
        on:click={openFundSettings(task, $budgetAvail)}
      >
        <UtilizateText {task} {fraction} />&nbsp;
        <Sliders />
      </div>
    {/if}
    <div class="col-1" type="button" on:click={editToggle(task)}>
      <Gear />
    </div>
  {/if}
</div>
