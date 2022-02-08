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
  import type { connectionI, profileI, tokenI } from '../../shared/interface';
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
  import {
    checkPeerSyncEnabled,
    getConnections,
    initDeviceID,
  } from '../../indexDb/connectionDB';
  import Backup from './Backup.svelte';
  import { IDLE_RECONNECT } from '../../stores/defaultData';
  import { initConnectionSignaling } from '../../connections/signaling';
  import BoxArrowInLeft from 'svelte-bootstrap-icons/lib/BoxArrowInLeft';

  let status: string = 'Not Authorized to sync';
  let submitedInterest: boolean = false;
  let dismissedAlert: boolean = false;
  let profile: profileI;
  let recentToken: tokenI = null;
  let tokenPromise: Promise<tokenI> = null;
  let email: string = '';
  let sharingId: string = '';
  let peers: connectionI[] = [];
  const interestExpressed: string = 'Interest expressed (Not yet authorized)';
  let inviteMode: boolean = true;
  let password: string = '';

  const connect = async () => {
    wsSend('login', {
      email,
      password,
    });
  };

  const signUpOrConnect = async () => {
    if (!profile) {
      status = 'No profile set (Not authorized to sync)';
      return;
    }
    if (!inviteMode) {
      connect();
      return;
    }
    status = interestExpressed;
    submitedInterest = true;
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
        status = interestExpressed;
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
      status = interestExpressed;
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
    // if this is the first time token is received, create a new connection id
    if (!sharingId) {
      await initDeviceID();
      const { id, connections } = await getConnections();
      peers = connections;
      sharingId = id;
    }
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

  getConnections().then(({ connections, id }) => {
    peers = connections;
    sharingId = id;
  });
</script>

{#if $showMultiDevice}
  <div class="d-flex flex-column">
    <div class="card card-body m-1 scroll" id="multiDeviceDialog">
      <PeersPending />
      <div class="row my-2">
        <button
          class="col-2 btn btn-danger m-1"
          on:click={toggleSettingDialog('multiDevice')}
          aria-expanded="false"
          aria-controls="peerSyncDialog"
        >
          <BoxArrowInLeft /> Back
        </button>
        <span class="col-8 fs-3 text-center">Multi-device operation status</span
        >
        <p class="text-center">{status}</p>
        <p class="text-center">
          Express interest with the device that has the data you want to sync,
          the other will device be overwritten. Only express interest on one of
          the devices.
        </p>
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
      {#if !submitedInterest && profile}
        <div class="row mb-1">
          {#if inviteMode}
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
          {:else}
            <div class="form-floating mb3 gy-2">
              <input
                type="text"
                class="form-control"
                id="new-peer-input"
                placeholder="Add Sync Peer ID"
                bind:value={email}
                aria-describedby="add-peer-button"
                aria-label="Add peer ID to sync"
              />
              <label for="new-peer-input">Invited Email</label>
            </div>
            <div class="form-floating mb3 gy-2">
              <input
                type="password"
                class="form-control"
                id="new-peer-input"
                placeholder="Add Sync Peer ID"
                bind:value={password}
                aria-describedby="add-peer-button"
                aria-label="Add peer ID to sync"
              />
              <label for="new-peer-input">Password</label>
            </div>
          {/if}
          <div class="row mt-1">
            <button
              type="button"
              disabled={!validMail}
              id="express-interest-button"
              on:click={signUpOrConnect}
              class={`m-1 col-auto btn btn-${
                validMail ? 'success' : 'secondary'
              }`}
            >
              {inviteMode ? 'Express interest' : 'Connect'}
            </button>
            <button
              type="button"
              id="switch-to-invite-mode"
              on:click={() => {
                inviteMode = !inviteMode;
              }}
              class="col-auto btn btn-info m-1"
            >
              {inviteMode ? 'Log-in instead' : 'Get Invite instead'}
            </button>
          </div>
        </div>
      {/if}
      <hr />
      <PeerToPeer bind:sharingId bind:peers />
      <hr />
      <div class="row my-2">
        <p class="fs-3 text-center">Cloud Sync</p>
        <p class="text-center">Paid Beta: Invite Only</p>
        {#if !$peerSyncEnabled}
          <p class="text-center">
            <b> * Intial Peer Sync required to exchange encyption keys * </b>
          </p>
        {/if}
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
