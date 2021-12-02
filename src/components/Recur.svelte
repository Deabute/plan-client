<!-- Recur.svelte Copyright 2021 Paul Beaudet MIT Licence -->
<script lang="ts">
  import { updateTask } from '../indexDb/taskDb';
  import type { AmPm, cadenceI, taskListData } from '../shared/interface';
  import {
    getCadence,
    setCadence,
    intervalTypes,
    intervalMillis,
    getInterval,
  } from './time/CadenceFunctions';
  import { taskStore } from '../stores/taskStore';
  import { get24HourFormat } from '../stores/defaultData';

  let originCadence: cadenceI = {
    weekType: 'Whole',
    interval: 'none',
    skip: 1,
    timeOfDay: 12,
  };
  let cadence: cadenceI = { ...originCadence };
  let recurHour: number = 12;
  let recurMeridiem: AmPm = 'PM';
  let parentInterval: number = 0;

  taskStore.subscribe((store) => {
    originCadence = getCadence(store.lineage[0].cadence);
    cadence = { ...originCadence };
    if (store.lineage.length > 1) {
      const parentCadence = getCadence(store.lineage[1].cadence);
      parentInterval = getInterval(parentCadence);
    }
    let hour12Format: number = originCadence.timeOfDay
      ? originCadence.timeOfDay
      : 12;
    recurHour = hour12Format > 12 ? hour12Format - 12 : hour12Format;
    recurMeridiem = originCadence.timeOfDay > 11 ? 'PM' : 'AM';
  });

  const onCadenceChange = () => {
    const cadenceChange: string = setCadence({
      ...cadence,
      timeOfDay: get24HourFormat(recurHour, recurMeridiem),
    });
    $taskStore.lineage[0].cadence = cadenceChange;
    updateTask($taskStore.lineage[0]);
  };

  const isValidCadence = (
    origin: cadenceI,
    current: cadenceI,
    hour: number,
    meridiem: AmPm,
  ): boolean => {
    // only show on cadence change
    if (origin.interval === 'none' && current.interval === 'none') {
      return false;
    }
    // only show if inteval makes sence in conjuction with parent
    let cadenceInterval: number = getInterval(current);
    cadenceInterval = cadenceInterval ? cadenceInterval : parentInterval;
    if (parentInterval && cadenceInterval < parentInterval) {
      return false;
    }
    // Only show when different from original settings
    const hour24format: number = get24HourFormat(hour, meridiem);
    const originKeys = Object.keys(origin);
    for (let i = 0; i < originKeys.length; i++) {
      let currentProp =
        originKeys[i] === 'timeOfDay' ? hour24format : current[originKeys[i]];
      if (origin[originKeys[i]] !== currentProp) {
        return true;
      }
    }
    return false;
  };

  const canRecur = (list: taskListData): boolean => {
    if (list.lineage.length > 1) {
      // given parent type is a recuring task, cadence is decided by parent
      if (list.lineage[1].cadence !== 'zero' && !list.lineage[1].fraction) {
        return false;
      }
      return list.lineage[1].id === '1' || list.lineage[1].cadence !== 'zero';
    }
    return false;
  };
</script>

{#if canRecur($taskStore)}
  <div class="recurSettings">
    <span>Recur</span>
    <label for="skip">Every</label>
    <input
      type="number"
      name="skip"
      id="skip"
      maxlength="2"
      size="2"
      max="99"
      min="1"
      bind:value={cadence.skip}
    />
    <!-- {#if cadence.interval === 'day'}
      <label for="weekType" />
      <select name="weekType" id="weekType" bind:value={cadence.weekType}>
        {#each weekTypes as weektype}
          <option value={weektype}>{weektype}</option>
        {/each}
      </select>
    {/if} -->
    <label for="interval" />
    <select name="interval" id="interval" bind:value={cadence.interval}>
      {#each intervalTypes as interval, i}
        {#if intervalMillis[i] * cadence.skip >= parentInterval || interval === 'none'}
          <option value={interval}>
            {interval + (cadence.skip > 1 && interval !== 'none' ? 's' : '')}
          </option>
        {/if}
      {/each}
    </select>
    <!-- {#if cadence.interval === 'day'}
      <span>at</span>
      <input
        type="number"
        maxlength="2"
        size="2"
        min="1"
        max="12"
        id="recur-hour"
        name="recur-hour"
        bind:value={recurHour}
      />
      <select name="recur-AmPm" id="recur-AmPm" bind:value={recurMeridiem}>
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    {/if} -->
    {#if isValidCadence(originCadence, cadence, recurHour, recurMeridiem)}
      <button class="btn btn-outline-dark" on:click={onCadenceChange}>
        Change Cadence
      </button>
    {/if}
  </div>
{/if}

<style>
  .recurSettings {
    margin-top: 0.25rem;
  }
</style>
