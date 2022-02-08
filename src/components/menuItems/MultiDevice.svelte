<!-- MultiDevice Copyright 2022 Paul Beaudet MIT Licence -->
<script lang="ts">
  import type { relayPkt, syncCache } from '../../connections/connectInterface';
  import {
    handleDataSync,
    peerBroadcast,
  } from '../../connections/dataChannels';
  import PeersPending from '../../connections/PeersPending.svelte';
  import { wsOn, wsSend } from '../../connections/WebSocket';
  import {
    getPrimary,
    initProfile,
    updateProfile,
  } from '../../indexDb/profilesDb';
  import { getNextConnectionCacheId, unpackCache } from '../../indexDb/pskDb';
  import {
    addToken,
    getLatestToken,
    requestToken,
  } from '../../indexDb/tokenDb';
  import type { profileI, tokenI } from '../../shared/interface';
  import { loadAgenda } from '../../stores/agendaStore';
  import {
    lastDisconnect,
    peersConnected,
    peerSyncEnabled,
    syncingDown,
  } from '../../stores/peerStore';
  import {
    newProfile,
    showMultiDevice,
    toggleSettingDialog,
  } from '../../stores/settingsStore';
  import { refreshTask } from '../../stores/taskStore';
  import { refreshTime, secondTick } from '../../stores/timeStore';
  import PeerToPeer from './PeerToPeer.svelte';
  import ProfileList from './ProfileList.svelte';
  import { checkPeerSyncEnabled } from '../../indexDb/connectionDB';
  import Backup from './Backup.svelte';
  import { IDLE_RECONNECT } from '../../stores/defaultData';
  import { initConnectionSignaling } from '../../connections/signaling';

  let status: string = 'Not Authorized to sync';
  let submitedInterest: boolean = false;
  let dismissedAlert: boolean = false;
  let profile: profileI;
  let recentToken: tokenI = null;
  let tokenPromise: Promise<tokenI> = null;
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

  let validMail: boolean = false;
  $: validMail =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
      String(email).toLowerCase(),
    );

  const requestSyncDown = async () => {
    if ($peersConnected) return;
    const cacheId = await getNextConnectionCacheId();
    if (tokenPromise === null) tokenPromise = getLatestToken();
    if (recentToken === null) recentToken = await tokenPromise;
    if (!cacheId || !recentToken) return;
    $syncingDown = true;
    wsSend('syncDown', {
      token: recentToken.token,
      cacheId,
    });
  };

  // only request sync down after its confirmed by server no peers are online
  wsOn('noPeers', requestSyncDown);

  secondTick.subscribe((tick) => {
    if ($lastDisconnect === 0) return;
    if (tick > $lastDisconnect + IDLE_RECONNECT) {
      $lastDisconnect = 0;
      initConnectionSignaling();
    }
  });

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
</script>

{#if $showMultiDevice}
  <div class="d-flex flex-column">
    <div class="card card-body m-1 scroll" id="multiDeviceDialog">
      <PeersPending />
      <div class="row">
        <button
          class="btn btn-danger"
          on:click={toggleSettingDialog('multiDevice')}
          aria-expanded="false"
          aria-controls="peerSyncDialog"
        >
          Back
        </button>
      </div>
      <div class="row my-2">
        <p class="fs-3 text-center">Multi-device operation status</p>
        <p class="text-center">
          Express interest with the device that has the data you want to sync,
          the other will device be overwritten. Only express interest on one of
          the devices.
        </p>
      </div>
      <div class="row">
        <span class="text-center">{status}</span>
      </div>
      {#if !$peerSyncEnabled}
        <div class="row mb-1">
          <b class="text-center">
            * Intial Peer Sync required to exchange encyption keys *
          </b>
        </div>
      {/if}
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
              Enter email to express interest in multi-device
            </label>
          </div>
          <button
            type="button"
            disabled={!validMail}
            id="express-interest-button"
            on:click={signUp}
            class="btn btn-success"
          >
            Express interest
          </button>
        </div>
      {/if}
      <hr />
      <PeerToPeer />
      <hr />
      <div class="row my-2">
        <span class="fs-3 text-center"> Cloud Sync </span>
      </div>
      <div class="row mb-1">
        <p class="text-center">Beta, opt-in, invite only.</p>
        <p class="text-center">
          Sync data out of band with peer connected devices. End to End Encypted
          (EE2E) data stored in Time Intent database.
        </p>
      </div>
      <ProfileList />
      <hr />
      <Backup />
    </div>
  </div>
{/if}

<style>
  .scroll {
    overflow-y: auto;
    overflow-x: hidden;
  }
  .scroll::-webkit-scrollbar {
    width: 1.25em;
    height: 0.5em;
  }

  .scroll::-webkit-scrollbar-track {
    background: white;
  }

  .scroll::-webkit-scrollbar-thumb {
    background: grey;
  }

  .scroll::-webkit-scrollbar-thumb:hover {
    background: black;
  }

  @supports (scrollbar-color: grey white) {
    * {
      scrollbar-color: grey white;
    }
  }
</style>
