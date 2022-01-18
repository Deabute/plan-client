<!-- CloudSync Copyright 2021 Paul Beaudet MIT License -->
<script lang="ts">
  import { wsSend } from '../../connections/WebSocket';
  import { getPrimary, updateProfile } from '../../indexDb/profilesDb';
  import type { profileI } from '../../shared/interface';
  import { newProfile } from '../../stores/settingsStore';
  import { peerBroadcast } from '../../connections/dataChannels';
  import { peerSyncEnabled } from '../../stores/peerStore';

  export let status: string = 'Not Authorized to sync';
  export let submitedInterest: boolean = false;
  export let dismissedAlert: boolean = false;
  export let profile: profileI;
  let email: string = '';

  const signUp = async () => {
    const primary = await getPrimary();
    if (!primary) {
      status += ' / no primary profile set';
      return;
    }
    status += ' / interest expressed';
    submitedInterest = true;
    profile = primary;
    profile.assumedAuthTTL = 1;
    const { id, cert, password } = profile;
    // TODO: prove that this is cert you have the key for
    wsSend('interestedSignUp', {
      id,
      userCert: cert,
      password,
      email,
    });
    const newProfile = await updateProfile(profile);
    peerBroadcast('sync-profiles', { data: newProfile, done: true });
  };

  newProfile.subscribe(async (isNew) => {
    if (isNew) {
      const primary = await getPrimary();
      if (!primary) {
        $newProfile = false;
        return;
      }
      profile = primary;
      if (!profile.assumedAuthTTL) return;
      if (profile.assumedAuthTTL === 1) {
        status += ' / interest expressed';
        submitedInterest = true;
        dismissedAlert = true;
      }
      $newProfile = false;
    }
  });

  const validEmail = (email: string): boolean => {
    const regex =
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return regex.test(String(email).toLocaleLowerCase());
  };
</script>

<div class="row my-2">
  <span class="fs-3 text-center">Device On / Device Off sync (EE2E Cloud)</span>
</div>
<div class="row">
  <span class="text-center">{`Status: ${status}`}</span>
</div>
<div class="row mb-1">
  <span class="text-center">
    Sync data out of band with peer connected devices
  </span>
</div>
{#if submitedInterest && !dismissedAlert}
  <div class="row">
    <div
      class="text-center alert alert-success alert-dismissible fade show"
      role="alert"
    >
      Thanks for your interest
      <button
        on:click={() => {
          dismissedAlert = true;
        }}
        type="button"
        class="btn-close"
        data-bs-dismiss="alert"
        aria-label="close"
      />
    </div>
  </div>
{/if}
{#if !submitedInterest && $peerSyncEnabled && profile}
  <div class="row mb-1">
    <div class="form-floating mb-1 gy-2">
      <input
        type="text"
        class="form-control"
        id="interest-email"
        placeholder="Email"
        bind:value={email}
        aria-describedby="express-interest-button"
        aria-label="Email"
      />
      <label for="interest-email">
        Enter email to express interest in async cloud sync
      </label>
    </div>
    {#if validEmail(email)}
      <button
        type="button"
        id="express-interest-button"
        on:click={signUp}
        class="btn btn-outline-dark"
      >
        Express interest
      </button>
    {/if}
  </div>
{/if}
{#if !$peerSyncEnabled}
  <div class="row mb-1">
    <b class="text-center"> * Intial Peer Sync required * </b>
  </div>
{/if}
