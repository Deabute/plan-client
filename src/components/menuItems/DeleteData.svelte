<!-- DeleteData.svelte Copyright 2021 Paul Beaudet MIT License -->
<script lang="ts">
  import { deleteDB } from 'idb';
  import { DB_NAME } from '../../indexDb/dbCore';
  import {
    showFreshStart,
    toggleSettingDialog,
  } from '../../stores/settingsStore';

  let reallySureView: boolean = false;

  const deleteIt = async () => {
    // drop all stores
    await deleteDB(DB_NAME);
    // force a page reload
    window.location.reload();
  };
</script>

{#if $showFreshStart}
  <div class="card card-body" id="freshStart">
    {#if reallySureView}
      <span>
        Really? Data will disappear unless it had synced to another device or is
        later found in unallocated storage by an expert.
      </span>
    {:else}
      <span>Lose access to all data and start over?</span>
    {/if}
    {#if reallySureView}
      <button class="btn btn-danger" on:click={deleteIt}>
        "Delete" it. Past data is unimportant or backed up on other device.
      </button>
    {:else}
      <button
        class="btn btn-danger"
        on:click={() => {
          reallySureView = true;
        }}
      >
        Start from scratch on this device
      </button>
    {/if}
    <button
      class="btn btn-success"
      on:click={toggleSettingDialog('freshStart')}
      aria-expanded="false"
      aria-controls="freshStart"
    >
      Keep Data
    </button>
  </div>
{/if}

<style>
</style>
