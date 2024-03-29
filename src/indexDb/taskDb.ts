// taskDb.ts copyright 2021 Paul Beaudet MIT License
import { getDb } from './dbCore';
import {
  genesisTask,
  getPriorityIndexRange,
  shownStamps,
} from '../stores/defaultData';
import { minInMillis } from '../components/time/timeConstants';
import type {
  incomingTaskI,
  memTaskI,
  optionalTaskI,
  taskI,
  taskListData,
} from '../shared/interface';
import { peerBroadcast } from '../connections/dataChannels';

const getGreatestGrandChild = async (
  index: any,
  parent: string,
): Promise<taskI> => {
  let cursor = await index.openCursor(getPriorityIndexRange(parent));
  // loop down to the greatest grandchild
  let child: taskI | null = null;
  while (cursor) {
    child = cursor.value;
    cursor = await index.openCursor(getPriorityIndexRange(child.id));
  }
  return !child || child.id === parent ? null : child;
};

const getLineage = async (parentId: string, tasksDb: any): Promise<taskI[]> => {
  // Figure out direct parent in lineage hierarchy
  let parent: taskI =
    parentId === '1' ? genesisTask : await tasksDb.get(parentId);
  if (!parent) return null;
  // set direct parent
  let lineage: taskI[] = [{ ...parent }];
  // compile parents and parents of parent ect.
  while (parent && parent.parentId !== '1') {
    parent = await tasksDb.get(parent.parentId);
    if (parent) lineage = [...lineage, parent];
  }
  // return list with genesis as top level task if not top level
  return lineage[0].id === '1' ? lineage : [...lineage, genesisTask];
};

const getChildren = async (taskId: string): Promise<taskListData> => {
  const db = await getDb();
  const transaction = db.transaction(['tasks', 'views'], 'readwrite');
  const viewsDb = transaction.objectStore('views');
  const tasksDb = transaction.objectStore('tasks');
  const posIndex = tasksDb.index('position');
  const priorIndex = tasksDb.index('priority');
  await viewsDb.put({ name: 'parentTask', showing: taskId });

  const tasks: memTaskI[] = [];
  let cursor = await posIndex.openCursor(
    IDBKeyRange.bound([taskId, 0], [taskId, Infinity]),
  );
  while (cursor) {
    if (cursor.value.status !== 'hide') {
      tasks.push({
        ...cursor.value,
        topChild:
          cursor.value.status === 'todo'
            ? await getGreatestGrandChild(priorIndex, cursor.value.id)
            : null,
      });
    }
    cursor = await cursor.continue();
  }
  return {
    tasks,
    lineage: await getLineage(taskId, tasksDb),
  };
};

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
  // & highest priority greatest grandchildren
  const tasks: memTaskI[] = [];
  let position = 0;
  let cursor = await tasksIndex.openCursor(getPriorityIndexRange(idToCompare));
  while (cursor) {
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
    if (refParent.parentId === '1') {
      parent = genesisTask;
    } else {
      parent = await tasksDb.get(refParent.parentId);
    }
  }
  // set direct parent
  let lineage: taskI[] = [{ ...parent }];
  // compile parents and parents of parent ect.
  while (parent && parent.parentId !== '1') {
    parent = await tasksDb.get(parent.parentId);
    lineage = parent ? [...lineage, parent] : [...lineage];
  }
  // return list with genesis as top level task if not top level
  lineage = lineage[0].id === '1' ? lineage : [...lineage, genesisTask];
  return {
    tasks,
    lineage,
  };
};

const getSiblingTaskById = async (taskId: string): Promise<taskListData> => {
  const transaction = (await getDb()).transaction(['tasks']);
  const tasksDb = transaction.objectStore('tasks');
  const tasksIndex = tasksDb.index('priority');
  const task = await tasksDb.get(taskId);
  const taskListData: taskListData = {
    tasks: [],
    lineage: [],
  };
  if (!task) return taskListData;
  // & highest priority greatest grandchildren
  let position = 0;
  let cursor = await tasksIndex.openCursor(
    getPriorityIndexRange(task.parentId),
  );
  while (cursor) {
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
    taskListData.tasks.push({
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
  let parent: taskI =
    task.parentId === '1' ? genesisTask : await tasksDb.get(task.parentId);
  if (!parent) return taskListData;
  // set direct parent
  taskListData.lineage = [{ ...parent }];
  // compile parents and parents of parent ect.
  while (parent && parent.parentId !== '1') {
    parent = await tasksDb.get(parent.parentId);
    taskListData.lineage = parent
      ? [...taskListData.lineage, parent]
      : [...taskListData.lineage];
  }
  // return list with genesis as top level task if not top level
  taskListData.lineage =
    taskListData.lineage[0].id === '1'
      ? taskListData.lineage
      : [...taskListData.lineage, genesisTask];
  return taskListData;
};

const getTaskById = async (taskId: memTaskI | string): Promise<taskI> => {
  if (typeof taskId !== 'string') {
    // const { topChild, utilized, ...baseTask } = taskId;
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

const updateTaskSafe = async (
  task: optionalTaskI,
  done: boolean = true,
  sync: boolean = true,
): Promise<taskI> => {
  const db = await getDb();
  const trueTask = await db.get('tasks', task.id);
  // mark a time of mod when syncing, if not just take it for what it is
  const data: taskI = {
    ...trueTask,
    ...task,
    lastModified: sync ? Date.now() : task.lastModified,
  };
  await db.put('tasks', data);
  if (sync) peerBroadcast('sync-tasks', { data, done });
  return data;
};

const createActivity = async (task: taskI, lastModified: number) => {
  const trans = (await getDb()).transaction(['tasks'], 'readwrite');
  const tasksDb = trans.objectStore('tasks');
  const index = tasksDb.index('position');
  const rng = IDBKeyRange.bound([task.parentId, 0], [task.parentId, Infinity]);
  let cursor = await index.openCursor(rng, 'prev');
  while (cursor) {
    await cursor.update({
      ...cursor.value,
      position: cursor.value.position + 1,
      lastModified,
    });
    cursor = await cursor.continue();
  }
  await tasksDb.put(task);
};

const placeFolderDb = async (task: taskI) => {
  const db = await getDb();
  const trans = db.transaction(['tasks'], 'readwrite');
  const tasks = trans.objectStore('tasks');
  const taskIndex = tasks.index('position');
  let range = IDBKeyRange.bound([task.parentId, 0], [task.parentId, Infinity]);
  let cursor = await taskIndex.openCursor(range);
  let position = 0;
  const changes: taskI[] = [];
  const pushChange = (taskToPush: taskI) => {
    changes.push({
      ...taskToPush,
      position,
      lastModified: task.lastModified,
    });
  };
  let changedTask: boolean = false;
  while (cursor) {
    if (cursor.value.status === 'hide') {
      cursor = await cursor.continue();
      continue;
    }
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
  for (let i = 0; i < changes.length; i++) await tasks.put(changes[i]);
};

// Used for correcting positions when an item is checked off or moved from one folder to another
const backfillPositions = async (parent: string, lastModified: number) => {
  const db = await getDb();
  const trans = db.transaction(['tasks'], 'readwrite');
  const tasksStore = trans.objectStore('tasks');
  const taskIndex = tasksStore.index('priority');
  let position = 0;
  let range = IDBKeyRange.bound([parent, 0], [parent, Infinity]);
  let cursor = await taskIndex.openCursor(range);
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

// handles stream of peer's data
const incomingTasks = async ({
  data,
  done,
}: incomingTaskI): Promise<boolean> => {
  const db = await getDb();
  const localData = await db.get('tasks', data.id);
  if (localData) {
    if (localData.lastModified < data.lastModified) {
      await db.put('tasks', data);
    }
  } else {
    await db.add('tasks', data);
  }
  return done;
};

const getAgendaDb = async (): Promise<taskI[]> => {
  const db = await getDb();
  const taskIndex = db
    .transaction('tasks')
    .objectStore('tasks')
    .index('byDueDate');
  let agenda: taskI[] = [];
  const now = Date.now();
  let entries = shownStamps;
  let pastDue = 5;
  let cursor = await taskIndex.openCursor(IDBKeyRange.bound(1, now), 'prev');
  while (cursor && pastDue) {
    if (cursor.value.status === 'hide') {
      cursor = await cursor.continue();
      continue;
    }
    agenda.push(cursor.value);
    if (cursor.value.status === 'todo') entries--;
    pastDue--;
    cursor = await cursor.continue();
  }
  agenda = agenda.reverse();
  cursor = await taskIndex.openCursor(
    IDBKeyRange.bound(now, Infinity, false, false),
  );
  while (cursor && entries) {
    if (cursor.value.status === 'hide') {
      cursor = await cursor.continue();
      continue;
    }
    agenda.push(cursor.value);
    if (cursor.value.status === 'todo') entries--;
    cursor = await cursor.continue();
  }
  return agenda;
};

const nextOnAgenda = async (taskId: string): Promise<taskI | null> => {
  const db = await getDb();
  const now = Date.now();
  const spread = minInMillis * 30;
  const taskIndex = db
    .transaction('tasks')
    .objectStore('tasks')
    .index('byDueDate');
  const range = IDBKeyRange.bound(now - spread, now + spread);
  let cursor = await taskIndex.openCursor(range);
  while (cursor) {
    const { status, id } = cursor.value;
    if (status === 'todo' && id !== taskId) return cursor.value;
    cursor = await cursor.continue();
  }
  return null;
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
  getSubtask,
  createActivity,
  incomingTasks,
  placeFolderDb,
  backfillPositions,
  getAgendaDb,
  pageAgenda,
  decedentOfWhich,
  onAgenda,
  updateTaskSafe,
  getSiblingTaskById,
  nextOnAgenda,
  getChildren,
};
