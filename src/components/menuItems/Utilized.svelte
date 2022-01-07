<!-- Utilized.svelte ~ Copyright 2021 Paul Beaudet MIT License -->
<script lang="ts">
  import { getLastBudget } from '../../indexDb/budgetDb';
  import { budgetStore } from '../../stores/budgetStore';
  import { utilizationOptions } from '../../stores/defaultData';
  import {
    utilizeRange,
    selectedUtilizationOption,
    showHistory,
    toggleSettingDialog,
  } from '../../stores/settingsStore';

  const beginingOfToday = (): Date => {
    const date = new Date();
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
  };

  const beginingOfThisMonth = (): Date => {
    const date = beginingOfToday();
    date.setDate(1);
    return date;
  };

  const beginingOfYesterday = (date: Date): Date => {
    const currentDay = date.getDate();
    date.setDate(currentDay - 1);
    return date;
  };

  const beginingOfLastMonth = (date: Date): Date => {
    const currentMonth = date.getMonth();
    date.setMonth(currentMonth - 1);
    return date;
  };

  const setDay = (day: number = 0, date: Date = new Date()): Date => {
    const currentDay = date.getDay();
    const distance = day - currentDay;
    date.setDate(date.getDate() + distance);
    return date;
  };

  selectedUtilizationOption.subscribe(async (option) => {
    let start = 0;
    let end = 0;
    if (option === 'This Month') {
      const date = beginingOfThisMonth();
      start = date.getTime();
    } else if (option === 'Last Month') {
      let date = beginingOfThisMonth();
      end = date.getTime();
      date = beginingOfLastMonth(date);
      start = date.getTime();
    } else if (option === 'Today') {
      const date = beginingOfToday();
      start = date.getTime();
    } else if (option === 'Yesterday') {
      const date = beginingOfToday();
      end = date.getTime();
      start = beginingOfYesterday(date).getTime();
    } else if (option === 'This Week') {
      const date = beginingOfToday();
      start = setDay(0, date).getTime();
    } else if (option === 'Last Week') {
      let date: Date = beginingOfToday();
      date = setDay(0, date);
      end = date.getTime();
      date.setDate(date.getDate() - 7);
      start = date.getTime();
    } else if (option === 'Last Sprint') {
      const lastBudget = await getLastBudget();
      // if no last budget start at the begining of time
      start = lastBudget ? lastBudget.start : 0;
      end = $budgetStore.start;
    } else if (option === 'This Sprint') {
      start = $budgetStore.start;
    }
    $utilizeRange = {
      start,
      end,
    };
  });

  const cancel = () => {
    $selectedUtilizationOption = 'This Sprint';
  };
</script>

{#if $showHistory}
  <div class="card card-body" id="history">
    <span>Historical utilization without movement</span>
    <select bind:value={$selectedUtilizationOption}>
      {#each utilizationOptions as option}
        <option value={option}>{option}</option>
      {/each}
    </select>
    <button
      on:click={cancel}
      class="btn btn-outline-danger"
      on:click={toggleSettingDialog('history')}
      aria-expanded="false"
      aria-controls="history"
    >
      Back
    </button>
  </div>
{/if}
