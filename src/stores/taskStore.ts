// taskStore.ts Copyright 2021 Paul Beaudet MIT License
import { get, Writable, writable } from 'svelte/store';
import type {
  taskI,
  memTaskI,
  taskListData,
  incomingTaskI,
} from '../shared/interface';
import {
  genesisTask,
  getColdStartData,
  startingVelocity,
  defaultFrame,
} from '../stores/defaultData';
import {
  updateTaskSafe,
  createActivity,
  incomingTasks,
  placeFolderDb,
  backfillPositions,
  getTaskById,
  decedentOfWhich,
  getChildren,
} from '../indexDb/taskDb';
import { getCurrentBudget } from '../indexDb/budgetDb';
import { peerBroadcast, onEvent } from '../connections/dataChannels';
import { createOid } from '../isomorphic/oid';
import { moveTask } from './settingsStore';
import { getDb } from '../indexDb/dbCore';
import { loadAgenda, nextRecording } from './agendaStore';
import {
  newTimeStamp,
  recordingTaskParent,
  refreshTime,
  timeStore,
} from './timeStore';
import { addEvent } from '../indexDb/eventsDb';
import type { taskPayload } from '../connections/connectInterface';
import { nextOccurrence } from '../components/time/CadenceFunctions';
import { moveUtilization } from '../indexDb/timelineDb';

const defaultTaskArray: memTaskI[] = [];

const taskStore: Writable<taskListData> = writable({
  tasks: defaultTaskArray,
  lineage: [genesisTask],
  budgetEnd: null,
});

const overBudget: Writable<number> = writable(0);
const toAllocate: Writable<number> = writable(0);
const budgetAvail: Writable<number> = writable(0);

const allocateTimeAmongChildren = async ({
  tasks,
  lineage,
}: taskListData): Promise<taskListData> => {
  const { id, fraction } = lineage[0];
  let amount: number = id === genesisTask.id ? -1 : fraction;
  // Get the full budget if this is the top folder
  if (amount === -1) {
    const budget = await getCurrentBudget();
    amount = budget === null ? defaultFrame : budget.frame;
  }
  let siblingsToDivideAmong: number = 0;
  let budgetToShare: number = 0;
  let timeToAllocate: number = amount.valueOf();
  tasks.forEach((task) => {
    if (task.status === 'done') return;
    if (task.autoAssigned) {
      siblingsToDivideAmong++;
    } else {
      timeToAllocate -= task.fraction;
    }
  });

  // Time needs to be released back to task condition
  if (timeToAllocate < 0) {
    overBudget.set(timeToAllocate);
    budgetAvail.set(0); // a task needs to be unlocked in this case
    return { tasks, lineage };
  }
  overBudget.set(0);

  // at this point whether time has task to assign to or not
  // it should be set as the new available budget
  budgetAvail.set(timeToAllocate);
  // More time is available then there are clients to give to
  if (siblingsToDivideAmong === 0 && timeToAllocate) {
    toAllocate.set(timeToAllocate);
    return { tasks, lineage };
  }
  toAllocate.set(0);

  let remainder: number = 0;
  if (timeToAllocate <= startingVelocity) {
    // remainder can be a positive number between 0 and velocity
    remainder = timeToAllocate > 0 ? timeToAllocate : 0;
  } else if (siblingsToDivideAmong > 0) {
    // increase size of allocation and reduce task to affect if it is smaller than velocity
    budgetToShare = Math.trunc(timeToAllocate / siblingsToDivideAmong);
    while (budgetToShare <= startingVelocity) {
      siblingsToDivideAmong--;
      budgetToShare = Math.trunc(timeToAllocate / siblingsToDivideAmong);
    }
    remainder = timeToAllocate % siblingsToDivideAmong;
  } // other wise siblingsToDivideAmong, allocation, and remainder can remain zero

  let getsRemainder = true; // first valid result gets remainder
  return {
    tasks: tasks.map((task) => {
      let fraction = getsRemainder ? budgetToShare + remainder : budgetToShare;
      if (task.autoAssigned && task.status === 'todo') {
        // Stop handing out shares, once we run out of siblings to divide among
        fraction = siblingsToDivideAmong <= 0 ? 0 : fraction;
        siblingsToDivideAmong--;
        getsRemainder = false;
        if (fraction !== task.fraction) {
          updateTaskSafe({ id: task.id, fraction }, false, false);
        }
      } else {
        fraction = task.status === 'todo' ? task.fraction : task.utilization;
      }
      return {
        ...task,
        fraction,
      };
    }),
    lineage,
  };
};

const loadChildren = async (id: string = '1') => {
  let taskList = await getChildren(id);
  // Create a default task if this is the first load or the last task was completed
  if (!taskList.tasks.length) {
    if (taskList.lineage[0].id === genesisTask.id) {
      const defaultTasks = getColdStartData();
      const db = await getDb();
      for (let i = 0; i < defaultTasks.length; i++) {
        await db.add('tasks', defaultTasks[i]);
      }
      taskList = await getChildren(id);
    }
  }

  taskList = await allocateTimeAmongChildren(taskList);
  taskStore.update((oldList) => {
    // figure what sibling utilization timer is associated with
    if (oldList.lineage[0].id !== taskList.lineage[0].id) {
      // its also possible to use getRecordingId outside the update function
      let nowId = get(timeStore).now.taskId;
      decedentOfWhich(nowId, taskList.lineage[0].id).then((value) => {
        recordingTaskParent.set(value);
      });
    }
    return taskList;
  });
};

const refreshTask = async (currentParent: taskI | null = null) => {
  if (currentParent === null) {
    taskStore.update((store) => {
      currentParent = store.lineage[0];
      return store;
    });
  }
  await loadChildren(currentParent.id);
};

onEvent('sync-tasks', async (data: incomingTaskI) => {
  if (await incomingTasks(data)) {
    await refreshTask();
    await loadAgenda();
    await refreshTime(false);
  }
});

const newActivity = async (
  body: string,
  lineage: taskI[],
  creationTime: number = 0,
  taskId: string = '',
) => {
  const { id, fraction, cadence } = lineage[0];
  const currentTimestamp = creationTime ? creationTime : Date.now();
  taskId = taskId ? taskId : createOid();
  // broadcast to all peers if created with this device
  if (!creationTime) {
    peerBroadcast('task', {
      data: { body, lineage, currentTimestamp, taskId },
    });
  }
  await createActivity(
    {
      ...genesisTask,
      id: taskId,
      parentId: id,
      body,
      fraction: 0,
      position: 0,
      cadence: !fraction && cadence !== 'zero' ? cadence : 'zero',
      lastModified: currentTimestamp,
      timeCreated: currentTimestamp,
    },
    currentTimestamp,
  );
  await refreshTask();
};

onEvent('task', async ({ data }: { data: taskPayload }) => {
  const { body, lineage, currentTimestamp, taskId } = data;
  await newActivity(body, lineage, currentTimestamp, taskId);
});

// Change of position
const placeFolder = async (
  sourceId: string,
  dest: memTaskI,
  after: boolean = true, // after this destination or inside destination
) => {
  const task = await getTaskById(sourceId);
  const changed: taskI = {
    ...task,
    parentId: after ? dest.parentId : dest.id,
    position: after ? dest.position : -1,
    lastModified: Date.now(),
  };
  await placeFolderDb(changed);
  const backfill = task.parentId !== changed.parentId ? task.parentId : '';
  // utilization only needs to change in backfill case (moved from one folder to another)
  // utilization doesn't need to be removed or added to TLD
  if (backfill) {
    await moveUtilization(task, changed.parentId);
    await backfillPositions(task.parentId, changed.lastModified);
  }
  refreshTask();
  moveTask.set(null);
  addEvent('moveTask', {
    task: changed,
    backfill,
  });
};

// logic for state updates to a checked off task
const updateNextOrDone = async (task: taskI, sync: boolean = true) => {
  const { cadence, dueDate, id } = task;
  if (cadence === 'zero') {
    await updateTaskSafe({ id, status: 'done' }, sync, sync);
  } else {
    await updateTaskSafe(
      {
        id,
        dueDate: cadence === 'many' ? 0 : nextOccurrence(cadence, dueDate),
      },
      sync,
      sync,
    );
  }
};

const refreshAllViews = async (holdPosition: boolean = true) => {
  await refreshTime(holdPosition);
  await refreshTask();
  await loadAgenda();
};

// returns a click event, holds task id in closure
// called on task completion
const checkOff = (taskId: string) => {
  return async () => {
    const task: taskI = await getTaskById(taskId);
    let now = get(timeStore).now;
    let currentRunningTask = now.taskId === taskId ? true : false;
    let nextRecord = await nextRecording(taskId);
    // abort if there is no task to replace the one running task
    if (currentRunningTask && !nextRecord) return;
    await updateNextOrDone(task);
    await addEvent('checkOff', { task });
    if (currentRunningTask)
      await newTimeStamp(nextRecord.id, nextRecord.body, nextRecord.cadence);
    await refreshAllViews(!currentRunningTask);
  };
};

// returns a click event, holds task id in closure
const hideTask = (task: memTaskI) => {
  return async () => {
    let now = get(timeStore).now;
    let currentRunningTask = now.taskId === task.id ? true : false;
    let nextRecord = await nextRecording(task.id);
    if (currentRunningTask && !nextRecord) return;
    task = await updateTaskSafe({
      id: task.id,
      status: 'hide',
      dueDate: 0,
    });
    await backfillPositions(task.parentId, task.lastModified);
    addEvent('hideTask', { task });
    if (currentRunningTask)
      await newTimeStamp(nextRecord.id, nextRecord.body, nextRecord.cadence);
    await refreshAllViews(!currentRunningTask);
  };
};

export {
  taskStore,
  overBudget,
  toAllocate,
  budgetAvail,
  refreshTask,
  newActivity,
  placeFolder,
  checkOff,
  hideTask,
  updateNextOrDone,
  loadChildren,
  refreshAllViews,
};
