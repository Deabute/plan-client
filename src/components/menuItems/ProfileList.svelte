<!-- UserList Copyright 2021 Paul Beaudet MIT License -->
<script lang="ts">
  import { getAllProfiles } from '../../indexDb/profilesDb';
  import type { profileI } from '../../shared/interface';
  import ProfileCard from './ProfileCard.svelte';

  let profiles: profileI[] = [];
  let showing: boolean = false;
</script>

<div class="card p-1 text-center my-1">
  <div>
    <span class="fs-5 me-2">profiles</span>
    <button
      class="btn btn-sm btn-outline-dark"
      on:click={async () => {
        if (!showing) profiles = await getAllProfiles();
        showing = !showing;
      }}
    >
      {showing ? 'Hide' : 'Show'}
    </button>
  </div>
  {#if showing}
    {#each profiles as profile}
      <ProfileCard {profile} />
    {/each}
  {/if}
</div>
