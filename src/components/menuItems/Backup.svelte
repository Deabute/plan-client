<!-- Backup ~ Copyright 2022 Paul Beaudet MIT License -->
<script lang="ts">
  import { showBackup, toggleSettingDialog } from '../../stores/settingsStore';
</script>

{#if $showBackup}
  <div class="card card-body m-2">
    <span class="fs-3 text-center">Option to backup data comming soon</span>
    <div class="row mt-2">
      <button
        class="btn btn-danger"
        on:click={toggleSettingDialog('backup')}
        aria-expanded="false"
        aria-controls="peerSyncDialog"
      >
        Back
      </button>
    </div>
  </div>
{/if}
