// statusStore.ts Copyright 2021 Paul Beaudet MIT License

import { writable, Writable } from 'svelte/store';
import type {
  generalStatus,
  specificStatus,
} from '../connections/connectInterface';
import { peersConnected, syncingDown, syncingUp } from './peerStore';

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

export { connectionStatus, syncStatus, wsOpen };
