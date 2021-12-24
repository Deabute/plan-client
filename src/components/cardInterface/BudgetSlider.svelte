<!-- BudgetSlider.svelte Copyright 2021 Paul Beaudet MIT License -->
<script lang="ts">
  import type { memTaskI } from '../../shared/interface';
  import { minInMillis } from '../../stores/defaultData';
  import { refreshTask } from '../../stores/taskStore';
  import type { Writable } from 'svelte/store';
  import { writable } from 'svelte/store';
  import { updateTaskSafe } from '../../indexDb/taskDb';
  import { addEvent } from '../../indexDb/eventsDb';
  import Lock from 'svelte-bootstrap-icons/lib/Lock';
  import Unlock from 'svelte-bootstrap-icons/lib/Unlock';
  import { cancelFund } from '../../stores/fundingStore';
  import XLg from 'svelte-bootstrap-icons/lib/XLg';

  export let autoAssigned: boolean;
  export let fraction: number;
  export let task: memTaskI;
  export let availableFunds: number;

  let maxToDrawFrom = autoAssigned ? availableFunds : availableFunds + fraction;

  let originValue: number = fraction.valueOf();
  let originAssign: boolean = autoAssigned.valueOf();
  let slideValue: Writable<number> = writable(fraction);
  $: $slideValue = fraction; // responsively keep slide value up to date

  let lagTimerId: null | ReturnType<typeof setTimeout> = null;
  slideValue.subscribe((value) => {
    if (lagTimerId) clearTimeout(lagTimerId);
    // procesor anti-spam
    lagTimerId = setTimeout(() => {
      if (value === originValue) {
        autoAssigned = originAssign;
        return;
      }
      autoAssigned = false;
      fraction = $slideValue.valueOf();
      lagTimerId = null;
    }, 30);
  });

  const onUpEvent = async () => {
    autoAssigned = false;
    fraction = $slideValue.valueOf();
    originValue = $slideValue.valueOf();
    originAssign = false;
    await updateTaskSafe({
      id: task.id,
      fraction,
      autoAssigned,
    });
    await addEvent('setBudget', {
      id: task.id,
      budget: fraction,
      unlock: false,
    });
    refreshTask();
  };

  const onLockChange = async () => {
    task.autoAssigned = !task.autoAssigned;
    autoAssigned = task.autoAssigned;
    await updateTaskSafe({
      id: task.id,
      autoAssigned,
    });
    await addEvent('setBudget', {
      id: task.id,
      budget: 0,
      unlock: autoAssigned,
    });
    // given autoAssigned togged to true refresh assignment to distrubute new funds
    if (autoAssigned) await refreshTask();
  };
</script>

<div class="col-1 text-danger" type="button" on:click={cancelFund}>
  <XLg />
</div>
<div class="col-10">
  <input
    on:mouseup={onUpEvent}
    on:touchend={onUpEvent}
    type="range"
    class="form-range slider"
    id="budget-slider"
    aria-describedby={`budget ${task.body}`}
    min="0"
    max={maxToDrawFrom}
    bind:value={$slideValue}
    step={minInMillis}
    aria-label="Set Budget Slider"
    disabled={availableFunds || originValue ? false : true}
  />
</div>
<div class="col-1 text-warning" type="button" on:click={onLockChange}>
  {#if autoAssigned}
    <Unlock />
  {:else}
    <Lock />
  {/if}
</div>

<style>
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
