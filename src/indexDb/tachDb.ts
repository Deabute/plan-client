// tachDb.ts copyright 2021 Paul Beaudet MIT License
// tach is short for tachometer btw, something that measures speed / velocity
// here it just refers to a snapshot it time of average speed to that point
import { getDb } from './dbCore';
import type { velocityI } from '../shared/interface';
import {
  startingVelocity,
  newTach,
  fibonacciScale,
  FIVE_MIN,
} from '../stores/defaultData';
import { peerBroadcast } from '../connections/dataChannels';

// only used in blank slate case to write first/default reading
const saveTach = async (velocity: velocityI) => {
  const db = await getDb();
  await db.add('tach', velocity);
};

const getCurrentTach = async (): Promise<velocityI | null> => {
  const db = await getDb();
  const timeStore = db.transaction('tach').store.index('tachOrder');
  let cursor = await timeStore.openCursor(null, 'prev');
  return cursor ? cursor.value : null;
};

const TWO_HOUR = 7200000;
const COVERAGE = 10;

const getAverageTach = async (): Promise<number> => {
  const db = await getDb();
  const trans = db.transaction(['timeline', 'tasks']);
  const timeStore = trans.objectStore('timeline').index('timeOrder');
  const tasksStore = trans.objectStore('tasks');
  let accumulativeSpeed: number = 0;
  let skipped = 0;
  const taskMeasured: string[] = [];

  const getTaskDuration = async (position: number): Promise<number> => {
    let lastStamp: number = Date.now();
    let duration: number = 0;
    let cursor = await timeStore.openCursor(null, 'prev');
    const advance = position + skipped;
    if (advance) {
      // Advance to the entry we're concerned about
      // aka 1x before last completed
      cursor = await cursor.advance(advance);
    }
    if (cursor) {
      // Grab timestamp from first entry
      lastStamp = cursor.value.start;
      cursor = await cursor.continue();
    }
    if (!cursor) {
      // backfill as blank entry in not enough data
      return startingVelocity;
    }
    for (let i = 0; i < taskMeasured.length; i++) {
      if (taskMeasured[i] === cursor.value.taskId) {
        skipped++;
        return await getTaskDuration(position);
      }
    }
    const task = await tasksStore.get(cursor.value.taskId);
    // Given this task has yet to be completed, try this function with next task
    if (!task || task.status === 'todo') {
      skipped++;
      return await getTaskDuration(position);
    }
    // Note that we have already measured for this task
    taskMeasured.push(task.id);
    // Accumulate remaining durations to complete this task
    while (cursor) {
      if (cursor.value.taskId === task.id) {
        duration += lastStamp - cursor.value.start;
      }
      lastStamp = cursor.value.start;
      cursor = await cursor.continue();
    }
    let speedPerPoint =
      duration > fibonacciScale[task.rating]
        ? duration / fibonacciScale[task.rating]
        : FIVE_MIN;
    // lower bound for one point
    speedPerPoint = speedPerPoint < FIVE_MIN ? FIVE_MIN : speedPerPoint;
    // upper bound for one point
    speedPerPoint = speedPerPoint > TWO_HOUR ? TWO_HOUR : speedPerPoint;
    return speedPerPoint;
  };
  for (let i = 0; i < COVERAGE; i++) {
    accumulativeSpeed += await getTaskDuration(i);
  }
  const currentTach = Math.ceil(accumulativeSpeed / COVERAGE);
  const data: velocityI = newTach(currentTach);
  peerBroadcast('sync-tach', { data, done: true });
  await db.add('tach', data);
  return currentTach;
};

const incomingTach = async ({
  data,
  done,
}: {
  done: boolean;
  data: velocityI;
}): Promise<boolean> => {
  const db = await getDb();
  const localData = await db.get('tach', data.id);
  if (!localData) {
    await db.add('tach', data); // ts hates this but I'm not repeating myself
  }
  return done;
};

export { saveTach, getCurrentTach, getAverageTach, incomingTach };
