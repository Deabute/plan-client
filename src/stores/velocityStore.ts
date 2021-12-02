// velocityStore.ts Copyright 2021 Paul Beaudet MIT License
import { Writable, writable } from 'svelte/store';
import { onEvent } from '../connections/dataChannels';
import {
  getCurrentTach,
  saveTach,
  getAverageTach,
  incomingTach,
} from '../indexDb/tachDb';
import type { velocityI } from '../shared/interface';
import { startingVelocity, newTach } from './defaultData';

const tachStore: Writable<number> = writable(startingVelocity);

// Loads current velocity from storage
const loadTach = async () => {
  const storedVelocity = await getCurrentTach();
  const useTach = storedVelocity ? storedVelocity.millis : startingVelocity;
  tachStore.update((tach) => {
    return useTach;
  });
  if (!storedVelocity) {
    // should be used in case we have a blank slate.
    await saveTach(newTach(useTach));
  }
};

const recalculateTach = async () => {
  const currentTach = await getAverageTach();
  tachStore.update((tach) => {
    return currentTach;
  });
};

onEvent('sync-tach', async (packet: { data: velocityI; done: boolean }) => {
  const done = await incomingTach(packet);
  if (done) await loadTach();
});

export { tachStore, loadTach, recalculateTach };
