<!-- Backup ~ Copyright 2022 Paul Beaudet MIT License -->
<script lang="ts">
  import {
    backupData,
    restore,
    backupStatus,
    connectBackupServer,
    availableBackups,
    showBackupOptions,
  } from '../../indexDb/backupRestoreDb';

  let backupServer: string = 'ws://localhost:3010';
  let backupName: string = 'example';

  let validServer = false;
  $: validServer = backupServer ? true : false;
</script>

<span class="fs-3 text-center my-2">Backup data</span>
<div class="row mb-1">
  <p class="text-center">Feature in under construction</p>
  <p class="text-center">
    Encrypted Backup data stored in Time Intent database so that it can be
    recovered in case of complete data loss. You'll need to print credentials,
    put them in a password manager, or somewhere safe that is not the devices
    you might need the back up for.
  </p>
  <p class="text-center">{`Status: ${$backupStatus}`}</p>
  <div class="row mb-1">
    {#if $showBackupOptions}
      <div class="form-floating mb-1 gy-2">
        <input
          type="text"
          class="form-control"
          id="backupName"
          placeholder="Backup name"
          bind:value={backupName}
          aria-describedby="backup-name"
          aria-label="export server"
        />
        <label for="backupName"> Backup name (avoid underscores)</label>
      </div>
      <button
        type="button"
        id="backup-name"
        on:click={backupData(backupName)}
        class="col-auto m-2 btn btn-info"
      >
        {`Backup ${backupName}`}
      </button>
      {#each $availableBackups as { value, name }}
        <button
          type="button"
          id={`restore-point-${value}`}
          on:click={restore(value)}
          class="col-auto m-2 btn btn-danger"
        >
          {`Restore ${name}`}
        </button>
      {/each}
    {:else}
      <div class="form-floating mb-1 gy-2">
        <input
          type="text"
          class="form-control"
          id="backupServer"
          placeholder="Backup Server"
          bind:value={backupServer}
          aria-describedby="export-button"
          aria-label="export server"
        />
        <label for="backupSever"> Backup server address </label>
      </div>
      <div class="col-6">
        <button
          type="button"
          disabled={!validServer}
          id="connect-to-backup"
          on:click={connectBackupServer(backupServer)}
          class="m-2 btn btn-info"
        >
          Connect
        </button>
      </div>
    {/if}
  </div>
</div>
