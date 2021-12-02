// budgetDb.ts copyright 2021 Paul Beaudet MIT License

import { getDb } from './dbCore';
import type { budgetI, cadenceI, memTaskI, taskI } from '../shared/interface';
import { createOid } from '../isomorphic/oid';
import {
  defaultFrame,
  genId,
  getPriorityIndexRange,
  FIVE_MIN,
  MAX_CHILDREN,
} from '../stores/defaultData';
import {
  getCadence,
  intervalTypes,
  intervalMillis,
} from '../components/time/CadenceFunctions';

const newBudget = async (budget: budgetI | null = null): Promise<budgetI> => {
  const db = await getDb();
  const now = Date.now();
  budget = budget
    ? budget
    : {
        id: createOid(),
        start: now,
        frame: defaultFrame,
        lastModified: now,
        number: 0,
      };
  await db.add('budget', budget);
  return budget;
};

const getCurrentBudget = async (): Promise<budgetI | null> => {
  const db = await getDb();
  const store = db.transaction('budget').store.index('budgetOrder');
  let cursor = await store.openCursor(null, 'prev');
  return cursor ? cursor.value : null;
};

const getLastBudget = async (): Promise<budgetI | null> => {
  const db = await getDb();
  const store = db.transaction('budget').store.index('budgetOrder');
  let cursor = await store.openCursor(null, 'prev');
  cursor = await cursor.continue();
  return cursor ? cursor.value : null;
};

// returns millis used of this task and its decedents
const getUsedBudgetForTask = async (
  task: taskI | memTaskI,
  budgetStart: number,
): Promise<number> => {
  const db = await getDb();
  const transaction = db.transaction(['timeline', 'tasks']);
  const timeStore = transaction.objectStore('timeline').index('timeOrder');
  const taskStore = transaction.objectStore('tasks');
  let timeCursor = await timeStore.openCursor(null, 'prev');
  // while there are timestamps and they are more recent then the budget start
  let millisUsed: number = 0;

  let lastStamp: number = Date.now();
  while (timeCursor && timeCursor.value.start > budgetStart) {
    let potentialLineage: string = timeCursor.value.taskId;
    while (potentialLineage !== genId.todo) {
      const stampTask = await taskStore.get(potentialLineage);
      if (!stampTask) {
        break;
      }
      if (potentialLineage === task.id) {
        millisUsed += lastStamp - timeCursor.value.start;
        break;
      }
      potentialLineage = stampTask.parentId;
    }
    lastStamp = timeCursor.value.start;
    timeCursor = await timeCursor.continue();
  }
  return millisUsed;
};

// finds the position in list where the sprint end line should go
// Currently based on estimations not budgets
// TODO this whole cluster of a function needs to be rethought about
// Currently not used
const getIndexOfBudgetLine = async (
  lineage: taskI[],
): Promise<number | null> => {
  const db = await getDb();
  const transaction = db.transaction(['budget', 'tasks', 'tach', 'timeline']);
  const budgetIndex = transaction.objectStore('budget').index('budgetOrder');
  const timelineIndex = transaction.objectStore('timeline').index('timeOrder');
  const taskIndex = transaction.objectStore('tasks').index('priority');
  const velocityIndex = transaction.objectStore('tach').index('tachOrder');
  const budget = (await budgetIndex.openCursor(null, 'prev')).value;
  const tach = (await velocityIndex.openCursor(null, 'prev')).value;
  const end = budget.start + budget.frame;
  const current = Date.now();
  const remainingMillis = current < end ? end - current : 0;
  if (!remainingMillis) {
    return null;
  }
  let ancestor: number = 0;
  // reversing Lineage starts array with greatest ancestor instead of immediate parent
  let reverseLineage = [...lineage].reverse();
  let runningCost: number = 0; // accumulated effort in milliseconds

  // Start with children of greatest grandparent
  let taskCursor = await taskIndex.openCursor(
    getPriorityIndexRange(reverseLineage[ancestor].id),
  );
  let parentPriority: number = MAX_CHILDREN;
  while (taskCursor) {
    const { id, effort, position, fraction, cadence, priority } =
      taskCursor.value;
    if (parentPriority === position) {
      return null; // if cutoff is before our ancestors give up now
    }
    const nextClan = ancestor + 1;
    // move on to next greatest ancestor's children if related or lineage exhausted
    if (nextClan < lineage.length && id === reverseLineage[nextClan].id) {
      ancestor = nextClan;
      parentPriority = priority ? priority : MAX_CHILDREN;
      taskCursor = await taskIndex.openCursor(
        getPriorityIndexRange(reverseLineage[nextClan].id),
      );
      continue;
    }
    // Fraction (Budget/time-box) takes priority over estimated effort
    const taskCost = fraction ? fraction : effort * tach.millis;
    let cadenceMultiple = cadence === 'zero' ? 1 : 0; // assumed zero case
    if (!cadenceMultiple) {
      const cadenceObj: cadenceI = getCadence(cadence);
      // get frame of time to look into the past
      let pastStart: number = current;
      let window: number = 0;
      for (let i = 0; i < intervalTypes.length; i++) {
        if (cadenceObj.interval === intervalTypes[i]) {
          window = intervalMillis[i] * cadenceObj.skip;
          pastStart = current - window;
          break;
        }
      }
      // look if this event has occurred
      let occurredTime: number = 0;
      let timelineCursor = await timelineIndex.openCursor(null, 'prev');
      while (timelineCursor) {
        // only look back with in time window
        if (timelineCursor.value.start < pastStart) {
          break;
        }
        if (timelineCursor.value.taskId === id) {
          occurredTime = timelineCursor.value.start;
          break;
        }
        timelineCursor = await timelineCursor.continue();
      }
      if (occurredTime) {
        const timeSince: number = current - occurredTime; // millis since last event
        const nextOccurrence: number = window - timeSince; // millis to next needed
        if (remainingMillis > nextOccurrence) {
          const adjustedRemainder: number = remainingMillis - nextOccurrence;
          const timesBeyondNext: number =
            adjustedRemainder > window ? adjustedRemainder / window : 0;
          cadenceMultiple = 1 + timesBeyondNext;
        } else {
          // opportunities expended to do this during this sprint
          cadenceMultiple = 0;
        }
      } else {
        const occurrences: number = remainingMillis / window;
        cadenceMultiple = occurrences ? occurrences : 1; // at least once if not more
      }
    }
    runningCost += taskCost * cadenceMultiple;
    // If our running has exceeded our budget (at immediate parent)
    if (runningCost > remainingMillis) {
      const positionMod: number =
        remainingMillis - runningCost < FIVE_MIN ? 0 : 1;
      return nextClan === lineage.length ? position - positionMod : null;
    }
    if (remainingMillis - runningCost < FIVE_MIN) {
      return nextClan === lineage.length ? position : null;
    }
    // or remaining budget is less than five
    taskCursor = await taskCursor.continue();
  }
  return null;
};

const updateBudget = async (budget: budgetI) => {
  const db = await getDb();
  await db.put('budget', {
    ...budget,
    lastModified: Date.now(),
  });
};

const totalSiblingTimeBox = async (parentId: string) => {
  const db = await getDb();
  const transaction = db.transaction(['tasks']);
  const taskIndex = transaction.objectStore('tasks').index('priority');
  let taskCursor = await taskIndex.openCursor(getPriorityIndexRange(parentId));
  let totalBudget: number = 0;
  while (taskCursor) {
    totalBudget += taskCursor.value.fraction;
    taskCursor = await taskCursor.continue();
  }
  return totalBudget;
};

export {
  newBudget,
  getCurrentBudget,
  getUsedBudgetForTask,
  getIndexOfBudgetLine,
  updateBudget,
  totalSiblingTimeBox,
  getLastBudget,
};
