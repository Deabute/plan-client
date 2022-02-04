<!-- Timestamp.svelte Copyright 2021 Paul Beaudet MIT License -->
<script lang="ts">
  import {
    getDurationStamp,
    getHumanReadableStamp,
  } from '../components/time/timeConvert';
  import { addEvent } from '../indexDb/eventsDb';
  import { editStamp, removeStamp } from '../indexDb/timelineDb';
  import { nowTimeStamp, refreshTime, timeStore } from '../stores/timeStore';
  import type { memStampI, timestampI } from './interface';
  import StampEdit from './StampEdit.svelte';
  import { refreshTask } from '../stores/taskStore';
  import Gear from 'svelte-bootstrap-icons/lib/Gear';
  import Check from 'svelte-bootstrap-icons/lib/Check';
  import Trash from 'svelte-bootstrap-icons/lib/Trash';
  import XLg from 'svelte-bootstrap-icons/lib/XLg';
  import CheckSquare from 'svelte-bootstrap-icons/lib/CheckSquare';
  import CheckOffButton from '../components/ActionButtons/CheckOffButton.svelte';
  import BodyAndAction from '../components/ActionButtons/BodyAndAction.svelte';
  import { showDone, toggleView } from '../indexDb/viewStoreDb';
  import RecordActionButton from '../components/ActionButtons/RecordActionButton.svelte';
  // Exposed component props
  export let timestamp: memStampI;
  export let inProgress: boolean = false;
  let { start } = timestamp;

  let editing: boolean = false;

  const makeEdit = async () => {
    const { body, duration, status, ...stamp } = timestamp;
    const newTimestamp: timestampI = {
      ...stamp,
      start,
      lastModified: Date.now(),
    };
    await editStamp(newTimestamp);
    await addEvent('editTimestamp', { stamp: newTimestamp });
    refreshTime(false);
    refreshTask(); // potential change in utilization
    editing = false;
  };

  const validateEdit = (newTimestamp: number): boolean => {
    const now = Date.now();
    if (!inProgress) {
      return newTimestamp >= $timeStore.now.start ? false : true;
    }
    if (!$timeStore.history.length) return false;
    // can't become older than last task recorded if inProgress task
    return newTimestamp <= $timeStore.history[0].start || newTimestamp >= now
      ? false
      : true;
  };

  let validEdit = false;
  $: validEdit = validateEdit(start);

  const toggleEdit = () => {
    editing = !editing;
  };

  const deleteStamp = async () => {
    await removeStamp(timestamp.id);
    await addEvent('removeTimestamp', { id: timestamp.id });
    refreshTime();
  };
</script>

<div class="pb-1 border-bottom container-fluid" id={timestamp.id}>
  {#if timestamp.status === 'todo' || $showDone}
    <div class="row mb-1 text-center">
      <CheckOffButton id={timestamp.taskId} status={timestamp.status} />
      <BodyAndAction
        id={timestamp.taskId}
        body={timestamp.body}
        status={timestamp.status}
      />
    </div>
  {/if}

  <div class="row text-center">
    {#if editing}
      <div class="col-12 start-edit">
        <StampEdit bind:stamp={timestamp.start} bind:editedStamp={start} />
      </div>
    {:else}
      {#if inProgress}
        <span class="col-1 text-danger">Tracking</span>
      {:else if timestamp.status === 'todo'}
        <RecordActionButton id={timestamp.taskId} body={timestamp.body} />
      {:else if $showDone}
        <span class="col-1" />
      {:else}
        <div class="col-1" type="button" on:click={toggleView('showDone')}>
          <CheckSquare />
        </div>
      {/if}
      <span class="col-8" on:click={toggleEdit}>
        {getHumanReadableStamp(timestamp.start, false)}
      </span>
      <span class={`col-2${inProgress ? ' text-danger' : ''}`}>
        {inProgress ? $nowTimeStamp : getDurationStamp(timestamp.duration)}
      </span>
      <div class="col-1" type="button" on:click={toggleEdit}>
        <Gear />
      </div>
    {/if}
  </div>

  {#if editing}
    <div class="row px-1">
      <div class="col-12 btn-group btn-group-sm" role="group">
        <button
          class="btn btn-outline-dark text-danger"
          type="button"
          on:click={toggleEdit}
        >
          <XLg /> Cancel
        </button>
        <button
          class="btn btn-outline-dark"
          type="button"
          on:click={validEdit ? makeEdit : () => {}}
        >
          {#if validEdit}
            <Check />
            Change
          {:else}
            invalid
          {/if}
        </button>
        {#if !inProgress}
          <button
            class="btn btn-outline-dark text-danger"
            type="button"
            on:click={deleteStamp}
          >
            <Trash /> Delete
          </button>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .start-edit {
    font-size: 0.55em;
    align-items: center;
    text-align: center;
  }
</style>
