<!-- PeersPending ~ Copyright 2021 Paul Beaudet MIT License -->
<script lang="ts">
  import { newConnection } from '../indexDb/connectionDB';
  import { setPrimary } from '../indexDb/profilesDb';
  import { peerSyncEnabled } from '../stores/peerStore';
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
      if (!thisDevice) await setPrimary();
      // this device refers to the other in this instance
      await newConnection(requester);
      makeOfferOnApproval(requester, sig, deviceCert);
      // if thisDevice set other device profile as primary
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
