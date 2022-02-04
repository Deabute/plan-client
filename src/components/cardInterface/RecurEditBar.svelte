<!-- RecurEditBar.svelte Copyright 2021 Paul Beaudet MIT Licence -->
<script lang="ts">
  import { updateTaskSafe } from '../../indexDb/taskDb';
  import type { cadenceI, memTaskI } from '../../shared/interface';
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
  import { getMillisFromDayStart, getTimeOfDay } from '../time/timeConvert';
  import { writable } from 'svelte/store';
  import type { Writable } from 'svelte/store';
  import { refreshAllViews } from '../../stores/taskStore';

  export let task: memTaskI;

  let originCadence: cadenceI = getCadence(task.cadence);
  let validCadence: boolean = false;
  let cadence: Writable<cadenceI> = writable({ ...originCadence });
  let { hour, minutes, meridian } = getTimeOfDay(originCadence.timeOfDay);
  // convert back to millis in day when hour / minute / meridian is changed
  $: $cadence.timeOfDay = getMillisFromDayStart(hour, minutes, meridian);

  const onCadenceChange = async () => {
    const cadenceChange: string = setCadence({
      ...$cadence,
    });
    task.cadence = cadenceChange;
    await updateTaskSafe({
      id: task.id,
      cadence: cadenceChange,
    });
    await addEvent('setRecur', { id: task.id, cadenceChange });
    originCadence = { ...$cadence };
    validCadence = false;
    $editRecur = null;
    $editTask = null;
    refreshAllViews();
  };

  editRecur.subscribe((edit) => {
    if (edit) {
      cancelFund();
      $editDue = null;
    }
  });

  cadence.subscribe((change) => {
    validCadence =
      change.timeOfDay === originCadence.timeOfDay &&
      change.skip === originCadence.skip &&
      change.interval === originCadence.interval &&
      change.onTime === originCadence.onTime
        ? false
        : true;

    if (hour > 12 || hour < 1) validCadence = false;
    if (minutes > 59 || minutes < 0) validCadence = false;

    if (change.onTime === true) {
      if (change.interval === 'many' || change.interval === 'one-off') {
        $cadence.onTime = false;
      }
    }
  });
</script>

{#if $editRecur && $editRecur.id === task.id}
  <div class="row">
    <div class="input-group input-group-sm col-12" role="group">
      {#if $cadence.interval !== 'many' && $cadence.interval !== 'one-off'}
        <span class="input-group-text">{`Every `}</span>
        <input
          type="number"
          class="form-control"
          maxlength="2"
          min="1"
          id="skip-input"
          name="skip-input"
          max="99"
          bind:value={$cadence.skip}
        />
      {/if}
      <select
        class="form-select"
        name="interval"
        id="interval"
        bind:value={$cadence.interval}
      >
        {#each intervalTypes as type}
          <option value={type}>
            {`${type}${
              $cadence.skip > 1 && type !== 'many' && type !== 'one-off'
                ? 's'
                : ''
            }`}
          </option>
        {/each}
      </select>
      {#if $cadence.interval !== 'many' && $cadence.interval !== 'one-off'}
        <div class="input-group-text">
          <input
            id="timeSetter"
            type="checkbox"
            class="form-check-input mt-0"
            bind:checked={$cadence.onTime}
          />
          <label for="timeSetter">&nbsp; at set time </label>
        </div>
      {/if}
    </div>
  </div>
  {#if $cadence.onTime}
    <div class="row">
      <div class="btn-group btn-group-sm col-12">
        <input
          id="recur-hour"
          class="form-control"
          type="number"
          maxlength="2"
          max="12"
          min="1"
          bind:value={hour}
        />
        <input
          id="recur-mins"
          class="form-control"
          type="number"
          maxlength="2"
          max="59"
          min="0"
          bind:value={minutes}
        />
        <select
          class="form-select"
          name="meridian"
          id="meridian"
          bind:value={meridian}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  {/if}
  <div class="row">
    <div class="btn-group btn-group-sm col-12" role="group">
      <button
        class="btn btn-outline-dark"
        type="button"
        on:click={toggleEditRecur(task)}
      >
        <XLg /> Cancel
      </button>
      {#if validCadence}
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
