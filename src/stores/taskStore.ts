// taskStore.ts Copyright 2021 Paul Beaudet MIT License
import { get, Writable, writable } from 'svelte/store';
import type { taskI, memTaskI, taskListData } from '../shared/interface';
import {
  genesisTask,
  createDefaultTask,
  getColdStartData,
  shownStamps,
} from '../stores/defaultData';
import {
  updateTaskSafe,
  getSubtask,
  createActivity,
  incomingTasks,
  placeFolderDb,
  backfillPositions,
  getTaskById,
  decedentOfWhich,
} from '../indexDb/taskDb';
import { getCurrentBudget } from '../indexDb/budgetDb';
import { peerBroadcast, onEvent } from '../connections/dataChannels';
import { createOid } from '../isomorphic/oid';
import { getCurrentTach } from '../indexDb/tachDb';
import { editTask, moveTask } from './settingsStore';
import { getDb } from '../indexDb/dbCore';
import { loadAgenda, nextRecording } from './agendaStore';
import {
  newTimeStamp,
  recordingTaskParent,
  refreshTime,
  timeStore,
} from './timeStore';
import { recalculateTach } from './velocityStore';
import { addEvent } from '../indexDb/eventsDb';
import { cancelFund } from './fundingStore';
import type { taskPayload } from '../connections/connectInterface';
import { nextOccurrence } from '../components/time/CadenceFunctions';

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
}: taskListData): Promise<memTaskI[]> => {
  let amount: number =
    lineage[0].id === genesisTask.id ? -1 : lineage[0].fraction;
  if (amount === -1) {
    const budget = await getCurrentBudget();
    amount = budget === null ? 0 : budget.frame;
  }
  const tach = await getCurrentTach();
  if (tach === null || amount === 0) {
    budgetAvail.set(0);
    return tasks;
  }
  let siblingsToDivideAmong: number = 0;
  let budgetToShare: number = 0;
  let timeToAllocate: number = amount.valueOf();
  tasks.forEach(({ autoAssigned, fraction }) => {
    if (autoAssigned) {
      siblingsToDivideAmong++;
    } else {
      timeToAllocate -= fraction;
    }
  });

  // Time needs to be released back to task condition
  if (timeToAllocate < 0) {
    overBudget.set(timeToAllocate);
    budgetAvail.set(0); // a task needs to be unlocked in this case
    return tasks;
  }
  overBudget.set(0);

  // at this point whether time has task to assign to or not
  // it should be set as the new available budget
  budgetAvail.set(timeToAllocate);
  // More time is available then there are clients to give to
  if (siblingsToDivideAmong === 0 && timeToAllocate) {
    toAllocate.set(timeToAllocate);
    return tasks;
  }
  toAllocate.set(0);

  let remainder: number = 0;
  if (timeToAllocate <= tach.millis) {
    // remainder can be a positive number between 0 and velocity
    remainder = timeToAllocate > 0 ? timeToAllocate : 0;
  } else if (siblingsToDivideAmong > 0) {
    // increase size of allocation and reduce task to affect if it is smaller than velocity
    budgetToShare = Math.trunc(timeToAllocate / siblingsToDivideAmong);
    while (budgetToShare <= tach.millis) {
      siblingsToDivideAmong--;
      budgetToShare = Math.trunc(timeToAllocate / siblingsToDivideAmong);
    }
    remainder = timeToAllocate % siblingsToDivideAmong;
  } // other wise siblingsToDivideAmong, allocation, and remainder can remain zero

  let getsRemainder = true; // first valid result gets remainder
  return tasks.map((task) => {
    let fraction = getsRemainder ? budgetToShare + remainder : budgetToShare;
    if (task.autoAssigned) {
      // Stop handing out shares, once we run out of siblings to divide among
      fraction = siblingsToDivideAmong <= 0 ? 0 : fraction;
      siblingsToDivideAmong--;
      getsRemainder = false;
    } else {
      fraction = task.fraction;
    }
    return {
      ...task,
      fraction,
    };
  });
};

// renderParent true -> uses parentId prop to make list of task with that parentId
// renderParent false -> uses ID prop to make list of task with that parentId
const loadTask = async (
  refTask: taskI = genesisTask,
  renderParent: boolean = true,
): Promise<taskListData> => {
  let taskList = await getSubtask(refTask, renderParent);
  // Create a default task if this is the first load or the last task was completed
  if (!taskList.tasks.length) {
    if (taskList.lineage[0].id === genesisTask.id) {
      const defaultTasks = getColdStartData();
      const db = await getDb();
      for (let i = 0; i < defaultTasks.length; i++) {
        await db.add('tasks', defaultTasks[i]);
      }
      taskList = await getSubtask(refTask, renderParent);
    }
  }

  taskList.tasks = await allocateTimeAmongChildren(taskList);
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
  return taskList;
};

const refreshTask = async (currentParent: taskI | null = null) => {
  if (currentParent === null) {
    taskStore.update((store) => {
      currentParent = store.lineage[0];
      return store;
    });
  }
  await loadTask(currentParent, false);
};

onEvent('sync-tasks', async (data: { data: taskI; done: boolean }) => {
  const done = await incomingTasks(data);
  if (done) {
    await refreshTask();
    await loadAgenda();
    await refreshTime();
  }
});

const newActivity = async (
  body: string,
  lineage: taskI[],
  creationTime: number = 0,
  id: string = '',
) => {
  const currentTimestamp = creationTime ? creationTime : Date.now();
  const taskId = id ? id : createOid();
  // broadcast to all peers if created with this device
  if (!creationTime) {
    peerBroadcast('task', {
      data: { body, lineage, currentTimestamp, taskId },
    });
  }
  let cadence: string =
    !lineage[0].fraction && lineage[0].cadence !== 'zero'
      ? lineage[0].cadence
      : 'zero';
  const newTask: taskI = {
    ...createDefaultTask(),
    id: taskId,
    parentId: lineage[0].id,
    body,
    description: '',
    cadence,
    lastModified: currentTimestamp,
    timeCreated: currentTimestamp,
  };
  // increment all potential siblings in storage
  await createActivity(newTask);
  await refreshTask();
};

onEvent('task', async ({ data }: { data: taskPayload }) => {
  const { body, lineage, currentTimestamp, taskId } = data;
  await newActivity(body, lineage, currentTimestamp, taskId);
});

// Change of position
const placeFolder = async (
  // { topChild, ...baseTask }: memTaskI,
  sourceId: string,
  dest: memTaskI,
  after: boolean = true,
) => {
  const task = await getTaskById(sourceId);
  const changedTask: taskI = {
    ...task,
    parentId: after ? dest.parentId : dest.id,
    position: after ? dest.position : -1,
  };
  await placeFolderDb(changedTask);
  const backfill = task.parentId !== changedTask.parentId ? task.parentId : '';
  if (backfill) await backfillPositions(task.parentId);
  refreshTask();
  moveTask.set(null);
  addEvent('moveTask', {
    task: changedTask,
    backfill,
  });
};

const modifyParentBody = (body: string) => {
  taskStore.update((store) => {
    store.lineage[0].body = body;
    updateTaskSafe({ id: store.lineage[0].id, body });
    return store;
  });
};

const modifyBody = (task: memTaskI, body: string) => {
  taskStore.update((store) => {
    store.tasks = store.tasks.map((t) => {
      if (t.id === task.id) {
        task = { ...t, body };
        return task;
      }
      return t;
    });
    updateTaskSafe({ id: task.id, body });
    return store;
  });
};

const undoAndPlace = async (taskId: string) => {
  const task: taskI = await getTaskById(taskId);
  await updateTaskSafe({ id: taskId, status: 'todo' });
  await placeFolder(
    taskId,
    {
      ...task,
      id: task.parentId,
    },
    false,
  );
};

// returns a click event, holds task id in closure
const checkOff = (taskId: string) => {
  return async () => {
    const checkTask: taskI = await getTaskById(taskId);
    let now = get(timeStore).now;
    let currentRunningTask = now.taskId === taskId ? true : false;
    let nextRecord = await nextRecording(taskId);
    if (currentRunningTask && !nextRecord) return;

    if (checkTask.cadence === 'zero') {
      await updateTaskSafe({ id: taskId, status: 'done' });
      await backfillPositions(checkTask.parentId);
    } else {
      await updateTaskSafe({
        id: taskId,
        dueDate:
          checkTask.cadence === 'many'
            ? 0
            : nextOccurrence(checkTask.cadence, checkTask.dueDate),
      });
    }
    // TODO: below mark peer as done where it might be just set to next
    await addEvent('checkOff', { task: checkTask });

    timeStore.update((timeline) => {
      if (checkTask.cadence === 'zero') {
        timeline.history = timeline.history.map((stamp) => {
          return {
            ...stamp,
            done: stamp.done || stamp.taskId === taskId ? true : false,
          };
        });
      }
      if (currentRunningTask) {
        timeline.history = [
          {
            ...timeline.now,
            duration: Date.now() - timeline.now.start,
            done: checkTask.cadence === 'zero' ? true : false,
          },
          ...timeline.history,
        ];
        if (timeline.history.length > shownStamps) {
          timeline.history.pop();
        }
        timeline.now = newTimeStamp(nextRecord);
      }
      return timeline;
    });
    if (checkTask.cadence === 'zero' && currentRunningTask) {
      await recalculateTach();
    }
    await refreshTask();
    await loadAgenda();
  };
};

// returns a click event, holds task id in closure
const hideTask = (task: memTaskI) => {
  return async () => {
    let now = get(timeStore).now;
    let currentRunningTask = now.taskId === task.id ? true : false;
    let nextRecord = await nextRecording(task.id);
    if (currentRunningTask && !nextRecord) return;

    task.status = 'hide';
    await updateTaskSafe({ id: task.id, status: 'hide' });
    await backfillPositions(task.parentId);
    addEvent('hideTask', { task });

    timeStore.update((timeline) => {
      timeline.history = timeline.history.map((stamp) => {
        return {
          ...stamp,
          done: stamp.done || stamp.taskId === task.id ? true : false,
        };
      });
      if (currentRunningTask) {
        timeline.history = [
          {
            ...timeline.now,
            duration: Date.now() - timeline.now.start,
            done: true,
          },
          ...timeline.history,
        ];
        if (timeline.history.length > shownStamps) {
          timeline.history.pop();
        }
        timeline.now = newTimeStamp(nextRecord);
      }
      return timeline;
    });
    await recalculateTach();
    await refreshTask();
    await loadAgenda();
  };
};

const openFolder = (task: taskI, moveTask: taskI, openThis: boolean = true) => {
  return () => {
    // don't allow folder to self insert
    if (moveTask?.id === task.id) return;
    cancelFund();
    loadTask(task, openThis);
    editTask.set(null);
  };
};

export {
  taskStore,
  overBudget,
  toAllocate,
  budgetAvail,
  loadTask,
  refreshTask,
  newActivity,
  modifyParentBody,
  placeFolder,
  undoAndPlace,
  modifyBody,
  checkOff,
  hideTask,
  openFolder,
};
