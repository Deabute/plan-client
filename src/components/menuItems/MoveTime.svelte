<!-- MoveTime.svelte ~ Copyright 2021 Paul Beaudet MIT License -->
<script lang="ts">
  import { addEvent } from '../../indexDb/eventsDb';
  import { updateTask } from '../../indexDb/taskDb';
  import { hourInMillis, minInMillis } from '../../stores/defaultData';
  import { cancelFund, fundSetting } from '../../stores/fundingStore';
  import { editDue, editRecur } from '../../stores/settingsStore';
  import { refreshTask } from '../../stores/taskStore';
  import Check from 'svelte-bootstrap-icons/lib/Check';
  import XLg from 'svelte-bootstrap-icons/lib/XLg';
  import Lock from 'svelte-bootstrap-icons/lib/Lock';
  import Unlock from 'svelte-bootstrap-icons/lib/Unlock';

  let validFunds: boolean = false;
  let lock: boolean = false;

  // figure out if enough time exist for this change to be made
  fundSetting.subscribe((setting) => {
    if (setting.task === null) {
      validFunds = false;
      return;
    }
    editDue.set(null);
    editRecur.set(null);
    lock = setting.task.autoAssigned ? false : true;
    if (setting.minutes > 59) {
      validFunds = false;
      return;
    }
    // add up available funding
    let availMillis = setting.availMin * minInMillis;
    availMillis += setting.availHours * hourInMillis;
    // figure if user is asking for more than original funding
    let ask = setting.minutes * minInMillis;
    ask += setting.hours * hourInMillis;
    // if asking more that orginally had set ask to difference
    ask = ask > setting.task.fraction ? ask - setting.task.fraction : 0;
    // if that funding is more than available set validFunds to false
    validFunds = availMillis >= ask ? true : false;
  });

  // evenly pull from unlocked budgets to fund users requirement for this budget
  const fundBudget = async () => {
    // get total millis minus already funded budget
    const totalMin = $fundSetting.minutes * minInMillis;
    const totalHour = $fundSetting.hours * hourInMillis;
    const fraction = totalMin + totalHour;
    await updateTask({
      ...$fundSetting.task,
      autoAssigned: false,
      fraction,
    });
    addEvent('setBudget', {
      id: $fundSetting.task.id,
      budget: fraction,
      unlock: false,
    });
    // ask a db function to move the funds around
    cancelFund();
    refreshTask();
  };

  const onLockChange = async () => {
    $fundSetting.task.autoAssigned = !$fundSetting.task.autoAssigned;
    updateTask({
      ...$fundSetting.task,
      autoAssigned: $fundSetting.task.autoAssigned,
    });
    addEvent('setBudget', {
      id: $fundSetting.task.id,
      budget: 0,
      unlock: $fundSetting.task.autoAssigned,
    });
    // given autoAssigned togged to true refresh assignment to distrubute new funds
    if ($fundSetting.task.autoAssigned) {
      await refreshTask();
    }
    cancelFund();
  };
</script>

<div class="text-center m-1">
  <div class="input-group input-group-sm">
    <span class="input-group-text">
      <slot />
    </span>
    <input
      class="three-char-wide form-control"
      type="number"
      maxlength="3"
      min="0"
      max={$fundSetting.totalHour}
      id="move-hour"
      name="move-hour"
      bind:value={$fundSetting.hours}
      aria-describedby="MoveHour"
    />
    <label for="move-hour" class="input-group-text" id="MoveHour">
      {`hour${$fundSetting.hours > 1 ? 's' : ''}`}
    </label>
    <input
      class="two-char-wide form-control"
      type="number"
      maxlength="2"
      min="0"
      max={$fundSetting.totalMin}
      id="move-minute"
      name="move-minute"
      bind:value={$fundSetting.minutes}
      aria-describedby="MoveMinute"
    />
    <label for="move-minute" class="input-group-text" id="MoveMinute">
      {`min${$fundSetting.minutes > 1 ? 's' : ''}`}
    </label>
  </div>
  <div class="btn-group btn-group-sm" role="group">
    <button
      class="btn btn-outline-dark text-danger"
      type="button"
      on:click={cancelFund}
    >
      <XLg /> Cancel
    </button>
    <button
      class="btn btn-outline-dark text-warning"
      type="button"
      on:click={onLockChange}
    >
      {#if lock}
        <Unlock /> Auto
      {:else}
        <Lock /> Lock
      {/if}
    </button>
    {#if validFunds}
      <button
        class="btn btn-outline-dark text-success"
        type="button"
        on:click={fundBudget}
      >
        <Check /> Change
      </button>
    {:else}
      <span class="text-danger">Invalid</span>
    {/if}
  </div>
</div>
