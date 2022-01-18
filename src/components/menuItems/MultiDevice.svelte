<!-- MultiDevice Copyright 2022 Paul Beaudet MIT Licence -->
<script lang="ts">
  import type { relayPkt, syncCache } from '../../connections/connectInterface';

  import {
    handleDataSync,
    peerBroadcast,
  } from '../../connections/dataChannels';
  import PeersPending from '../../connections/PeersPending.svelte';
  import { wsOn, wsSend } from '../../connections/WebSocket';
  import { checkPeerSyncEnabled } from '../../indexDb/connectionDB';
  import { initProfile, updateProfile } from '../../indexDb/profilesDb';
  import { getNextConnectionCacheId, unpackCache } from '../../indexDb/pskDb';
  import {
    addToken,
    getLatestToken,
    requestToken,
  } from '../../indexDb/tokenDb';
  import type { profileI, tokenI } from '../../shared/interface';
  import { loadAgenda } from '../../stores/agendaStore';
  import {
    peersConnected,
    peerSyncEnabled,
    syncingDown,
  } from '../../stores/peerStore';
  import {
    showMultiDevice,
    toggleSettingDialog,
  } from '../../stores/settingsStore';
  import { refreshTask } from '../../stores/taskStore';
  import { refreshTime, secondTick } from '../../stores/timeStore';
  import CloudSync from './CloudSync.svelte';
  import PeerToPeer from './PeerToPeer.svelte';
  import ProfileList from './ProfileList.svelte';

  let status: string = 'Not Authorized to sync';
  let submitedInterest: boolean = false;
  let dismissedAlert: boolean = false;
  let profile: profileI;
  let recentToken: tokenI = null;
  let tokenPromise: Promise<tokenI> = null;

  const requestSyncDown = async () => {
    if (peersConnected()) return;
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
  <div class="card card-body m-1" id="multiDeviceDialog">
    <PeersPending />
    <PeerToPeer />
    <CloudSync
      bind:status
      bind:submitedInterest
      bind:dismissedAlert
      bind:profile
    />
    <ProfileList />
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
  </div>
{/if}
