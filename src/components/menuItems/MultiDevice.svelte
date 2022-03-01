<!-- MultiDevice Copyright 2022 Paul Beaudet MIT Licence -->
<script lang="ts">
  import type { relayPkt, syncCache } from '../../connections/connectInterface';
  import { handleDataSync } from '../../connections/dataChannels';
  import PeersPending from '../../connections/PeersPending.svelte';
  import { wsOn, wsSend } from '../../connections/WebSocket';
  import { getProfile, updateProfile } from '../../indexDb/profilesDb';
  import { getNextConnectionCacheId, unpackCache } from '../../indexDb/pskDb';
  import { addToken } from '../../indexDb/tokenDb';
  import type { connectionI } from '../../shared/interface';
  import {
    firstSync,
    lastDisconnect,
    peersConnected,
    peerSyncEnabled,
    syncingDown,
  } from '../../stores/peerStore';
  import { refreshAllViews } from '../../stores/taskStore';
  import { secondTick } from '../../stores/timeStore';
  import PeerToPeer from './PeerToPeer.svelte';
  import ProfileList from './ProfileList.svelte';
  import { getConnections, initDeviceID } from '../../indexDb/connectionDB';
  import Backup from './Backup.svelte';
  import { IDLE_RECONNECT } from '../../stores/defaultData';
  import { initConnectionSignaling } from '../../connections/signaling';
  import BoxArrowInLeft from 'svelte-bootstrap-icons/lib/BoxArrowInLeft';
  import GetService from './GetService.svelte';
  import { addEvent } from '../../indexDb/eventsDb';
  import {
    authProfile,
    authToken,
    authStatus,
  } from '../../stores/credentialStore';
  import { showMultiDevice, toggleView } from '../../indexDb/viewStoreDb';

  let sharingId: string = '';
  let peers: connectionI[] = [];

  const requestSyncDown = async () => {
    if ($peersConnected || !authToken) return;
    const cacheId = await getNextConnectionCacheId();
    if (!cacheId) return;
    $syncingDown = true;
    wsSend('syncDown', { cacheId, token: $authToken.token });
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

  const refreshConnections = async (first: boolean = false) => {
    const { id, connections } = await getConnections(first);
    peers = connections;
    sharingId = id;
  };

  wsOn('token', async ({ token, ttl, subTTL }) => {
    await addToken({ token, ttl });
    // if this was the device that expressed interest / paid its profile is the primary one
    $authProfile = await updateProfile({
      ...$authProfile,
      assumedAuthTTL: subTTL,
      status:
        $authProfile.assumedAuthTTL === 1 || $authProfile.status === 'primary'
          ? 'primary'
          : 'undecided',
    });
    $authToken = { token, ttl };
    // if this is the first time token is received, create a new connection id
    if (!sharingId) {
      await initDeviceID($authProfile.id);
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

  // This should handle both the requester and accepter establish new primary profile
  firstSync.subscribe(async (sync) => {
    if (sync && sync.done) {
      await refreshConnections(true);
      $authProfile = await getProfile();
      $firstSync = null;
      addEvent('addConnection', { id: sync.peerId });
      toggleView('showMultiDevice');
    }
  });
</script>

{#if $showMultiDevice}
  <div class="d-flex flex-column">
    <div class="card card-body m-1 scroll" id="multiDeviceDialog">
      <div class="row my-2">
        <button
          class="col-2 btn btn-danger m-1"
          on:click={toggleView('showMultiDevice')}
          aria-expanded="false"
          aria-controls="peerSyncDialog"
        >
          <BoxArrowInLeft /> Back
        </button>
        <span class="col-8 fs-3 text-center">Multi-device Status</span>
        <p class="text-center">{$authStatus}</p>
        <p class="text-center">Ability to sync between devices</p>
      </div>
      <PeersPending />
      <GetService />
      {#if $authProfile.assumedAuthTTL > 1 && $authToken.token}
        <hr />
        <PeerToPeer bind:sharingId bind:peers />
        <hr />
        <div class="row my-2">
          <p class="fs-3 text-center">Cloud Sync</p>
          <p class="text-center">Paid Beta</p>
          {#if !$peerSyncEnabled}
            <p class="text-center">
              <b> * Intial Peer Sync required to exchange encyption keys * </b>
            </p>
          {/if}
          <p class="text-center">
            Sync data out of band with peer connected devices. End to End
            Encypted (EE2E) data stored in Time Intent database.
          </p>
        </div>
        <ProfileList />
        <hr />
        <Backup />
      {/if}
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
