<!-- CloudSync Copyright 2021 Paul Beaudet MIT License -->
<script lang="ts">
  import { wsOn, wsSend } from '../../connections/WebSocket';
  import { addToken, getLatestToken } from '../../indexDb/tokenDb';
  import {
    getPrimary,
    initProfile,
    updateProfile,
  } from '../../indexDb/profilesDb';
  import type { tokenI, profileI } from '../../shared/interface';
  import {
    newProfile,
    showCloudSync,
    toggleSettingDialog,
  } from '../../stores/settingsStore';
  import { refreshTime, secondTick } from '../../stores/timeStore';
  import ProfileList from './ProfileList.svelte';
  import {
    handleDataSync,
    peerBroadcast,
  } from '../../connections/dataChannels';
  import { checkPeerSyncEnabled } from '../../indexDb/connectionDB';
  import { getNextConnectionCacheId, unpackCache } from '../../indexDb/pskDb';
  import type { relayPkt, syncCache } from '../../connections/connectInterface';
  import {
    peerSyncEnabled,
    rtcPeers,
    syncingDown,
  } from '../../stores/peerStore';
  import { refreshTask } from '../../stores/taskStore';
  import { loadAgenda } from '../../stores/agendaStore';

  let status: string = 'Not Authorized to sync';
  let submitedInterest: boolean = false;
  let dismissedAlert: boolean = false;
  let profile: profileI;
  let recentToken: tokenI = null;
  let tokenPromise: Promise<tokenI> = null;
  let email: string = '';

  const requestToken = (uProfile: profileI) => {
    wsSend('requestAuthToken', {
      userId: uProfile.id,
      password: uProfile.password,
    });
  };

  const anyConnected = () => {
    for (let i = 0; i < $rtcPeers.length; i++) {
      if ($rtcPeers[i].connected) return true;
    }
    return false;
  };

  const requestSyncDown = async () => {
    if (anyConnected()) return;
    $syncingDown = true;
    const cacheId = await getNextConnectionCacheId();
    if (tokenPromise === null) tokenPromise = getLatestToken();
    if (recentToken === null) recentToken = await tokenPromise;
    if (!cacheId || !recentToken) return;
    wsSend('syncDown', {
      token: recentToken.token,
      cacheId,
    });
  };

  wsOn('noPeers', requestSyncDown);

  initProfile().then(async (result) => {
    profile = result;
    if (!profile.assumedAuthTTL) return;
    submitedInterest = true;
    dismissedAlert = true;
    if (profile.assumedAuthTTL === 1) {
      status += ' / interest expressed';
      // check if token was granted if interested
      requestToken(profile);
      return;
    }
    $peerSyncEnabled = await checkPeerSyncEnabled();
    if (!$peerSyncEnabled) return;
    if (tokenPromise === null) tokenPromise = getLatestToken();
    if (recentToken === null) recentToken = await tokenPromise;
    if (!recentToken) {
      requestToken(profile);
      return;
    }
    const timeToCheckForRenwal =
      $secondTick < recentToken.ttl ? recentToken.ttl - $secondTick : 0;
    status = 'Authorized to sync';
    setTimeout(() => {
      status = 'Checking for renewal';
      requestToken(profile);
    }, timeToCheckForRenwal);
  });

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

  wsOn('token', async ({ token, ttl, subTTL }) => {
    await addToken({ token, ttl });
    profile.assumedAuthTTL = subTTL;
    const newProfile = await updateProfile(profile);
    peerBroadcast('sync-profiles', { data: newProfile, done: true });
    status = 'Authorized to sync';
    recentToken = { token, ttl };
    requestSyncDown();
  });

  wsOn('syncDown', async (cache: syncCache) => {
    const data: relayPkt[] = await unpackCache(cache);
    if (!data) console.log(`opps, we got a sync down but failed to unpack`);
    if (!data) return;
    for (let i = 0; i < data.length; i++) {
      await handleDataSync(data[i]);
    }
    await requestSyncDown();
  });

  wsOn('syncDone', () => {
    $syncingDown = false;
    refreshTask();
    refreshTime(false);
    loadAgenda();
  });

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

{#if $showCloudSync}
  <div class="card card-body m-1" id="cloudSyncDialog">
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
            Enter email to express interest in data sync
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
        <button
          type="button"
          on:click={toggleSettingDialog('peerSync')}
          class="btn btn-outline-dark"
        >
          Intial Peer Sync required (open peer sync)
        </button>
      </div>
    {/if}
    <ProfileList />
    <div class="row">
      <button
        class="btn btn-outline-danger"
        on:click={toggleSettingDialog('cloudSync')}
        aria-expanded="false"
        aria-controls="peerSyncDialog"
      >
        Back
      </button>
    </div>
  </div>
{/if}
