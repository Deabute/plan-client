<!-- PeersPending ~ Copyright 2021 Paul Beaudet MIT License -->
<script lang="ts">
  import { newConnection } from '../indexDb/connectionDB';
  import { setPrimary } from '../indexDb/profilesDb';
  import { firstSync, peerSyncEnabled } from '../stores/peerStore';
  import { pendingPeers } from '../stores/settingsStore';
  import type { requesterInfo } from './connectInterface';
  import { makeOfferOnApproval } from './signaling';

  const onApproval = ({
    requester,
    sig,
    deviceCert,
    thisDevice,
  }: requesterInfo) => {
    return async () => {
      $firstSync = {
        peerId: requester,
        isPrimary: !thisDevice,
        done: false,
      };
      await setPrimary(!thisDevice);
      // "thisDevice" refers to the other device here, just passing the prop from initiator
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
  <div class="card m-1">
    <div class="card-body">
      {#each $pendingPeers as peer}
        <span>
          {`Do you trust device ${peer.requester} to sync ${
            peer.thisDevice
              ? "it's data to this device"
              : "this device's data to it"
          } ?`}
        </span>
        <button class="btn btn-outline-dark" on:click={onApproval(peer)}>
          Approve
        </button>
        <button class="btn btn-outline-dark" on:click={onDeny(peer.requester)}>
          Deny
        </button>
      {/each}
    </div>
  </div>
{/if}
