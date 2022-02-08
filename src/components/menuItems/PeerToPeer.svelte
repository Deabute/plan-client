<!-- PeerToPeer ~ Copyright 2021 Paul Beaudet MIT License -->
<script lang="ts">
  import { getHumanReadableStamp } from '../time/timeConvert';
  import { getAnnouncement } from '../../connections/crypto';
  import { wsSend } from '../../connections/WebSocket';
  import {
    checkExisting,
    deleteConnection,
    getConnections,
    newConnection,
  } from '../../indexDb/connectionDB';
  import { addEvent } from '../../indexDb/eventsDb';
  import { setPrimary } from '../../indexDb/profilesDb';
  import type { connectionI } from '../../shared/interface';
  import { firstSync, peerSyncEnabled } from '../../stores/peerStore';
  import { toggleSettingDialog } from '../../stores/settingsStore';

  export let sharingId: string = '';
  export let peers: connectionI[] = [];
  let newPeer: string = '';
  let valid = false;

  const ID_LENGTH = 71;

  const validPeer = async (peer: string): Promise<boolean> => {
    // Limit number of connections to one
    if (peers.length > 1) return false;
    // if not equal to required characters
    if (peer.length !== ID_LENGTH) return false;
    // check for existing connection with this ID
    const existing = await checkExisting(peer.toUpperCase());
    return existing ? false : true;
  };

  $: validPeer(newPeer).then((isValid) => {
    valid = isValid;
  });

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
  firstSync.subscribe(async (sync) => {
    if (sync && sync.done) {
      addEvent('addConnection', { id: sync.peerId });
      peers = (await getConnections()).connections;
      $firstSync = null;
      toggleSettingDialog('multiDevice');
    }
  });

  const removePeer = (peerId: string) => {
    // returns onclick event with peerId in closure
    return async () => {
      await deleteConnection(peerId);
      await addEvent('removeConnection', { id: peerId });
      peers = (await getConnections()).connections;
      // todo: only do this if last peer removed
      $peerSyncEnabled = false;
    };
  };
</script>

<div class="row mb-2">
  <span class="fs-3 text-center"> Real-time Sync </span>
</div>
<div class="row mb-1">
  <p class="text-center">Paid beta: Invite only</p>
  <p class="text-center">
    Sync data peer to peer when both clients are active. WebRTC, Real Time Chat
    data channel connection between both clients, data stored only on your
    devices.
  </p>
</div>
{#if sharingId}
  <div class="row gy-2 mb-1">
    <p class="text-center">{`This device's ID: ${sharingId}`}</p>
  </div>
  {#if peers.length < 1}
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
  {#each peers as peer, i}
    <div class="card">
      <div class="card-body row gy-1">
        <button
          class="btn btn-outline-dark col-1"
          on:click={removePeer(peer.id)}
        >
          🗑️
        </button>
        <span class="col-7">
          {i + 1}- Name: {peer.deviceName}
        </span>
        <span class="col-4">
          Last sync: {peer.lastConnect
            ? getHumanReadableStamp(peer.lastConnect)
            : 'Never'}
        </span>
      </div>
    </div>
  {/each}
{/if}
