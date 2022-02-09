<!-- MultiDevice Copyright 2022 Paul Beaudet MIT Licence -->
<script lang="ts">
  import type { relayPkt, syncCache } from '../../connections/connectInterface';
  import { handleDataSync } from '../../connections/dataChannels';
  import PeersPending from '../../connections/PeersPending.svelte';
  import { wsOn, wsSend } from '../../connections/WebSocket';
  import { initProfile, updateProfile } from '../../indexDb/profilesDb';
  import { getNextConnectionCacheId, unpackCache } from '../../indexDb/pskDb';
  import {
    addToken,
    getLatestToken,
    requestToken,
  } from '../../indexDb/tokenDb';
  import type { connectionI, profileI, tokenI } from '../../shared/interface';
  import {
    firstSync,
    lastDisconnect,
    peersConnected,
    peerSyncEnabled,
    syncingDown,
  } from '../../stores/peerStore';
  import {
    showMultiDevice,
    toggleSettingDialog,
  } from '../../stores/settingsStore';
  import { refreshAllViews } from '../../stores/taskStore';
  import { secondTick } from '../../stores/timeStore';
  import PeerToPeer from './PeerToPeer.svelte';
  import ProfileList from './ProfileList.svelte';
  import { getConnections, initDeviceID } from '../../indexDb/connectionDB';
  import Backup from './Backup.svelte';
  import { IDLE_RECONNECT, statusMsgs } from '../../stores/defaultData';
  import { initConnectionSignaling } from '../../connections/signaling';
  import BoxArrowInLeft from 'svelte-bootstrap-icons/lib/BoxArrowInLeft';
  import GetService from './GetService.svelte';
  import { addEvent } from '../../indexDb/eventsDb';

  let status: string = statusMsgs.noAuth;
  let profile: profileI;
  let recentToken: tokenI = null;
  let tokenPromise: Promise<tokenI> = null;
  let sharingId: string = '';
  let peers: connectionI[] = [];

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
    if (profile.assumedAuthTTL === 1) {
      // check if token was granted if interested
      requestToken(profile);
      return;
    }
    if (tokenPromise === null) tokenPromise = getLatestToken();
    if (recentToken === null) recentToken = await tokenPromise;
    if (!recentToken) {
      requestToken(profile);
      return;
    }
    const timeToCheckForRenwal =
      $secondTick < recentToken.ttl ? recentToken.ttl - $secondTick : 0;
    status = statusMsgs.auth;
    setTimeout(() => {
      status = statusMsgs.renewal;
      requestToken(profile);
    }, timeToCheckForRenwal);
  });

  const refreshConnections = async (first: boolean = false) => {
    const { id, connections } = await getConnections(first);
    peers = connections;
    sharingId = id;
  };

  wsOn('token', async ({ token, ttl, subTTL }) => {
    await addToken({ token, ttl });
    // if this was the device that expressed interest / paid its profile is the primary one
    profile = await updateProfile({
      ...profile,
      assumedAuthTTL: subTTL,
      status:
        profile.assumedAuthTTL === 1 || profile.status === 'primary'
          ? 'primary'
          : 'undecided',
    });
    status = statusMsgs.auth;
    recentToken = { token, ttl };
    // if this is the first time token is received, create a new connection id
    if (!sharingId) {
      await initDeviceID();
      await refreshConnections();
      initConnectionSignaling();
    }
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
    refreshAllViews(false);
  });

  refreshConnections();

  // This should handle both the requester and accepter
  firstSync.subscribe(async (sync) => {
    if (sync && sync.done) {
      profile = await initProfile();
      refreshConnections(true);
      $firstSync = null;
      addEvent('addConnection', { id: sync.peerId });
      toggleSettingDialog('multiDevice');
    }
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
      <GetService bind:profile {recentToken} bind:status />
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
