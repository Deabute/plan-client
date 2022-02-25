<!-- DeleteData.svelte Copyright 2021 Paul Beaudet MIT License -->
<script lang="ts">
  import {
    loadViewSettings,
    showFreshStart,
    toggleView,
  } from '../../indexDb/viewStoreDb';
  import Trash from 'svelte-bootstrap-icons/lib/Trash';
  import BoxArrowInLeft from 'svelte-bootstrap-icons/lib/BoxArrowInLeft';
  import { clearData } from '../../indexDb/profilesDb';
  import { loadChildren, refreshAllViews } from '../../stores/taskStore';
  import { loadCredentials } from '../../stores/credentialStore';
  import { getBudget } from '../../stores/budgetStore';
  import { getTime } from '../../stores/timeStore';
  import { loadAgenda } from '../../stores/agendaStore';

  let reallySureView: boolean = false;

  const deleteIt = async () => {
    if (!reallySureView) {
      reallySureView = true;
      return;
    }
    reallySureView = false;
    toggleView('showFreshStart')();
    // drop all stores
    await clearData();
    // force a page reload
    await getBudget();
    await loadChildren('1');
    await getTime();
    await loadAgenda();
    await loadCredentials();
    await loadViewSettings();
    await refreshAllViews();
  };
</script>

{#if $showFreshStart}
  <div class="d-flex flex-column">
    <div class="card card-body m-1" id="freshStart">
      <h3>Delete all Time Intent data from this device?</h3>
      <div class="row alert alert-danger">
        <span class="col-12 m-2">
          {reallySureView
            ? 'All data will disappear unless backup or sync has occurred * '
            : 'Fresh start includes removing paid service credentials and connections *'}
        </span>
        <button
          class="col-auto btn btn-success btn-lg m-2"
          on:click={() => {
            reallySureView = false;
            toggleView('showFreshStart')();
          }}
          aria-expanded="false"
          aria-controls="freshStart"
        >
          <BoxArrowInLeft /> &nbsp; Back to safty
        </button>
        <button
          class="col-auto btn btn-danger btn-lg m-2"
          on:click={deleteIt}
          aria-expanded="false"
          aria-controls="data-removal"
        >
          <Trash /> &nbsp;
          {reallySureView
            ? "I'm sure, Start Over"
            : 'I would like to remove all data'}
        </button>
      </div>
      <div class="row alert alert-info">
        <p class="col-12">
          * skilled 3rd partys may be able to recover deleted data from your
          local storage medium used to store this data
        </p>
        <p class="col-12">
          Note: Private information from this application is only stored on user
          devices (Within your web browser's IndexedDB) see our <a
            href="https://deabute.com/plan-privacy-policy/"
          >
            Privacy Policy
          </a> for more details
        </p>
      </div>
    </div>
  </div>
{/if}
