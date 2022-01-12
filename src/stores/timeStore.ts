// timeStore.ts Copyright 2021 Paul Beaudet MIT License
import { Unsubscriber, Writable, writable } from 'svelte/store';
import { addStamp, getStamps } from '../indexDb/timelineDb';
import { createOid } from '../isomorphic/oid';
import type {
  memTaskI,
  timeLineData,
  memStampI,
  taskI,
  timestampI,
} from '../shared/interface';
import {
  arrayOfDefaults,
  defaultNow,
  genesisTask,
  minInMillis,
} from '../stores/defaultData';
import { getDurationStamp } from '../components/time/timeConvert';
import { addEvent } from '../indexDb/eventsDb';
import { reloadNextTask } from './agendaStore';

const defaultHistory: memStampI[] = [];
const timeStore: Writable<timeLineData> = writable({
  now: defaultNow,
  history: defaultHistory,
});

const now = Date.now();
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

const newTimeStamp = ({ id, body }: taskI): memStampI => {
  const now = Date.now();
  const stamp: timestampI = {
    id: createOid(),
    taskId: id,
    start: now,
    type: 'todo',
    lastModified: now,
  };
  addStamp(stamp); // async fire and forget
  addEvent('newTimestamp', { stamp });
  const inMemStamp: memStampI = {
    ...stamp,
    duration: 0,
    body,
    done: false,
  };
  return inMemStamp;
};

const getTime = async () => {
  // get current running and ran task
  let { history, now } = await getStamps();
  if (!now) {
    const { body } = arrayOfDefaults[0];
    now = newTimeStamp({ ...genesisTask, id: body.slice(0, 24), body });
  }
  timeStore.set({
    now,
    history,
  });
};

const refreshTime = async (sticky: boolean = true) => {
  let end: number = 0;
  if (sticky) {
    timeStore.update((time) => {
      if (time.history.length) end = time.history[0].start;
      return time;
    });
  }
  const { history, now } = await getStamps(end);
  timeStore.update((time) => {
    if (!history.length) return time;
    // What about the case where user deletes all history?
    return {
      now,
      history,
    };
  });
};

const recordTime = (task: memTaskI) => {
  const { topChild, ...baseTask } = task;
  const refTask = task.topChild ? topChild : baseTask;
  timeStore.update((time) => {
    // no need to record the same task multiple times in a row
    if (time.now.taskId === refTask.id) return time;
    time.history = [
      { ...time.now, duration: Date.now() - time.now.start },
      ...time.history,
    ];
    // History overflow hide (in memory)
    if (time.history.length > 8) time.history.pop();
    time.now = newTimeStamp(refTask);
    return time;
  });
};

export {
  newTimeStamp,
  getTime,
  timeStore,
  recordTime,
  refreshTime,
  secondTick,
  nowTimeStamp,
  recordingTaskParent,
  nowDurationStamp,
};
