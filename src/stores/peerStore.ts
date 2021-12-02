// settingsStore.ts Copyright 2021 Paul Beaudet MIT License

import { writable, Writable } from 'svelte/store';
import type { peersI } from '../connections/connectInterface';

const rtcPeers: Writable<peersI[]> = writable([]);
const peerSyncEnabled: Writable<boolean> = writable(false);
const syncingUp: Writable<boolean> = writable(false);
const syncingDown: Writable<boolean> = writable(false);

const getBooleanStatus = (state: Writable<boolean>): boolean => {
  let syncStatus = false;
  state.update((status) => {
    syncStatus = status;
    return status;
  });
  return syncStatus;
};

export { rtcPeers, peerSyncEnabled, syncingUp, syncingDown, getBooleanStatus };
