// timeStore.ts Copyright 2021 Paul Beaudet MIT License
import { Unsubscriber, Writable, writable } from 'svelte/store';
import { onEvent } from '../connections/dataChannels';
import { incomingTimeline } from '../indexDb/timelineDb';
import { addStamp, getStamps } from '../indexDb/timelineDb';
import { createOid } from '../isomorphic/oid';
import type {
  memTaskI,
  taskListData,
  timeLineData,
  memStampI,
  taskI,
  timestampI,
} from '../shared/interface';
import { defaultNow, minInMillis } from '../stores/defaultData';
import { getDurationStamp } from '../components/time/timeConvert';
import { addEvent } from '../indexDb/eventsDb';

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

const minuteTick: Writable<number> = writable(now);
const tillNextMinute = 60 - new Date().getSeconds();
setTimeout(() => {
  setInterval(() => {
    minuteTick.set(Date.now());
  }, minInMillis);
}, tillNextMinute * 1000);

const nowTimeStamp: Writable<string> = writable('00:00:00');
const nowDurationStamp: Writable<number> = writable(0);
const recordingTaskParent: Writable<string | null> = writable(null);

let secondUnsubscriber: Unsubscriber = null;
timeStore.subscribe(({ now }) => {
  if (secondUnsubscriber) secondUnsubscriber();
  secondUnsubscriber = secondTick.subscribe((currentTime) => {
    const duration = currentTime - now.start;
    nowDurationStamp.set(duration);
    nowTimeStamp.set(getDurationStamp(duration));
  });
});

const newTimeStamp = ({ id, body, effort }: taskI): memStampI => {
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
    effort,
    done: false,
  };
  // peerBroadcast('record', { data: inMemStamp });
  return inMemStamp;
};

const getTime = async (taskStore: taskListData) => {
  // get current running and ran task
  const { history, now } = await getStamps();
  timeStore.update((time) => {
    if (history.length) {
      return {
        now,
        history,
      };
    }
    // if there isn't one create one
    // Start recording highest priority task
    const task = taskStore.tasks[0]?.topChild
      ? taskStore.tasks[0].topChild
      : taskStore.tasks[0];
    time.now = newTimeStamp(task);
    return time;
  });
};

const refreshTime = async (sticky: boolean = true) => {
  let end: number = 0;
  if (sticky) {
    timeStore.update((time) => {
      end = time.history[0].start;
      return time;
    });
  }
  //  else {
  //   end = Date.now() + 1000;
  // }
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

const remoteRecord = async ({ data }: { data: memStampI }) => {
  const { id, taskId, start, type, lastModified } = data;
  await addStamp({
    id,
    taskId,
    start,
    type,
    lastModified,
  });
  timeStore.update((time) => {
    time.history = [
      { ...time.now, duration: Date.now() - time.now.start },
      ...time.history,
    ];
    // History overflow hide (in memory)
    if (time.history.length > 8) {
      time.history.pop();
    }
    time.now = data;
    return time;
  });
};

onEvent('record', remoteRecord);

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
    if (time.history.length > 8) {
      time.history.pop();
    }
    time.now = newTimeStamp(refTask);
    return time;
  });
};

onEvent('sync-timeline', async (req: { done: boolean; data: timestampI }) => {
  const done = await incomingTimeline(req);
  if (done) {
    await refreshTime();
  }
});

export {
  newTimeStamp,
  getTime,
  timeStore,
  recordTime,
  refreshTime,
  secondTick,
  minuteTick,
  nowTimeStamp,
  recordingTaskParent,
  nowDurationStamp,
};
