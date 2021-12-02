<!-- Timestamp.svelte Copyright 2021 Paul Beaudet MIT License -->
<script lang="ts">
  import { writable } from 'svelte/store';
  import type { Writable } from 'svelte/store';
  import {
    getDurationStamp,
    getHumanReadableStamp,
  } from '../components/time/timeConvert';
  import { peerBroadcast } from '../connections/dataChannels';
  import { addEvent } from '../indexDb/eventsDb';
  import { editStamp, removeStamp } from '../indexDb/timelineDb';
  import {
    nowTimeStamp,
    recordTime,
    refreshTime,
    timeStore,
  } from '../stores/timeStore';
  import type { memStampI, timestampI } from './interface';
  import StampEdit from './StampEdit.svelte';
  import { canUndo, getTaskById } from '../indexDb/taskDb';
  import { undoAndPlace, checkOff, openFolder } from '../stores/taskStore';
  import { loadAgenda } from '../stores/agendaStore';
  import Gear from 'svelte-bootstrap-icons/lib/Gear';
  import Check from 'svelte-bootstrap-icons/lib/Check';
  import Trash from 'svelte-bootstrap-icons/lib/Trash';
  import XLg from 'svelte-bootstrap-icons/lib/XLg';
  import Recycle from 'svelte-bootstrap-icons/lib/Recycle';
  import RecordBtn from 'svelte-bootstrap-icons/lib/RecordBtn';
  import FolderSymlink from 'svelte-bootstrap-icons/lib/FolderSymlink';
  import { moveTask } from '../stores/settingsStore';
  // Exposed component props
  export let timestamp: memStampI;
  export let inProgress: boolean = false;

  let editing: boolean = false;
  let editedStamp: Writable<number> = writable(timestamp.start.valueOf());

  const makeEdit = async () => {
    const { body, effort, duration, done, ...stamp } = timestamp;
    const newTimestamp: timestampI = {
      ...stamp,
      start: $editedStamp.valueOf(),
      lastModified: Date.now(),
    };
    await editStamp(newTimestamp);
    await addEvent('editTimestamp', {
      id: stamp.id,
      timestamp: newTimestamp.start,
    });
    peerBroadcast('sync-timeline', { data: newTimestamp, done: true });
    refreshTime();
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

  const validEdit: Writable<boolean> = writable(true);
  editedStamp.subscribe((newStamp) => {
    $validEdit = validateEdit(newStamp);
  });

  const toggleEdit = () => {
    editing = !editing;
  };

  const deleteStamp = async () => {
    const { id } = timestamp;
    await removeStamp(id);
    await addEvent('removeTimestamp', { id });
    refreshTime();
  };

  const undoable: Writable<boolean> = writable(false);
  if (timestamp.done) {
    // check if this timestamp is undoable
    canUndo(timestamp.taskId).then((value) => {
      $undoable = value;
    });
  }

  const getUndid = async () => {
    await undoAndPlace(timestamp.taskId);
    timestamp.done = false;
    loadAgenda();
  };

  const complete = async () => {
    await checkOff(timestamp.taskId)();
    $undoable = true;
  };

  const recordThisTask = async () => {
    const task = await getTaskById(timestamp.taskId);
    recordTime(task);
  };

  const openThisFolder = async () => {
    const task = await getTaskById(timestamp.taskId);
    openFolder(task, $moveTask)();
  };
</script>

<div class={`pb-1 border-bottom`} id={timestamp.id}>
  <div class="row mb-1 text-center">
    {#if timestamp.done || $timeStore.now.taskId === timestamp.taskId}
      <span class="col-2" />
    {:else}
      <div class="col-2 text-danger" type="button" on:click={recordThisTask}>
        <RecordBtn />
      </div>
    {/if}
    <span
      class={`col-8 text-center ${timestamp.done ? ' done' : ''}`}
      type="button"
      on:click={openThisFolder}
    >
      {timestamp.body}
    </span>
    {#if !timestamp.done}
      <div class="col-2 text-success" type="button" on:click={complete}>
        <Check />
      </div>
    {:else if $undoable}
      <div class="col-2" type="button" on:click={getUndid}>
        <Recycle />
      </div>
    {/if}
  </div>

  <div class="row text-center">
    {#if editing}
      <div class="col-12 start-edit">
        <StampEdit
          bind:stamp={timestamp.start}
          bind:editedStamp={$editedStamp}
        />
      </div>
    {:else}
      <div class="col-2" type="button" on:click={openThisFolder}>
        <FolderSymlink />
      </div>
      <span class="col-6" on:click={toggleEdit}>
        {getHumanReadableStamp(timestamp.start)}
      </span>
      <span class={`col-2${inProgress ? ' text-danger' : ''}`}>
        {inProgress ? $nowTimeStamp : getDurationStamp(timestamp.duration)}
      </span>
      <div class="col-2" type="button" on:click={toggleEdit}>
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
          on:click={$validEdit ? makeEdit : () => {}}
        >
          {#if $validEdit}
            <Check />
            Change
          {:else}
            invalid
          {/if}
        </button>
        <button
          class="btn btn-outline-dark text-danger"
          type="button"
          on:click={deleteStamp}
        >
          <Trash /> Delete
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .done {
    text-decoration: line-through;
  }
  .start-edit {
    font-size: 0.55em;
    align-items: center;
    text-align: center;
  }
</style>
