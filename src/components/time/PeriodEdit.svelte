<!-- StampEdit.svelte Copyright 2021 Paul Beaudet MIT License -->
<script lang="ts">
  import { writable } from 'svelte/store';
  import type { Writable } from 'svelte/store';
  import { timePeriods, timePeriodsInMillis } from './timePrimitives';

  // Exposed component props
  export let stamp: number;
  export let editedStamp: number;

  const fromNow: Writable<boolean> = writable(true);
  const periodToUse: Writable<number> = writable(1);
  const multiplier: Writable<number> = writable(1);
  let startTime = Date.now();
  editedStamp = startTime + timePeriodsInMillis[$periodToUse] * $multiplier;

  fromNow.subscribe((newValue) => {
    startTime = newValue ? Date.now() : stamp;
    editedStamp = startTime + timePeriodsInMillis[$periodToUse] * $multiplier;
  });

  multiplier.subscribe((newMultiple) => {
    editedStamp = startTime + timePeriodsInMillis[$periodToUse] * newMultiple;
  });

  periodToUse.subscribe((newPeriod) => {
    // const timeToAdd = console.log(`time to add ${timeToAdd}`);
    editedStamp = startTime + timePeriodsInMillis[newPeriod] * $multiplier;
  });
</script>

<div class="input-group input-group-sm">
  <input
    type="number"
    class="form-control"
    maxlength="2"
    min="1"
    max="99"
    id="multiplier"
    name="multiplier"
    bind:value={$multiplier}
  />
  <select
    name="timePeriod"
    class="form-select"
    id="timePeriod"
    bind:value={$periodToUse}
  >
    {#each timePeriods as period, i}
      <option class="dropdown-item" value={i}>
        {$multiplier > 1 ? `${period}s` : period}
      </option>
    {/each}
  </select>
  <span class="input-group-text">{` From `}</span>
  <select
    name="fromNowOrLastDue"
    class="form-select"
    id="fromNowOrLastDue"
    bind:value={$fromNow}
  >
    <option class="dropdown-item" value={true}> Now </option>
    <option class="dropdown-itam" value="{false};"> Last Due </option>
  </select>
</div>
