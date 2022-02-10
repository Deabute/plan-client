// peerStore.ts Copyright 2021-2022 Paul Beaudet MIT License

import { writable, Writable } from 'svelte/store';
import type {
  generalStatus,
  peersI,
  requesterInfo,
  specificStatus,
} from '../connections/connectInterface';

// Incoming request to approve device connections
const pendingPeers: Writable<requesterInfo[]> = writable([]);
const rtcPeers: Writable<peersI[]> = writable([]);
const lastDisconnect: Writable<number> = writable(0);
const peerSyncEnabled: Writable<boolean> = writable(false);
const peersConnected: Writable<boolean> = writable(false);
const syncingUp: Writable<boolean> = writable(false);
const syncingDown: Writable<boolean> = writable(false);
const firstSync: Writable<{
  peerId: string;
  done: boolean;
}> = writable(null);

const getBooleanStatus = (state: Writable<boolean>): boolean => {
  let syncStatus = false;
  state.update((status) => {
    syncStatus = status;
    return status;
  });
  return syncStatus;
};

rtcPeers.subscribe((peers) => {
  if (peers.length) {
    lastDisconnect.set(0);
    for (let i = 0; i < peers.length; i++) {
      if (peers[i].connected) {
        peersConnected.set(true);
        return;
      }
    }
    peersConnected.set(false);
    return;
  }
  lastDisconnect.set(Date.now());
});

const connectionStatus: Writable<generalStatus> = writable('Disconnected');
const syncStatus: Writable<specificStatus> = writable('Idle');
const wsOpen: Writable<boolean> = writable(false);

peersConnected.subscribe((connected) => {
  // Note that onLine doesn't assure connectivity in many cases
  // further conditions need to be tested, but this good enough for this transition
  let newStatus: generalStatus = connected
    ? 'P2P'
    : !navigator.onLine
    ? 'Offline'
    : 'Cloud';
  connectionStatus.set(newStatus);
});

window.addEventListener('offline', () => {
  connectionStatus.set('Offline');
});

window.addEventListener('online', () => {
  connectionStatus.set('Cloud');
});

syncingDown.subscribe((syncing) => {
  syncStatus.set(syncing ? 'Syncing' : 'Idle');
});

syncingUp.subscribe((syncing) => {
  syncStatus.set(syncing ? 'Pending Upload' : 'Idle');
});

wsOpen.subscribe((socketOn) => {
  connectionStatus.update((status) => {
    if (status === 'P2P') return status;
    if (socketOn) return 'Cloud';
    return 'Disconnected';
  });
});

export {
  rtcPeers,
  peerSyncEnabled,
  syncingUp,
  syncingDown,
  getBooleanStatus,
  firstSync,
  peersConnected,
  lastDisconnect,
  syncStatus,
  connectionStatus,
  wsOpen,
  pendingPeers,
};
