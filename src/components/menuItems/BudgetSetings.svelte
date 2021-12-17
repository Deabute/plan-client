<!-- BudgetSetings Copyright 2021 Paul Beaudet MIT License -->
<script lang="ts">
  import { budgetStore } from '../../stores/budgetStore';
  import type { AmPm } from '../../shared/interface';
  import { updateBudget } from '../../indexDb/budgetDb';
  import {
    defaultFrame,
    frameOptions,
    frameValues,
    get24HourFormat,
  } from '../../stores/defaultData';
  import {
    showDuration,
    toggleSettingDialog,
  } from '../../stores/settingsStore';

  let currentSprintEnd: number = 0;
  let sprintEndYear: number = 2021;
  let yearOrigin: number = 2021;
  let sprintEndMonth: number = 5;
  let monthOrigin: number = 5;
  let sprintEndDay: number = 5;
  let dayOrigin: number = 5;
  let sprintEndHour: number = 5;
  let hourOrigin: number = 5;
  let sprintEndAmPm: AmPm = 'PM';
  let meridiemOrigin: AmPm = 'PM';
  let sprintDuration: number = defaultFrame;
  let originDuration: number = defaultFrame;
  let current = false;

  budgetStore.subscribe((budget) => {
    sprintDuration = budget.frame;
    originDuration = sprintDuration;
    currentSprintEnd = budget.start + budget.frame;
    const currentDate = new Date(currentSprintEnd);
    sprintEndYear = currentDate.getFullYear();
    yearOrigin = sprintEndYear;
    sprintEndMonth = currentDate.getMonth() + 1;
    monthOrigin = sprintEndMonth;
    sprintEndDay = currentDate.getDate();
    dayOrigin = sprintEndDay;
    const hours = currentDate.getHours();
    let hour12format: number = hours ? hours : 12;
    sprintEndHour = hours > 12 ? hours - 12 : hour12format;
    hourOrigin = sprintEndHour;
    sprintEndAmPm = hours > 11 ? 'PM' : 'AM';
    meridiemOrigin = sprintEndAmPm;
    current = true;
  });

  let newSprintEnd: number = 0;
  const sprintEndChange = () => {
    const newStart = newSprintEnd - $budgetStore.frame;
    $budgetStore.start = newStart;
    updateBudget($budgetStore);
  };

  const daysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const isValidEndDate = (
    month: number,
    day: number,
    hour: number,
    meridiem: AmPm,
    oMonth: number,
    oDay: number,
    oHour: number,
    oMeridiem: AmPm,
  ): boolean => {
    current = true;
    if (month !== oMonth) {
      current = false;
    }
    if (day !== oDay) {
      current = false;
    }
    if (hour !== oHour) {
      current = false;
    }
    if (meridiem !== oMeridiem) {
      current = false;
    }
    if (day > daysInMonth(sprintEndYear, month)) {
      return false;
    }
    if (!month || !hour) {
      return false;
    }
    if (!current) {
      // practically speaking one can update only less than a month back or forward
      // Which is why the following turnaries will work
      sprintEndYear =
        oMonth === 12 && month === 1 ? yearOrigin + 1 : sprintEndYear;
      sprintEndYear =
        oMonth === 1 && month === 12 ? yearOrigin - 1 : sprintEndYear;
      const hour24format: number = get24HourFormat(hour, meridiem);
      newSprintEnd = new Date(
        sprintEndYear,
        month - 1,
        day,
        hour24format,
      ).getTime();
      const now = Date.now();
      const upperBound = now + $budgetStore.frame;
      if (now > newSprintEnd || upperBound < newSprintEnd) {
        return false;
      }
    }
    sprintEndYear = oMonth === month ? yearOrigin : sprintEndYear;
    return !current;
  };

  const onDurationChange = () => {
    $budgetStore.frame = sprintDuration;
    updateBudget($budgetStore);
  };

  const leewayExist = (frame: number, start: number): boolean => {
    return start + frame > Date.now();
  };
</script>

{#if $showDuration}
  <div class="card card-body" id="budgetSettings">
    <div class="input-group mb-3">
      <span class="input-group-text" id="sprint-indicator">
        {current ? 'Current ' : 'New '}Sprint End:
      </span>
      <input
        class="form-control"
        aria-label="Month"
        aria-describedby=""
        type="number"
        maxlength="2"
        size="2"
        min="1"
        max="12"
        id="sprint-end-month"
        name="sprint-end-month"
        bind:value={sprintEndMonth}
      />
      <input
        class="form-control"
        aria-label="day of month"
        type="number"
        maxlength="2"
        size="2"
        min="1"
        max={daysInMonth(sprintEndYear, sprintEndMonth)}
        id="sprint-end-day"
        name="sprint-end-day"
        bind:value={sprintEndDay}
      />
      <span class="input-group-text" aria-label="year"> {sprintEndYear} </span>
      <input
        class="form-control"
        aria-label="hour"
        type="number"
        maxlength="2"
        size="2"
        min="1"
        max="12"
        id="sprint-end-hour"
        name="sprint-end-hour"
        bind:value={sprintEndHour}
      />
      <select
        class="form-select"
        aria-label="AM or PM"
        name="sprint-end-AmPm"
        id="sprint-end-AmPm"
        bind:value={sprintEndAmPm}
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
      {#if isValidEndDate(sprintEndMonth, sprintEndDay, sprintEndHour, sprintEndAmPm, monthOrigin, dayOrigin, hourOrigin, meridiemOrigin)}
        <button
          class="btn btn-outline-dark"
          aria-label="change sprint"
          on:click={sprintEndChange}
        >
          Change
        </button>
      {/if}
    </div>
    <div class="input-group mb-3">
      <span class="input-group-text">Current Duration</span>
      <select class="input-select" bind:value={sprintDuration}>
        {#each frameOptions as frame, i}
          {#if leewayExist(frameValues[i], $budgetStore.start)}
            <option value={frameValues[i]}>
              {frame} Week{frame > 1 ? 's' : ''}
            </option>
          {/if}
        {/each}
      </select>
      {#if sprintDuration !== originDuration}
        <button class="btn btn-outline-dark" on:click={onDurationChange}>
          {sprintDuration > originDuration ? 'Extend' : 'Reduce'}
        </button>
      {/if}
    </div>
    <button
      class=" btn btn-outline-danger"
      on:click={toggleSettingDialog('duration')}
      aria-expanded="false"
      aria-controls="budgetSettings"
    >
      Back
    </button>
  </div>
{/if}
