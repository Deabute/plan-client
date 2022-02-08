// peerStore.ts Copyright 2021-2022 Paul Beaudet MIT License

import { writable, Writable } from 'svelte/store';
import type { peersI } from '../connections/connectInterface';

const rtcPeers: Writable<peersI[]> = writable([]);
const lastDisconnect: Writable<number> = writable(0);
const peerSyncEnabled: Writable<boolean> = writable(false);
const peersConnected: Writable<boolean> = writable(false);
const syncingUp: Writable<boolean> = writable(false);
const syncingDown: Writable<boolean> = writable(false);
const firstSync: Writable<{
  peerId: string;
  isPrimary: boolean;
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

export {
  rtcPeers,
  peerSyncEnabled,
  syncingUp,
  syncingDown,
  getBooleanStatus,
  firstSync,
  peersConnected,
  lastDisconnect,
};
