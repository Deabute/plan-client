// taskDb.ts copyright 2021 Paul Beaudet MIT License
import { getDb } from './dbCore';
import {
  genId,
  genesisTask,
  fibonacciScale,
  getPriorityIndexRange,
  shownStamps,
} from '../stores/defaultData';
import type {
  memTaskI,
  optionalTaskI,
  taskI,
  taskListData,
} from '../shared/interface';
import { peerBroadcast } from '../connections/dataChannels';

const getSubtask = async (
  refParent: taskI = genesisTask,
  renderParent: boolean = false,
): Promise<taskListData> => {
  const idToCompare = renderParent ? refParent.parentId : refParent.id;
  const transaction = (await getDb()).transaction(
    ['tasks', 'views'],
    'readwrite',
  );
  const viewsDb = transaction.objectStore('views');
  const tasksDb = transaction.objectStore('tasks');
  const tasksIndex = tasksDb.index('priority');
  await viewsDb.put({ name: 'parentTask', showing: idToCompare });
  // effort to add up among siblings
  let effort = 0;
  // get all tasks with valid efforts levels
  // & highest priority greatest grandchildren
  const tasks: memTaskI[] = [];
  let position = 0;
  let cursor = await tasksIndex.openCursor(getPriorityIndexRange(idToCompare));
  while (cursor) {
    effort += cursor.value.effort;
    let child: taskI = cursor.value;
    let grandCursor = await tasksIndex.openCursor(
      getPriorityIndexRange(child.id),
    );
    // loop down to the greatest grandchild
    while (grandCursor) {
      child = grandCursor.value;
      grandCursor = await tasksIndex.openCursor(
        getPriorityIndexRange(child.id),
      );
    }
    tasks.push({
      ...cursor.value,
      // make sure position is in one by one order
      position,
      // set highest priority grandchild task if one exist
      topChild: cursor.value.id === child.id ? null : child,
    });
    cursor = await cursor.continue();
    position++;
  }
  // Figure out direct parent in lineage hierarchy
  let parent: taskI = refParent;
  if (renderParent) {
    if (refParent.parentId === genId.todo) {
      parent = genesisTask;
    } else {
      parent = await tasksDb.get(refParent.parentId);
      effort = effort ? effort : 1;
    }
  }
  // set direct parent
  let lineage: taskI[] = [{ ...parent, effort }];
  // compile parents and parents of parent ect.
  while (parent && parent.parentId !== genId.todo) {
    parent = await tasksDb.get(parent.parentId);
    lineage = parent ? [...lineage, parent] : [...lineage];
  }
  // return list with genesis as top level task if not top level
  lineage = lineage[0].id === genId.todo ? lineage : [...lineage, genesisTask];
  return {
    tasks,
    lineage,
    budgetEnd: 0,
  };
};

const getTaskById = async (taskId: memTaskI | string): Promise<taskI> => {
  if (typeof taskId !== 'string') {
    const { topChild, ...baseTask } = taskId;
    return baseTask;
  }
  const db = await getDb();
  const task = await db.get('tasks', taskId);
  if (task) {
    return task;
  } else {
    console.error(new Error('No task exist with this ID'));
  }
};

const updateEffort = async (task: memTaskI, rating: number) => {
  const db = await getDb();
  const { topChild, ...storeTask } = task;
  const data = {
    ...storeTask,
    rating,
    effort: fibonacciScale[rating],
    lastModified: Date.now(),
  };
  await db.put('tasks', data);
  peerBroadcast('sync-tasks', { data, done: true });
};

const updateTask = async (
  task: memTaskI,
  done: boolean = true,
): Promise<taskI> => {
  const db = await getDb();
  const { topChild, ...baseTask } = task;
  const data: taskI = { ...baseTask, lastModified: Date.now() };
  await db.put('tasks', data);
  peerBroadcast('sync-tasks', { data, done });
  return data;
};

const updateTaskSafe = async (
  task: optionalTaskI,
  done: boolean = true,
): Promise<taskI> => {
  const db = await getDb();
  const trueTask = await db.get('tasks', task.id);
  const data: taskI = {
    ...trueTask,
    ...task,
    lastModified: Date.now(),
  };
  await db.put('tasks', data);
  peerBroadcast('sync-tasks', { data, done });
  return data;
};

const createActivity = async (task: taskI) => {
  const db = await getDb();
  const trans = db.transaction(['tasks'], 'readwrite');
  const tasksStore = trans.objectStore('tasks');
  const taskIndex = tasksStore.index('priority');
  let cursor = await taskIndex.openCursor(
    getPriorityIndexRange(task.parentId),
    'prev',
  );
  const lastModified = Date.now();
  while (cursor) {
    cursor.update({
      ...cursor.value,
      position: cursor.value.position + 1,
      lastModified,
    });
    cursor = await cursor.continue();
  }
  await tasksStore.put(task);
};

const placeFolderDb = async (task: taskI) => {
  const db = await getDb();
  const trans = db.transaction(['tasks'], 'readwrite');
  const tasksStore = trans.objectStore('tasks');
  const taskIndex = tasksStore.index('priority');
  let cursor = await taskIndex.openCursor(getPriorityIndexRange(task.parentId));
  const lastModified = Date.now();
  let position = 0;
  const changes: taskI[] = [];
  const pushChange = (taskToPush: taskI) => {
    changes.push({
      ...taskToPush,
      position,
      lastModified,
    });
  };
  let changedTask: boolean = false;
  while (cursor) {
    if (cursor.value.position - 1 === task.position) {
      pushChange(task);
      changedTask = true;
      position++;
    }
    if (cursor.value.id === task.id) {
      await cursor.update({
        ...cursor.value,
        position: 9000,
      });
      cursor = await cursor.continue();
      continue;
    } else if (cursor.value.position !== position) {
      pushChange(cursor.value);
    }
    // only increment to positions we are adding
    if (cursor.value.id !== task.id) position++;
    cursor = await cursor.continue();
  }
  if (!changedTask) pushChange(task);
  for (let i = 0; i < changes.length; i++) await tasksStore.put(changes[i]);
};

// Used for correcting positions when an item is checked off
const backfillPositions = async (parentId: string) => {
  const db = await getDb();
  const trans = db.transaction(['tasks'], 'readwrite');
  const tasksStore = trans.objectStore('tasks');
  const taskIndex = tasksStore.index('priority');
  let position = 0;
  let cursor = await taskIndex.openCursor(getPriorityIndexRange(parentId));
  const lastModified = Date.now();
  const changes: taskI[] = [];
  while (cursor) {
    changes.push({
      ...cursor.value,
      position,
      lastModified,
    });
    position++;
    cursor = await cursor.continue();
  }
  for (let i = 0; i < changes.length; i++) {
    await tasksStore.put(changes[i]);
  }
};

// used for correcting positional discrepancies on sync
const resolvePositions = async () => {
  const db = await getDb();
  const trans = db.transaction(['tasks'], 'readwrite');
  const taskStore = trans.objectStore('tasks');
  const taskIndex = taskStore.index('priority');
  let cursor = await taskIndex.openCursor();
  let childCollector: taskI[] = [];
  let lastParent = '';

  const correctChildren = async () => {
    childCollector = childCollector.sort((a, b) => {
      // issue here is we actually want to special sort all recent entries
      // but that would create a special case that could very among peer interconnects
      if (a.position === b.position) {
        return b.lastModified - a.lastModified;
      }
      return a.position - b.position;
    });
    for (let i = 0; i < childCollector.length; i++) {
      await taskStore.put({
        ...childCollector[i],
        position: i,
      });
    }
    childCollector = [];
  };
  // first pass figure corrections
  while (cursor) {
    const { status, parentId } = cursor.value;
    if (status === 'todo') {
      if (lastParent !== parentId) {
        await correctChildren();
      }
      childCollector.push(cursor.value);
      lastParent = parentId;
    }
    cursor = await cursor.continue();
  }
  await correctChildren();
};

// handles stream of peer's data
const incomingTasks = async ({
  data,
  done,
}: {
  done: boolean;
  data: taskI;
}): Promise<boolean> => {
  const db = await getDb();
  const localData = await db.get('tasks', data.id);
  if (localData) {
    if (localData.lastModified < data.lastModified) {
      await db.put('tasks', data);
    }
  } else {
    await db.add('tasks', data);
  }
  if (done) {
    await resolvePositions();
  }
  return done;
};

const getAgendaDb = async (topOfAgenda: number = 0): Promise<taskI[]> => {
  const db = await getDb();
  const taskIndex = db
    .transaction('tasks')
    .objectStore('tasks')
    .index('byDueDate');
  let agenda: taskI[] = [];
  const now = Date.now();
  let entries = shownStamps;
  let pastDue = 5;
  if (topOfAgenda) {
    let cursor = await taskIndex.openCursor(IDBKeyRange.bound(1, topOfAgenda));
    while (cursor && entries) {
      agenda.push(cursor.value);
      entries--;
      cursor = await cursor.continue();
    }
    return agenda;
  }
  let cursor = await taskIndex.openCursor(IDBKeyRange.bound(1, now), 'prev');
  while (cursor && pastDue) {
    agenda.push(cursor.value);
    entries--;
    pastDue--;
    cursor = await cursor.continue();
  }
  agenda = agenda.reverse();
  cursor = await taskIndex.openCursor(IDBKeyRange.bound(now, Infinity));
  while (cursor && entries) {
    agenda.push(cursor.value);
    entries--;
    cursor = await cursor.continue();
  }
  return agenda;
};

const pageAgenda = async (
  agenda: taskI[],
  past: boolean = true,
): Promise<{ newAgenda: taskI[]; complete: boolean }> => {
  let newAgenda = [...agenda];
  let complete = true;
  if (agenda.length) {
    const db = await getDb();
    const taskIndex = db
      .transaction('tasks')
      .objectStore('tasks')
      .index('byDueDate');
    const range = past
      ? IDBKeyRange.bound(1, agenda[0].dueDate - 1)
      : IDBKeyRange.bound(agenda[agenda.length - 1].dueDate + 1, Infinity);
    let cursor = await taskIndex.openCursor(range, past ? 'prev' : 'next');
    if (cursor) {
      newAgenda = past ? [cursor.value, ...agenda] : [...agenda, cursor.value];
      newAgenda = past
        ? newAgenda.slice(0, newAgenda.length - 1)
        : newAgenda.slice(1);
      cursor = await cursor.continue();
      complete = cursor ? false : true;
    }
  }
  return {
    newAgenda,
    complete,
  };
};

const canUndo = async (taskId: string): Promise<boolean> => {
  const db = await getDb();
  const task = await db.get('tasks', taskId);
  if (task.parentId === '1') return true;
  if (task.status === 'hide') return false;
  const parent = await db.get('tasks', task.parentId);
  return parent.status === 'todo' ? true : false;
};

// returns id of currant sibling with a running task or null
const decedentOfWhich = async (
  nowId: string,
  currentFolder: string,
): Promise<string | null> => {
  const db = await getDb();
  const trans = db.transaction(['tasks', 'timeline']);
  // const timeIndex = trans.objectStore('timeline').index('timeOrder');
  const taskStore = trans.objectStore('tasks');
  const taskIndex = taskStore.index('priority');
  const currentSiblings: string[] = [];
  let cursor = await taskIndex.openCursor(getPriorityIndexRange(currentFolder));
  while (cursor) {
    currentSiblings.push(cursor.value.id);
    cursor = await cursor.continue();
  }
  if (!currentSiblings.length) return null;
  let task = await taskStore.get(nowId);
  while (task) {
    // base case is getting to top level which we might already be on
    for (let i = 0; i < currentSiblings.length; i++) {
      if (currentSiblings[i] === task.id) return task.id;
    }
    if (task.parentId === '1') break;
    task = await taskStore.get(task.parentId);
  }
  return null;
};

const onAgenda = async (time: number): Promise<boolean> => {
  const db = await getDb();
  const result = await db.getFromIndex('tasks', 'byDueDate', time);
  return result ? true : false;
};

export {
  getTaskById,
  updateEffort,
  updateTask,
  getSubtask,
  createActivity,
  resolvePositions,
  incomingTasks,
  placeFolderDb,
  backfillPositions,
  getAgendaDb,
  pageAgenda,
  canUndo,
  decedentOfWhich,
  onAgenda,
  updateTaskSafe,
};
