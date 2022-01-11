// timelineDb.ts copyright 2021 Paul Beaudet MIT License
import { getDb } from './dbCore';
import type {
  timestampI,
  memStampI,
  timeLineData,
  taskI,
} from '../shared/interface';
import { shownStamps } from '../stores/defaultData';

const changeUtilization = async (
  increment: boolean,
  tasks: any, // wish it was easier to understand this type
  duration: number,
  originTaskId: string,
) => {
  let task = await tasks.get(originTaskId);
  while (task) {
    let utilization = increment
      ? task.utilization + duration
      : task.utilization - duration;
    await tasks.put({ ...task, utilization });
    if (task.parentId === '1') break;
    task = await tasks.get(task.parentId);
  }
};

const moveUtilization = async (srcTask: taskI | string, destParent: string) => {
  const db = await getDb();
  const transaction = db.transaction('tasks', 'readwrite');
  const tasks = transaction.objectStore('tasks');
  const task = typeof srcTask === 'string' ? await tasks.get(srcTask) : srcTask;
  if (destParent !== '1') {
    changeUtilization(true, tasks, task.utilization, destParent);
  }
  if (task.parentId !== '1') {
    changeUtilization(false, tasks, task.utilization, task.parentId);
  }
};

const addStamp = async (stamp: timestampI) => {
  const db = await getDb();
  const transaction = db.transaction(['timeline', 'tasks'], 'readwrite');
  const timeline = transaction.objectStore('timeline');
  const tasks = transaction.objectStore('tasks');
  const timeOrder = timeline.index('timeOrder');
  let cursor = await timeOrder.openCursor(null, 'prev');
  if (cursor) {
    // add this new duration to lineage utilization
    const duration = stamp.start - cursor.value.start;
    changeUtilization(true, tasks, duration, cursor.value.taskId);
  }
  timeline.add(stamp);
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

const figureSprintValues = async () => {
  const end = Date.now();
  const db = await getDb();
  const transaction = db.transaction(
    ['timeline', 'tasks', 'budget'],
    'readwrite',
  );
  const timeIndex = transaction.objectStore('timeline').index('timeOrder');
  const tasks = transaction.objectStore('tasks');
  const budgetIndex = transaction.objectStore('budget').index('budgetOrder');
  // zero out old values
  let tCursor = await tasks.openCursor();
  while (tCursor) {
    tCursor.update({
      ...tCursor.value,
      utilization: 0,
      count: 0,
    });
    await tCursor.continue();
  }
  // Get start time
  let bCursor = await budgetIndex.openCursor(null, 'prev');
  if (!bCursor) return;
  const { start } = bCursor.value;
  // traverse timeline and count current utilization along the way
  const range = IDBKeyRange.bound(0, end);
  let cursor = await timeIndex.openCursor(range, 'prev');
  if (!cursor) return; // no time stamps to compile
  let lastStart = cursor.value.start;
  let lastStamp = false;
  cursor = await cursor.continue(); // skip to first complete time stamp
  while (cursor && !lastStamp) {
    // For every timestamp this sprint
    if (cursor.value.start <= start) lastStamp = true;
    const startToSubtract = lastStamp ? start : cursor.value.start;
    const change = lastStart - startToSubtract;
    await changeUtilization(true, tasks, change, cursor.value.taskId);
    lastStart = cursor.value.start;
    cursor = await cursor.continue();
  }
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
  const transaction = db.transaction(['timeline', 'tasks'], 'readwrite');
  const timeStore = transaction.objectStore('timeline');
  const tasks = transaction.objectStore('tasks');
  const timeIndex = timeStore.index('timeOrder');
  const { start, taskId } = await timeStore.get(id);
  let nextRange = IDBKeyRange.bound(start, Infinity, true, true);
  let prevRange = IDBKeyRange.bound(0, start, true, true);
  let cursor = await timeIndex.openCursor(nextRange);
  const nextStamp = cursor.value;
  cursor = await timeIndex.openCursor(prevRange, 'prev');
  const prevStamp = cursor ? cursor.value : null;
  const change = nextStamp.start - start;
  if (prevStamp) {
    // add extra to previous stamp's task and ancestors
    await changeUtilization(true, tasks, change, prevStamp.taskId);
  }
  // remove from task of old stamp
  await changeUtilization(false, tasks, change, taskId);
  // finally remove the stamp
  await timeStore.delete(id);
};

const editStamp = async (timestamp: timestampI) => {
  const db = await getDb();
  const transaction = db.transaction(['timeline', 'tasks'], 'readwrite');
  const timeStore = transaction.objectStore('timeline');
  const timeIndex = timeStore.index('timeOrder');
  // if timestamp taken abort, unique requirement: Validation
  if (await timeIndex.get(timestamp.start)) return;
  // figure change in utilization
  const tasks = transaction.objectStore('tasks');
  const oStart = (await timeStore.get(timestamp.id)).start;
  let oldNextRange = IDBKeyRange.bound(oStart, Infinity, true, true);
  let oldPrevRange = IDBKeyRange.bound(0, oStart, true, true);
  let newNextRange = IDBKeyRange.bound(timestamp.start, Infinity, true, true);
  let newPrevRange = IDBKeyRange.bound(0, timestamp.start, true, true);
  let cursor = await timeIndex.openCursor(oldNextRange);
  const now = Date.now();
  const oldNextStart = cursor ? cursor.value.start : now;
  cursor = await timeIndex.openCursor(oldPrevRange, 'prev');
  const oldPrevStamp = cursor ? cursor.value : null;
  cursor = await timeIndex.openCursor(newNextRange);
  const newNextStart = cursor ? cursor.value.start : now;
  cursor = await timeIndex.openCursor(newPrevRange, 'prev');
  const newPrevStamp = cursor ? cursor.value : null;

  const greater = timestamp.start > oStart ? true : false;
  if (newNextStart === oldNextStart) {
    const change = greater
      ? timestamp.start - oStart
      : oStart - timestamp.start;
    if (newPrevStamp === oldPrevStamp) {
      if (newPrevStamp) {
        // start-start / add rm prev
        await changeUtilization(greater, tasks, change, newPrevStamp.taskId);
      }
      await changeUtilization(!greater, tasks, change, timestamp.taskId);
      // interframe / add rm task
    }
  } else {
    const oldSize = oldPrevStamp ? oStart - oldPrevStamp.start : 0;
    const newSize = newPrevStamp ? oStart - newPrevStamp.start : 0;
    const increase = oldSize < newSize ? true : false;
    const diff = oldSize < newSize ? newSize - oldSize : oldSize - newSize;
    const moveFromChange = oldPrevStamp ? oStart - oldPrevStamp.start : 0;
    // pre-start / add rm task / add old prev
    if (moveFromChange) {
      await changeUtilization(true, tasks, moveFromChange, oldPrevStamp.taskId);
    }
    if (oldSize !== newSize) {
      await changeUtilization(increase, tasks, diff, timestamp.taskId);
    }

    if (newPrevStamp) {
      // move / rm new prev
      const prevSize = newNextStart - newPrevStamp.start;
      const prevChange =
        newSize > prevSize ? newSize - prevSize : prevSize - newSize;
      await changeUtilization(false, tasks, prevChange, newPrevStamp.taskId);
    }
  }
  // The actual edit
  await timeStore.put(timestamp);
};

export {
  addStamp,
  getStamps,
  incomingTimeline,
  editStamp,
  removeStamp,
  page,
  getRecordingId,
  figureSprintValues,
  moveUtilization,
};
