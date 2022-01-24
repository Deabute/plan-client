<!-- Backup ~ Copyright 2022 Paul Beaudet MIT License -->
<script lang="ts">
  import { exportData } from '../../indexDb/backupRestoreDb';

  let backupServer: string = 'ws://localhost:3010';

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
  <div class="row mb-1">
    <div class="form-floating mb-1 gy-2">
      <input
        type="text"
        class="form-control"
        id="backupServer"
        placeholder="Email"
        bind:value={backupServer}
        aria-describedby="export-button"
        aria-label="export server"
      />
      <label for="backupSever"> Backup server address </label>
    </div>
    <button
      type="button"
      disabled={!validServer}
      id="export-button"
      on:click={exportData(backupServer)}
      class="btn btn-info"
    >
      Export Data
    </button>
  </div>
</div>
