<!-- Budget.svelte Copyright 2021 Paul Beaudet MIT Licence -->
<script lang="ts">
  import { updateTask } from '../indexDb/taskDb';
  import type { taskI } from '../shared/interface';
  import { hourInMillis, minInMillis } from '../stores/defaultData';
  import { getUsedBudgetForTask } from '../indexDb/budgetDb';
  import { budgetStore } from '../stores/budgetStore';
  import { taskStore } from '../stores/taskStore';

  let parentTask: taskI;
  let originalMinute: number = 0;
  let originalHour: number = 0;
  let minute: number = 0;
  let hour: number = 0;
  let ancestralTimebox: number = 0;
  let largestChild: number = 0;
  let parentId: string = '1';
  const maxHours: number = 23; // max hours in 4 selectable weeks
  const maxMin: number = 59;

  // grab hours and minutes from an amount of millis
  const getHoursAndMinutes = (millis: number) => {
    const returnObj = {
      hours: 0,
      minutes: 0,
    };
    // see if an hour or more exist
    if (millis >= hourInMillis) {
      returnObj.hours = Math.floor(millis / hourInMillis);
      // get remaining millis
      millis = millis % hourInMillis;
    }
    // devide by minutes to see if a minute or more exist
    if (millis >= minInMillis) {
      returnObj.minutes = Math.floor(millis / minInMillis);
    }
    return returnObj;
  };

  const updateBudget = () => {
    const updateInMillis = hour * hourInMillis + minute * minInMillis;
    $taskStore.lineage[0].fraction = updateInMillis;
    updateTask({
      ...parentTask,
      fraction: updateInMillis,
      autoAssigned: false,
    }).then(() => {
      originalMinute = minute;
      originalHour = hour;
    });
  };

  const isValidState = (
    m: number | null,
    h: number | null,
    om: number,
    oh: number,
  ): boolean => {
    // given null values are present
    if (h === null || m === null) {
      return false;
    }
    // given new input is the same as the original
    if (h === oh && m === om) {
      return false;
    }
    // if out of bounds return false other wise show update button
    if (h > maxHours || m > maxMin) {
      return false;
    }
    const fractionInMillis: number = h * hourInMillis + m * minInMillis;
    if (fractionInMillis > hourInMillis * 24) {
      return false;
    }
    if (
      fractionInMillis > ancestralTimebox ||
      fractionInMillis < largestChild
    ) {
      return parentId === '1' ? true : false;
    }
    return true;
  };

  let showRecalculate: boolean = false;
  let partOfBudgetUsed: string = '0H 0M';
  const calulateTotalUsed = async () => {
    const millisUsed = await getUsedBudgetForTask(
      parentTask,
      $budgetStore.start,
    );
    if (millisUsed) {
      const time = getHoursAndMinutes(millisUsed);
      const usedHours = time.hours;
      const usedMinutes = time.minutes;
      partOfBudgetUsed = `${usedHours}H ${usedMinutes}M`;
    }
    showRecalculate = false;
    setTimeout(() => {
      showRecalculate = true;
    }, 180000);
  };

  const resetValues = (sHour: number, sMinute: number) => {
    originalHour = sHour;
    hour = sHour;
    originalMinute = sMinute;
    minute = sMinute;
  };

  taskStore.subscribe(async (store) => {
    if (store.lineage.length > 1) {
      parentId = store.lineage[1].id;
      ancestralTimebox = store.lineage[1].fraction;
    }
    largestChild = 0;
    store.tasks.forEach((task) => {
      if (task.fraction > largestChild) {
        largestChild = task.fraction;
      }
    });
    parentTask = store.lineage[0];
    if (parentTask.fraction) {
      const time = getHoursAndMinutes(parentTask.fraction);
      resetValues(time.hours, time.minutes);
      calulateTotalUsed();
      return;
    }
    resetValues(0, 0);
  });
</script>

{#if parentId === '1' || ancestralTimebox}
  <div class="budget-line">
    <span>Budget</span>
    <input
      bind:value={hour}
      class="budget-input"
      type="number"
      maxlength="3"
      size="3"
      min="0"
      max={maxHours}
    />
    <span>H</span>
    <input
      class="budget-input"
      bind:value={minute}
      type="number"
      maxlength="2"
      size="2"
      min="0"
      max={hour === 672 ? 0 : maxMin}
    />
    <span>M</span>
    {#if isValidState(minute, hour, originalMinute, originalHour)}
      <button class="btn btn-outline-dark" on:click={updateBudget}
        >Update</button
      >
    {:else if hour !== originalHour || minute !== originalMinute}
      <span>Invalid budget</span>
    {/if}
  </div>
{/if}
<!-- {#if parentTask.fraction}
  <div class="budget-line">
    <span>{partOfBudgetUsed} Utilized</span>
    {#if showRecalculate}
      <button class="btn btn-outline-dark" on:click={calulateTotalUsed}>
        Re-calculate
      </button>
    {/if}
  </div>
{/if} -->

<!-- // ----- Defaults and settings ------------
// - Default budget frame is two weeks
// - Default budget fraction is 80 hours
// - Default cadence is weekdays
// - Default budget start is on board creation
// - the same type of budget begins when the current ends
// ---------------- Visuals --------------
// - Total percent of budget used shows to the right of "projects"
// - fractional percent of budget left to utilize based on priorty shows to the right of each task
// - End line shows task that can be completed within budget
// - Message shows when a new budget ends
// - shows start time in budget modle
// --------interactive Behaviours ---------
// - priority line gives users the ability to select subsets of subtask to be included in budget
// - Start new budget now, availble in the budget model
// ------------ User data ----------
// - Start times of budgets (With their associated settings)
// - Priority lines

// ------ Fractions AKA Budgets -------
// - Fractions should be applicable to any task or habit
// - Fractions are measured in milliseconds per week, in relation to proportion of sprint
// - The reason for this is the time frames exist over a period of weeks
// - Fractions set to zero on each sprint change
// - Having a budget removes ability to rate (Because its time-boxing at a high-level) -->
<style>
  .budget-line {
    margin-top: 0.5rem;
  }
</style>
