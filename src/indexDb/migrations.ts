// migrations.ts copyright 2021 Paul Beaudet MIT License

import { getParentRange } from '../stores/defaultData';
import { getDb, lastDbVersion } from './dbCore';
import { figureSprintValues } from './timelineDb';

const orderKids = async (id: string, index: any) => {
  let cursor = await index.openCursor(
    IDBKeyRange.bound([id, 0], [id, Infinity]),
  );
  let position = 0;
  while (cursor) {
    if (cursor.value.status === 'hide') {
      cursor = await cursor.continue();
      continue;
    }
    await orderKids(cursor.value.id, index);
    cursor.update({
      ...cursor.value,
      position,
    });
    position++;
    cursor = await cursor.continue();
  }
};

const migrateData = async () => {
  // call db first to make sure lastDbVersion is set properly
  const db = await getDb();
  if (lastDbVersion === 0) {
    // in the zeroth case there is no data to migrate
    return;
  }
  // after wards any version should be able to come up to date with latest
  if (lastDbVersion < 11) {
    // add due date to tasks
    const trans = db.transaction(['tasks'], 'readwrite');
    const tasksStore = trans.objectStore('tasks');
    let tCursor = await tasksStore.openCursor();
    while (tCursor) {
      if (tCursor.value.dueDate === undefined) {
        tCursor.update({
          ...tCursor.value,
          dueDate: 0,
        });
      }
      // these two updates were done one after another individually pre-launch
      // not sure if a double update would work in a singular migration
      if (tCursor.value.autoAssigned === undefined) {
        tCursor.update({
          ...tCursor.value,
          autoAssigned: tCursor.value.fraction ? false : true,
        });
      }
      tCursor = await tCursor.continue();
    }
  }
  // version 16 adds temp values for utilization to start off from
  if (lastDbVersion < 16) await figureSprintValues();
  // version 18 needs to create an order for done items in order to show them properly
  if (lastDbVersion < 18) {
    const trans = db.transaction(['tasks'], 'readwrite');
    const tasksDb = trans.objectStore('tasks');
    // const index = tasksDb.index('priority');
    const posIndex = tasksDb.index('position');

    const count = async (parent: string): Promise<number> => {
      let cursor = await posIndex.openCursor(getParentRange(parent));
      let ct = 0;
      while (cursor) {
        if (cursor.value.status === 'hide') {
          await cursor.delete();
        } else {
          ct++;
        }
        cursor = await cursor.continue();
      }
      return ct;
    };

    const order = async (parent: string, position: number) => {
      if (!position) return;
      let cursor = await posIndex.openCursor(getParentRange(parent), 'prev');
      while (cursor) {
        if (cursor.value.status === 'hide') {
          cursor = await cursor.continue();
          continue;
        }
        await order(cursor.value.id, await count(cursor.value.id));
        position--;
        cursor.update({ ...cursor.value, position });
        cursor = await cursor.continue();
      }
    };

    await order('1', await count('1'));
    // remove old "done" data
    let cursor = await posIndex.openCursor(getParentRange('2'), 'prev');
    while (cursor) {
      cursor.delete();
      cursor = await cursor.continue();
    }
  }
};

export { migrateData };
