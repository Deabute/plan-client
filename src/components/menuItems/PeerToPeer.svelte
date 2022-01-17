<!-- PeerToPeer ~ Copyright 2021 Paul Beaudet MIT License -->
<script lang="ts">
  import ProfileList from './ProfileList.svelte';
  import { getHumanReadableStamp } from '../time/timeConvert';
  import { getAnnouncement } from '../../connections/crypto';
  import { initConnectionSignaling } from '../../connections/signaling';
  import { wsSend } from '../../connections/WebSocket';
  import {
    checkExisting,
    deleteConnection,
    getConnectionCursor,
    initDeviceID,
    newConnection,
  } from '../../indexDb/connectionDB';
  import { addEvent } from '../../indexDb/eventsDb';
  import { setPrimary } from '../../indexDb/profilesDb';
  import type { IDBPCursorWithValue, PlanDB } from '../../shared/interface';
  import { firstSync, peerSyncEnabled } from '../../stores/peerStore';
  import {
    showPeerSync,
    toggleSettingDialog,
  } from '../../stores/settingsStore';

  let sharingId: string = '';
  let connectionArray = [];
  let newPeer: string = '';
  let cursor: Promise<
    IDBPCursorWithValue<PlanDB, ['connect'], 'connect', unknown, 'readonly'>
  >;

  const ID_LENGTH = 71;

  const refreshPeers = () => {
    cursor = getConnectionCursor();
    getConnections();
  };

  const getConnections = async () => {
    const result = await cursor;
    if (!result) {
      // no more results base case
      return;
    }
    if (result.value.deviceKey === '') {
      connectionArray = [
        ...connectionArray,
        {
          id: result.value.id,
          name: result.value.deviceName,
          last: result.value.lastConnect,
        },
      ];
    } else {
      sharingId = result.value.id;
    }
    cursor = result.continue();
    getConnections();
  };

  const validPeer = async (peer: string): Promise<boolean> => {
    // Limit number of connections to one
    if (connectionArray.length > 1) return false;
    // if not equal to required characters
    if (peer.length !== ID_LENGTH) return false;
    // check for existing connection with this ID
    const existing = await checkExisting(peer.toUpperCase());
    return existing ? false : true;
  };

  const addPeer = (isPrimary: boolean = true) => {
    return async () => {
      await setPrimary(isPrimary); // will set to undecided if previously set
      const peerId = newPeer.toUpperCase();
      await newConnection(peerId);
      const annoucement = await getAnnouncement(isPrimary);
      annoucement.peers = [peerId];
      wsSend('addPeer', annoucement);
      $firstSync = { peerId, isPrimary, done: false };
      newPeer = '';
      $peerSyncEnabled = true;
    };
  };

  // This should handle both the requester and accepter
  firstSync.subscribe((sync) => {
    if (sync && sync.done) {
      addEvent('addConnection', { id: sync.peerId });
      connectionArray = [];
      refreshPeers();
      $firstSync = null;
      $showPeerSync = false;
    }
  });

  const removePeer = (peerId: string) => {
    // returns onclick event with peerId in closure
    return async () => {
      await deleteConnection(peerId);
      await addEvent('removeConnection', { id: peerId });
      connectionArray = [];
      refreshPeers();
      // todo: only do this if last peer removed
      $peerSyncEnabled = false;
    };
  };

  const optIn = async () => {
    await initDeviceID();
    initConnectionSignaling();
    // Set up websocket connection, because it only got set up if opt-in
    addEvent('peerSyncOptIn', { id: '', optIn: true });
    refreshPeers();
  };

  refreshPeers();
</script>

{#if $showPeerSync}
  <div class="card card-body m-1" id="peerSyncDialog">
    {#if sharingId}
      <div class="row gy-2 mb-1">
        <span class="col-3">This device's ID</span>
        <span class="col-9">{sharingId}</span>
      </div>
      <!-- put a copy button here -->
      {#if connectionArray.length < 1}
        <div class="form-floating mb3 gy-2">
          <input
            type="text"
            class="form-control"
            id="new-peer-input"
            maxlength={ID_LENGTH}
            size={ID_LENGTH}
            placeholder="Add Sync Peer ID"
            bind:value={newPeer}
            aria-describedby="add-peer-button"
            aria-label="Add peer ID to sync"
          />
          <label for="new-peer-input">Add peer ID to sync</label>
        </div>
      {/if}
      {#await validPeer(newPeer) then valid}
        {#if valid}
          <div class="text-center mt-1">
            <span class="fs-5">Add Sync Peer: with </span>
            <button
              class="btn btn-outline-dark gy-2"
              on:click={addPeer()}
              type="button"
              id="add-peer-button"
            >
              this device's profile
            </button>
            <button
              class="btn btn-outline-dark gy-2"
              on:click={addPeer(false)}
              type="button"
              id="add-peer-button"
            >
              it's profile
            </button>
          </div>
        {/if}
      {/await}
      {#each connectionArray as connection, i}
        <div class="card">
          <div class="card-body row gy-1">
            <button
              class="btn btn-outline-dark col-1"
              on:click={removePeer(connection.id)}
            >
              🗑️
            </button>
            <span class="col-7">
              {i + 1}- Name: {connection.name}
            </span>
            <span class="col-4">
              Last sync: {connection.last
                ? getHumanReadableStamp(connection.last)
                : 'Never'}
            </span>
          </div>
        </div>
      {/each}
    {:else}
      <div class="row gy-2">
        <button class="btn btn-outline-dark" on:click={optIn}>
          Turn on peer connections
        </button>
      </div>
    {/if}
    <ProfileList />
    <div class="row gy-2 mt-1">
      <button
        class="btn btn-outline-danger"
        on:click={toggleSettingDialog('peerSync')}
        aria-expanded="false"
        aria-controls="peerSyncDialog"
      >
        Back
      </button>
    </div>
  </div>
{/if}
