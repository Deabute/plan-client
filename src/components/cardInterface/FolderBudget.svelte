<!-- FolderBudget.svelte Copyright 2021 Paul Beaudet MIT License -->
<script lang="ts">
  import type { memTaskI } from '../../shared/interface';
  import { fundingTask } from '../../stores/fundingStore';
  import { budgetAvail, refreshTask } from '../../stores/taskStore';
  import UtilizedText from './UtilizedText.svelte';
  import { editRecur, editTask, editToggle } from '../../stores/settingsStore';
  import Gear from 'svelte-bootstrap-icons/lib/Gear';
  import Sliders from 'svelte-bootstrap-icons/lib/Sliders';
  import EditBar from './EditBar.svelte';
  import RecordActionButton from '../ActionButtons/RecordActionButton.svelte';
  import { nowTimeStamp, timeStore } from '../../stores/timeStore';
  import { showTopChild } from '../../indexDb/viewStoreDb';
  import { updateTaskSafe } from '../../indexDb/taskDb';
  import { addEvent } from '../../indexDb/eventsDb';
  import Lock from 'svelte-bootstrap-icons/lib/Lock';
  import Unlock from 'svelte-bootstrap-icons/lib/Unlock';
  import { hourAndMinutesObj } from '../time/timeConvert';
  import { hourInMillis, minInMillis } from '../../stores/defaultData';

  export let task: memTaskI;
  let sliderValue: number = task.fraction;
  let newValue: number = task.fraction;
  let valid: boolean = false;
  let newHour = 0;
  let newMin = 0;
  let remaining: number = 0;
  let sliding: boolean = false;
  let maxMin: number = 0;
  let maxHour: number = 0;
  let inputEvent: boolean = false;

  const timeout = 7;
  let blinker = null;
  let count = 0;
  let slidersColor = 'black';

  const timerReset = () => {
    if (blinker) {
      count = 0;
      clearInterval(blinker);
      blinker = null;
    }
  };

  const startTimer = () => {
    timerReset();
    blinker = setInterval(() => {
      count++;
      slidersColor = slidersColor === 'success' ? 'warning' : 'success';
      if (count === timeout) {
        fundBudget();
      }
    }, 500);
  };

  const onValidityChange = (valid: boolean, value: number) => {
    if ($fundingTask !== task.id) return;
    if (!valid) timerReset();
    if (valid) startTimer();
  };

  // if a newValue is comming in its just a trigger to reset the timer
  $: onValidityChange(valid, newValue);

  const openFund = () => {
    $fundingTask = task.id;
    const { hour, minute, remainder } = hourAndMinutesObj(task.fraction);
    newHour = hour;
    newMin = minute;
    remaining = remainder;
    const { hour: hr, minute: min } = hourAndMinutesObj($budgetAvail);
    maxMin = minute + min;
    maxHour = hour + hr;
    sliderValue = task.fraction.valueOf();
    newValue = task.fraction.valueOf();
    slidersColor = 'danger';
  };

  const fundBudget = async () => {
    if (valid) {
      await updateTaskSafe({
        id: task.id,
        autoAssigned: false,
        fraction: newValue,
      });
      await addEvent('setBudget', {
        id: task.id,
        budget: newValue,
        unlock: false,
      });
    }
    $fundingTask = '';
    if (valid) refreshTask();
    slidersColor = 'black';
  };

  const onLockChange = async () => {
    task.autoAssigned = !task.autoAssigned;
    await updateTaskSafe({
      id: task.id,
      autoAssigned: task.autoAssigned,
    });
    await addEvent('setBudget', {
      id: task.id,
      budget: 0,
      unlock: task.autoAssigned,
    });
    // given autoAssigned togged to true refresh assignment to distrubute new funds
    if (task.autoAssigned) await refreshTask();
  };

  const validateHoursAndMin = (
    hours: number,
    min: number,
    remain: number,
  ): boolean => {
    slidersColor = 'danger';
    if (hours < 0) return false;
    if (min < 0 || min > 59) return false;
    // figure if user is asking for more than original funding
    newValue = min * minInMillis + hours * hourInMillis + remain;
    if (!sliding) sliderValue = newValue;
    if (newValue === task.fraction) return false;
    const extraAsk = newValue > task.fraction ? newValue - task.fraction : 0;
    if ($budgetAvail < extraAsk) return false;
    slidersColor = 'success';
    return true;
  };

  $: valid = validateHoursAndMin(newHour, newMin, remaining);

  let lagTimerId: null | ReturnType<typeof setTimeout> = null;
  const onSlideChange = (value: number) => {
    if (inputEvent) {
      inputEvent = false;
      return;
    }
    if (lagTimerId) clearTimeout(lagTimerId);
    sliding = true;
    // procesor anti-spam
    lagTimerId = setTimeout(() => {
      const { hour, minute, remainder } = hourAndMinutesObj(value);
      remaining = remainder;
      newHour = hour;
      newMin = minute;
      lagTimerId = null;
    }, 40);
  };
  $: onSlideChange(sliderValue);

  const doneSliding = () => {
    sliding = false;
  };
  const onInput = () => {
    sliding = false;
    inputEvent = true;
  };
</script>

<div class="text-center text-small row">
  {#if $fundingTask === task.id}
    <div class="col-11">
      <div class="text-center input-group input-group-sm" role="group">
        <span class="input-group-text">
          <UtilizedText {task} />
        </span>
        <input
          class="form-control"
          type="number"
          maxlength="3"
          min="0"
          max={maxHour}
          id="move-hour"
          name="move-hour"
          bind:value={newHour}
          aria-describedby="MoveHour"
          on:input={onInput}
        />
        <label for="move-hour" class="input-group-text" id="MoveHour">
          {`hour${newHour > 1 ? 's' : ''}`}
        </label>
        <input
          class="form-control"
          type="number"
          maxlength="2"
          min="0"
          max={maxMin}
          id="move-minute"
          name="move-minute"
          bind:value={newMin}
          aria-describedby="MoveMinute"
          on:input={onInput}
        />
        <label for="move-minute" class="input-group-text" id="MoveMinute">
          {`min${newMin > 1 ? 's' : ''}`}
        </label>
      </div>
    </div>
    <div
      class={`col-1 text-${slidersColor}`}
      type="button"
      on:click={fundBudget}
    >
      <Sliders />
    </div>
    <div class="col-11">
      <input
        on:mouseup={doneSliding}
        on:touchend={doneSliding}
        type="range"
        class="form-range slider"
        id="budget-slider"
        aria-describedby={`budget ${task.body}`}
        min="0"
        max={task.autoAssigned ? $budgetAvail : $budgetAvail + task.fraction}
        bind:value={sliderValue}
        step={minInMillis}
        aria-label="Budget Slider"
        disabled={!$budgetAvail && task.autoAssigned ? true : false}
      />
    </div>
    <div class="col-1 text-warning" type="button" on:click={onLockChange}>
      {#if task.autoAssigned}
        <Unlock />
      {:else}
        <Lock />
      {/if}
    </div>
  {:else}
    <!-- look when not in funding mode -->
    {#if task.status === 'todo'}
      {#if $timeStore.now.taskId === task.id || task?.topChild?.id === $timeStore.now.taskId}
        <span class="col-1 text-danger">{$nowTimeStamp}</span>
      {:else}
        <RecordActionButton
          id={$showTopChild && task.topChild ? task.topChild.id : task.id}
          body={task.body}
          cadence={task.cadence}
        />
      {/if}
    {:else}
      <!-- Maybe put delete button here in the future -->
      <div class="col-1" />
    {/if}
    {#if $editTask?.id === task.id && !$editRecur}
      <div class="col-10">
        <EditBar {task} />
      </div>
    {:else}
      <div class="col-10" type="button" on:click={openFund}>
        <UtilizedText {task} fraction={task.fraction} />&nbsp;
        <Sliders />
      </div>
    {/if}
    <div class="col-1" type="button" on:click={editToggle(task)}>
      <Gear />
    </div>
  {/if}
</div>

<style>
  .form-control {
    min-width: 54px;
  }
  .slider {
    -webkit-appearance: none;
    width: 100%;
    height: 25px;
    background: #d3d3d3;
    outline: none;
    opacity: 0.7;
    -webkit-transition: 0.2s;
    transition: opacity 0.2s;
  }

  .slider:hover {
    opacity: 1;
  }

  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 25px;
    height: 25px;
    background: #2c9162;
    cursor: pointer;
  }

  .slider::-moz-range-thumb {
    width: 25px;
    height: 25px;
    background: #2c9162;
    cursor: pointer;
  }
</style>
