<!-- RecurEditBar.svelte Copyright 2021 Paul Beaudet MIT Licence -->
<script lang="ts">
  import { updateTask } from '../../indexDb/taskDb';
  import type {
    cadenceI,
    cadenceInterval,
    memTaskI,
  } from '../../shared/interface';
  import { writable } from 'svelte/store';
  import type { Writable } from 'svelte/store';
  import {
    setCadence,
    intervalTypes,
    getCadence,
  } from '../time/CadenceFunctions';
  import {
    editDue,
    editRecur,
    editTask,
    toggleEditRecur,
  } from '../../stores/settingsStore';
  import { cancelFund } from '../../stores/fundingStore';
  import { addEvent } from '../../indexDb/eventsDb';
  import Check from 'svelte-bootstrap-icons/lib/Check';
  import XLg from 'svelte-bootstrap-icons/lib/XLg';

  export let task: memTaskI;

  let originCadence: cadenceI = getCadence(task.cadence);
  const validCadence: Writable<boolean> = writable(false);
  const interval: Writable<cadenceInterval> = writable(originCadence.interval);
  let cadence: cadenceI = { ...originCadence };

  const onCadenceChange = async () => {
    const cadenceChange: string = setCadence({
      ...cadence,
    });
    task.cadence = cadenceChange;
    await updateTask(task);
    addEvent('setRecur', { id: task.id, cadenceChange });
    originCadence = { ...cadence };
    $validCadence = false;
    $editRecur = null;
    $editTask = null;
  };

  interval.subscribe((val) => {
    $validCadence = val === originCadence.interval ? false : true;
    cadence.interval = val;
  });

  editRecur.subscribe((edit) => {
    if (edit) {
      cancelFund();
      $editDue = null;
    }
  });
</script>

{#if $editRecur && $editRecur.id === task.id}
  <div class="btn-group btn-group-sm m-1" role="group">
    <button
      class="btn btn-outline-dark"
      type="button"
      on:click={toggleEditRecur(task)}
    >
      <XLg /> Cancel
    </button>
    <select
      class="btn btn-outline-dark"
      type="button"
      name="interval"
      id="interval"
      bind:value={$interval}
    >
      {#each intervalTypes as interval}
        {#if interval === 'many' || interval === 'none'}
          <option value={interval}>
            {interval}
          </option>
        {/if}
      {/each}
    </select>
    {#if $validCadence}
      <button
        class="btn btn-outline-dark"
        type="button"
        on:click={onCadenceChange}
      >
        <Check /> Change
      </button>
    {/if}
  </div>
{/if}
