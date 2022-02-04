// timeStore.ts Copyright 2021 Paul Beaudet MIT License
import { Unsubscriber, Writable, writable } from 'svelte/store';
import { addStamp, getStamps } from '../indexDb/timelineDb';
import { createOid } from '../isomorphic/oid';
import type { timeLineData, memStampI, timestampI } from '../shared/interface';
import { arrayOfDefaults, minInMillis } from '../stores/defaultData';
import { getDurationStamp } from '../components/time/timeConvert';
import { addEvent } from '../indexDb/eventsDb';
import { reloadNextTask } from './agendaStore';

const now = Date.now();
const timeStore: Writable<timeLineData> = writable({
  now: {
    id: '0',
    taskId: '0',
    start: now,
    type: 'habit',
    lastModified: now,
    duration: null,
    body: 'Loading',
    status: 'todo',
  },
  history: [],
});

const secondTick: Writable<number> = writable(now);
const tillNextSecond = 1000 - new Date().getMilliseconds();
setTimeout(() => {
  setInterval(() => {
    secondTick.set(Date.now());
  }, 1000);
}, tillNextSecond);

const nowTimeStamp: Writable<string> = writable('00:00:00');
const nowDurationStamp: Writable<number> = writable(0);
const recordingTaskParent: Writable<string | null> = writable(null);

let secondUnsubscriber: Unsubscriber = null;
timeStore.subscribe(({ now }) => {
  reloadNextTask();
  if (secondUnsubscriber) secondUnsubscriber();
  secondUnsubscriber = secondTick.subscribe((currentTime) => {
    const duration = currentTime - now.start;
    nowDurationStamp.set(duration);
    nowTimeStamp.set(getDurationStamp(duration));
  });
});

let lastNextUpdate: number = now;
secondTick.subscribe((currentTime) => {
  const sinceLastUpdate = currentTime - lastNextUpdate;
  if (sinceLastUpdate >= minInMillis) {
    lastNextUpdate = currentTime;
    reloadNextTask();
  }
});

const newTimeStamp = async (
  taskId: string,
  body: string,
): Promise<memStampI> => {
  const now = Date.now();
  const stamp: timestampI = {
    id: createOid(),
    taskId,
    start: now,
    type: 'todo',
    lastModified: now,
  };
  await addStamp(stamp);
  addEvent('newTimestamp', { stamp });
  const inMemStamp: memStampI = {
    ...stamp,
    duration: 0,
    body,
    status: 'todo',
  };
  return inMemStamp;
};

const getTime = async () => {
  // get current running and ran task
  let { history, now } = await getStamps();
  if (!now) {
    const { body } = arrayOfDefaults[0];
    now = await newTimeStamp(body.slice(0, 24), body);
  }
  timeStore.set({
    now,
    history,
  });
};

const refreshTime = async (holdPosition: boolean = true) => {
  let end: number = 0;
  if (holdPosition) {
    timeStore.update((time) => {
      if (time.history.length) end = time.history[0].start;
      return time;
    });
  }
  timeStore.set(await getStamps(end));
};

export {
  newTimeStamp,
  getTime,
  timeStore,
  refreshTime,
  secondTick,
  nowTimeStamp,
  recordingTaskParent,
  nowDurationStamp,
};
