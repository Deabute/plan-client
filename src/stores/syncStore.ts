// syncStore.ts Copyright 2021 Paul Beaudet MIT License
import { Writable, writable } from 'svelte/store';
import { dayInMillis, INACTIVE_MILLIS } from './defaultData';

const DAILY_SYNC_LIMIT = 80;
let newStart = Date.now();
// LastSync will trigger sync event on subscription
const lastSync: Writable<number> = writable(newStart);
const totalSyncsToday: Writable<number> = writable(0);

// shows last activity
const activityStore: Writable<number> = writable(newStart);
const clientActive: Writable<boolean> = writable(true);

const syncAttemptAndCount = () => {
  const now = Date.now();
  let active = true;
  let newDay = false;
  if (newStart + dayInMillis > now) {
    newDay = true;
    newStart = now;
  }
  activityStore.update((activityTime) => {
    if (now - activityTime > INACTIVE_MILLIS) active = false;
    return activityTime;
  });
  clientActive.set(active);
  if (active) {
    totalSyncsToday.update((syncs) => {
      if (syncs <= DAILY_SYNC_LIMIT) lastSync.set(now);
      else syncs = syncs + 1;
      return newDay ? 0 : syncs;
    });
  }
};

// registers activity
const activityPing = () => {
  activityStore.set(Date.now());
};

const syncAttempt = () => {
  setTimeout(() => {
    syncAttemptAndCount();
    syncAttempt();
  }, INACTIVE_MILLIS);
};

syncAttempt();

export { lastSync, totalSyncsToday, activityPing };
