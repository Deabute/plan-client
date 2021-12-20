<!-- RecurEditBar.svelte Copyright 2021 Paul Beaudet MIT Licence -->
<script lang="ts">
  import { updateTaskSafe } from '../../indexDb/taskDb';
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
  let skip: Writable<number> = writable(originCadence.skip.valueOf());

  const onCadenceChange = async () => {
    const cadenceChange: string = setCadence({
      ...cadence,
    });
    task.cadence = cadenceChange;
    await updateTaskSafe({
      id: task.id,
      cadence: cadenceChange,
    });
    addEvent('setRecur', { id: task.id, cadenceChange });
    originCadence = { ...cadence };
    $validCadence = false;
    $editRecur = null;
    $editTask = null;
  };

  interval.subscribe((val) => {
    $validCadence =
      val !== originCadence.interval
        ? true
        : $skip === originCadence.skip
        ? false
        : true;
    cadence.interval = val;
  });

  editRecur.subscribe((edit) => {
    if (edit) {
      cancelFund();
      $editDue = null;
    }
  });

  skip.subscribe((val) => {
    $validCadence =
      val !== originCadence.skip
        ? true
        : $interval === originCadence.interval
        ? false
        : true;
    cadence.skip = val;
  });
</script>

{#if $editRecur && $editRecur.id === task.id}
  <div class="row">
    <div class="btn-group btn-group-sm col-12 mb-1" role="group">
      <button
        class="btn btn-outline-dark"
        type="button"
        on:click={toggleEditRecur(task)}
      >
        <XLg /> Cancel
      </button>
      {#if $interval !== 'many' && $interval !== 'none'}
        <span class="input-group-text">{`Every `}</span>
        <input
          type="number"
          class="form-control"
          maxlength="2"
          min="1"
          id="skip-input"
          name="skip-input"
          max="99"
          bind:value={$skip}
        />
      {/if}
      <select
        class="form-select"
        name="interval"
        id="interval"
        bind:value={$interval}
      >
        {#each intervalTypes as type}
          <option value={type}>
            {`${type}${$skip > 1 ? 's' : ''}`}
          </option>
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
  </div>
{/if}
