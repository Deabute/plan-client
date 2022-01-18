// settingsStore.ts Copyright 2021 Paul Beaudet MIT License

import { get, writable, Writable } from 'svelte/store';
import type { peersI } from '../connections/connectInterface';

const rtcPeers: Writable<peersI[]> = writable([]);
const peerSyncEnabled: Writable<boolean> = writable(false);
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

const peersConnected = (): boolean => {
  const peers = get(rtcPeers);
  for (let i = 0; i < peers.length; i++) {
    if (peers[i].connected) return true;
  }
  return false;
};

export {
  rtcPeers,
  peerSyncEnabled,
  syncingUp,
  syncingDown,
  getBooleanStatus,
  firstSync,
  peersConnected,
};
