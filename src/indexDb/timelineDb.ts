// timelineDb.ts copyright 2021 Paul Beaudet MIT License
import { getDb } from './dbCore';
import type { timestampI, memStampI, timeLineData } from '../shared/interface';
import { shownStamps } from '../stores/defaultData';
import { hoursOrMinutesString } from '../components/time/timeConvert';

const addStamp = async (stamp: timestampI) => {
  const db = await getDb();
  db.add('timeline', stamp);
};

const getRecordingId = async (): Promise<string | null> => {
  const db = await getDb();
  const timeStore = db.transaction('timeline').store.index('timeOrder');
  let cursor = await timeStore.openCursor(null, 'prev');
  return cursor ? cursor.value.taskId : null;
};

const getStamps = async (end: number = 0): Promise<timeLineData> => {
  const db = await getDb();
  const timeStore = db.transaction('timeline').store.index('timeOrder');
  let cursor = await timeStore.openCursor(null, 'prev');
  if (!cursor) return { now: null, history: [] };
  const nowVal = cursor.value;
  let currentTime = Date.now();
  let rawStamps: timestampI[] = [];
  if (end) {
    // Add a reference stamp to get duration
    const range = IDBKeyRange.bound(end + 1, currentTime);
    cursor = await timeStore.openCursor(range);
    rawStamps.push(cursor.value);
  } else {
    rawStamps.push(nowVal);
  }
  const range = IDBKeyRange.bound(0, end ? end : nowVal.start - 1);
  cursor = await timeStore.openCursor(range, 'prev');
  let position = 0;
  while (cursor && position < shownStamps) {
    rawStamps.push(cursor.value);
    cursor = await cursor.continue();
    position++;
  }
  // rawStamps = rawStamps.reverse();
  let history: memStampI[] = await Promise.all(
    rawStamps.map(async (stamp) => {
      let task = await db.get('tasks', stamp.taskId);
      const { body, status } = task;
      return {
        ...stamp,
        duration: 0,
        body,
        done: status !== 'todo' ? true : false,
      };
    }),
  );
  const { body, status } = await db.get('tasks', nowVal.taskId);
  const now: memStampI = {
    ...nowVal,
    body,
    duration: currentTime - nowVal.start,
    done: status !== 'todo' ? true : false,
  };
  history = history.map((stamp) => {
    let duration = currentTime - stamp.start;
    currentTime = stamp.start;
    return {
      ...stamp,
      duration,
    };
  });
  // first entry is just used to figure duration
  history = history.slice(1);
  return {
    history,
    now,
  };
};

const editStamp = async (timestamp: timestampI) => {
  const db = await getDb();
  // check if this timestamp is taken
  const existing = await db.getFromIndex(
    'timeline',
    'timeOrder',
    timestamp.start,
  );
  // skip put operations on existing entries at this start time
  // Start time is required to be unique
  if (existing) return;
  await db.put('timeline', timestamp);
};

const incomingTimeline = async ({
  data,
  done,
}: {
  data: timestampI;
  done: boolean;
}): Promise<boolean> => {
  const db = await getDb();
  const localData = await db.get('timeline', data.id);
  if (localData) {
    if (data.lastModified > localData.lastModified) {
      await db.put('timeline', data);
    }
  } else {
    await db.add('timeline', data);
  }
  return done;
};

// TODO calculate to start of sprint properly, this wont count overlapping stamps
const compileUtilizedMillis = async (
  parentId: string,
  start: number,
  end: number = 0,
): Promise<number> => {
  end = end ? end : Date.now();
  // Top level case is just the duration of requested period
  if (parentId === '1') return end - start;
  const db = await getDb();
  const transaction = db.transaction(['timeline', 'tasks']);
  const timeIndex = transaction.objectStore('timeline').index('timeOrder');
  const taskStore = transaction.objectStore('tasks');
  const range = IDBKeyRange.bound(0, end);
  let cursor = await timeIndex.openCursor(range, 'prev');
  let lastStart = end;
  let totalUtilization = 0;
  let lastStamp = false;
  pageTruTime: while (cursor && !lastStamp) {
    if (cursor.value.start <= start) lastStamp = true;
    // figure if this timestamp is in the lineage we are curious about
    let task = await taskStore.get(cursor.value.taskId);
    checkIfDescendent: while (task) {
      if (task.id === parentId) {
        if (lastStamp) {
          // in this way task started outside window but completed within count for whats within
          totalUtilization += lastStart - start;
          break pageTruTime;
        } else {
          totalUtilization += lastStart - cursor.value.start;
          break checkIfDescendent;
        }
      }
      // not a descendent condition
      if (task.parentId === '1') break checkIfDescendent;
      task = await taskStore.get(task.parentId);
    }
    lastStart = cursor.value.start;
    cursor = await cursor.continue();
  }
  return totalUtilization;
};

// one function for page up and page down
const page = async (
  current: timeLineData,
  pageDown: boolean = false,
  increment: number = 1,
): Promise<{
  newHistory: memStampI[];
  complete: boolean;
}> => {
  let newHistory = [...current.history];
  let complete = false;
  const db = await getDb();
  const transaction = db.transaction(['timeline', 'tasks']);
  const timeIndex = transaction.objectStore('timeline').index('timeOrder');
  const taskStore = transaction.objectStore('tasks');
  let { start } = current.history[0];
  let range = IDBKeyRange.bound(start + 1, current.now.start - 1);
  if (pageDown) {
    start = current.history[current.history.length - 1].start;
    range = IDBKeyRange.bound(0, start - 1);
  }
  let cursor = await timeIndex.openCursor(range, pageDown ? 'prev' : 'next');
  while (increment && cursor) {
    const task = await taskStore.get(cursor.value.taskId);
    const { body } = task;
    const nextItem = {
      ...cursor.value,
      done: task.status !== 'todo' ? true : false,
      body,
      duration: pageDown
        ? start - cursor.value.start
        : cursor.value.start - start,
    };
    newHistory = pageDown
      ? [...newHistory, nextItem]
      : [nextItem, ...newHistory];
    start = cursor.value.start;
    newHistory = pageDown
      ? newHistory.slice(1)
      : newHistory.slice(0, shownStamps - 1);
    increment--;
    cursor = await cursor.continue();
  }
  if (!cursor) complete = true;

  return {
    newHistory,
    complete,
  };
};

const removeStamp = async (id: string) => {
  const db = await getDb();
  await db.delete('timeline', id);
};

const getUtilization = async (
  parentId: string,
  start: number,
  end: number = 0,
): Promise<string> => {
  const millis = await compileUtilizedMillis(parentId, start, end);
  if (millis) return hoursOrMinutesString(millis);
  return '0';
};

export {
  addStamp,
  getStamps,
  incomingTimeline,
  editStamp,
  compileUtilizedMillis,
  removeStamp,
  getUtilization,
  page,
  getRecordingId,
};
