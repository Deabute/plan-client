<!-- PeersPending ~ Copyright 2021 Paul Beaudet MIT License -->
<script lang="ts">
  import { newConnection } from '../indexDb/connectionDB';
  import { removeDataToBeSecondary } from '../indexDb/profilesDb';
  import {
    firstSync,
    peerSyncEnabled,
    pendingPeers,
  } from '../stores/peerStore';
  import type { requesterInfo } from './connectInterface';
  import { makeOfferOnApproval } from './signaling';

  const onApproval = ({
    requester,
    sig,
    deviceCert,
    rmData,
  }: requesterInfo) => {
    return async () => {
      $firstSync = { peerId: requester, done: false };
      if (rmData) await removeDataToBeSecondary();
      await newConnection(requester);
      makeOfferOnApproval(requester, sig, deviceCert);
      $pendingPeers = $pendingPeers.filter((p) => p.requester !== requester);
      $peerSyncEnabled = true;
    };
  };

  const onDeny = (peerId: string) => {
    return () => {
      $pendingPeers = $pendingPeers.filter((p) => p.requester !== peerId);
    };
  };
</script>

{#if $pendingPeers.length}
  {#each $pendingPeers as peer}
    <span>
      {`Do you trust device ${peer.requester} to sync ${
        peer.rmData ? "it's data to this device" : "this device's data to it"
      } ?`}
    </span>
    <button class="btn btn-outline-dark" on:click={onApproval(peer)}>
      Approve
    </button>
    <button class="btn btn-outline-dark" on:click={onDeny(peer.requester)}>
      Deny
    </button>
  {/each}
{/if}
