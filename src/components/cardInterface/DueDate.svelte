<!-- DueDate.svelte Copyright 2021 Paul Beaudet MIT License -->
<script lang="ts">
  import { writable } from 'svelte/store';
  import type { Writable } from 'svelte/store';
  import { onAgenda, updateTask } from '../../indexDb/taskDb';
  import type { memTaskI } from '../../shared/interface';
  import StampEdit from '../../shared/StampEdit.svelte';
  import { loadAgenda } from '../../stores/agendaStore';
  import { dayInMillis, hourInMillis } from '../../stores/defaultData';
  import { cancelFund } from '../../stores/fundingStore';
  import {
    editDue,
    editRecur,
    moveTask,
    toggleEditDue,
  } from '../../stores/settingsStore';
  import { secondTick } from '../../stores/timeStore';
  import { getHumanReadableStamp } from '../time/timeConvert';
  import PeriodEdit from '../time/PeriodEdit.svelte';
  import { addEvent } from '../../indexDb/eventsDb';
  import CalendarX from 'svelte-bootstrap-icons/lib/CalendarX';
  import Check from 'svelte-bootstrap-icons/lib/Check';
  import XLg from 'svelte-bootstrap-icons/lib/XLg';
  import Gear from 'svelte-bootstrap-icons/lib/Gear';
  import FolderSymlink from 'svelte-bootstrap-icons/lib/FolderSymlink';
  import { openFolder } from '../../stores/taskStore';

  export let task: memTaskI;
  export let sub: boolean = false;

  let stampColor: string = 'black';
  let setExact = false;
  const toggleSetExact = () => {
    setExact = !setExact;
  };

  editDue.subscribe((edit) => {
    if (edit) {
      cancelFund();
      $editRecur = null;
    }
  });

  const getDefaultDue = (): number => {
    const date = new Date();
    date.setMinutes(0, 0, 0);
    // give back a random time between 1 and 36 hours from now
    return date.getTime() + Math.floor(Math.random() * 36 + 1) * hourInMillis;
  };

  let stamp: number = task.dueDate;

  const correctStamp = ({ dueDate }: memTaskI, exact: boolean): boolean => {
    stamp = dueDate < $secondTick && exact ? getDefaultDue() : dueDate;
    return true;
  };

  const editedStamp: Writable<number> = writable(stamp);
  const invalidMsg: Writable<string> = writable('');

  const setDueDate = async () => {
    const editedTask = {
      ...task,
      dueDate: $editedStamp.valueOf(),
    };
    await updateTask(editedTask);
    addEvent('setDue', { id: editedTask.id, due: editedTask.dueDate });
    task = editedTask;
    $editDue = null;
    loadAgenda();
  };

  editedStamp.subscribe(async (newStamp) => {
    if (newStamp <= $secondTick) {
      $invalidMsg = 'lapsed';
      return;
    }
    const alreadyUsed = await onAgenda(newStamp);
    if (alreadyUsed) {
      $invalidMsg = 'booked';
      return;
    }
    $invalidMsg = '';
  });

  const showDueDate = ({ dueDate, status }: memTaskI): string => {
    stampColor = '';
    if (!dueDate) {
      return sub ? 'Highest priority sub-folder' : 'folder budget';
    }
    const stamp = getHumanReadableStamp(dueDate);
    if (status === 'todo' && $secondTick > dueDate) {
      stampColor = 'text-danger';
      return `Late! ${stamp}`;
    }
    if (status === 'todo' && $secondTick + dayInMillis > dueDate) {
      stampColor = 'text-success';
      return `Due soon ${stamp}`;
    }
    return `Due ${stamp}`;
  };

  const removeDueDate = () => {
    $editedStamp = 0;
    setDueDate();
  };
</script>

<div class="row text-center">
  {#if $editDue && $editDue.id === task.id && correctStamp(task, setExact)}
    {#if setExact}
      <div class="due-line col-12">
        <StampEdit {stamp} bind:editedStamp={$editedStamp} />
      </div>
    {:else}
      <PeriodEdit {stamp} bind:editedStamp={$editedStamp} />
    {/if}
  {:else}
    <span class="col-2" type="button" on:click={openFolder(task, $moveTask)}>
      <FolderSymlink />
    </span>
    <span
      class={`col-8 ${stampColor}`}
      type="button"
      on:click={toggleEditDue(task)}
    >
      {showDueDate(task)}
    </span>
    <div class="col-2" type="button" on:click={toggleEditDue(task)}>
      <Gear />
    </div>
  {/if}
</div>
{#if $editDue && $editDue.id === task.id}
  <div class="row">
    <div class="btn-group btn-group-sm col-12" role="group">
      <button
        class="btn btn-outline-dark text-danger"
        type="button"
        on:click={toggleEditDue(task)}
      >
        <XLg /> back
      </button>
      {#if !$invalidMsg}
        <button
          class="btn btn-outline-dark"
          type="button"
          on:click={setDueDate}
        >
          <Check /> Set
        </button>
      {:else}
        <span class="text-danger btn btn-outline-dark">{$invalidMsg}</span>
      {/if}
      {#if task.dueDate}
        <button
          class="btn btn-outline-dark text-danger"
          type="button"
          on:click={removeDueDate}
        >
          <CalendarX />
        </button>
      {/if}
      <button
        class="btn btn-outline-dark"
        type="button"
        on:click={toggleSetExact}
      >
        {setExact ? 'Period' : 'Exact'}
      </button>
    </div>
  </div>
{/if}

<style>
  .due-line {
    font-size: 0.55em;
    align-items: center;
    text-align: center;
  }
</style>
