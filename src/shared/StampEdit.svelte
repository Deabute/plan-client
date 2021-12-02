<!-- StampEdit.svelte Copyright 2021 Paul Beaudet MIT License -->
<script lang="ts">
  import { writable } from 'svelte/store';
  import type { Writable } from 'svelte/store';
  import {
    daysInMonth,
    get12Hour,
    get24Hour,
  } from '../components/time/timeConvert';
  import { MONTH_SHORT } from '../stores/defaultData';
  import type { AmPm } from './interface';

  // Exposed component props
  export let stamp: number;
  export let editedStamp: number;

  const date = new Date(stamp);
  let hour = date.getHours();
  const timeState: Writable<{
    hour: number;
    meridian: AmPm;
    month: number;
    day: number;
    minute: number;
    year: number;
  }> = writable({
    hour: get12Hour(hour),
    meridian: hour > 11 ? 'PM' : 'AM',
    month: date.getMonth(),
    day: date.getDate(),
    minute: date.getMinutes(),
    year: date.getFullYear(),
  });

  timeState.subscribe((time) => {
    const dateHour = get24Hour(time.hour, time.meridian);
    editedStamp = new Date(
      time.year,
      time.month,
      time.day,
      dateHour,
      time.minute,
    ).getTime();
  });
</script>

<select
  name="timestamp-month"
  class="three-char-wide"
  id="timestamp-AmPm"
  bind:value={$timeState.month}
>
  {#each MONTH_SHORT as month, i}
    <option value={i}>{month}</option>
  {/each}
</select>
<span class="">D</span>
<input
  type="number"
  class="two-char-wide"
  maxlength="2"
  min="1"
  max={daysInMonth($timeState.year, $timeState.month)}
  id="month-day"
  name="month-day"
  bind:value={$timeState.day}
/>
<span class="">H</span>
<input
  type="number"
  class="two-char-wide"
  maxlength="2"
  min="1"
  max="12"
  id="timestamp-hour"
  name="timestamp-hour"
  bind:value={$timeState.hour}
/>
<span class="">M</span>
<input
  type="number"
  class="two-char-wide"
  maxlength="2"
  min="0"
  max="59"
  id="timestamp-minute"
  name="timestamp-minute"
  bind:value={$timeState.minute}
/>
<select
  name="timestamp-AmPm"
  class="three-char-wide"
  id="timestamp-AmPm"
  bind:value={$timeState.meridian}
>
  <option value="AM">AM</option>
  <option value="PM">PM</option>
</select>
<input
  type="number"
  class="four-char-wide"
  maxlength="4"
  min="1970"
  id="timestamp-year"
  name="timestamp-year"
  bind:value={$timeState.year}
/>

<style>
  .two-char-wide {
    width: 5em;
  }
  .three-char-wide {
    width: 5em;
  }
  .four-char-wide {
    width: 6em;
  }
</style>
