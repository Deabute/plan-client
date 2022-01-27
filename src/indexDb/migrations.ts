// migrations.ts copyright 2021 Paul Beaudet MIT License

import { getPriorityIndexRange } from '../stores/defaultData';
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
  // version 17 needs to create an order for done items in order to show them
  if (lastDbVersion < 17) {
    const lastPosObj = {};
    const trans = db.transaction(['tasks'], 'readwrite');
    const tasksDb = trans.objectStore('tasks');
    const index = tasksDb.index('priority');
    const posIndex = tasksDb.index('position');
    let parents = ['1'];
    let pIndex = 0;
    // Pass 1, build parents and last positions of todos
    while (parents.length < pIndex) {
      if (parents[pIndex] === null) {
        pIndex++;
        continue;
      }
      let cursor = await index.openCursor(
        getPriorityIndexRange(parents[pIndex]),
      );
      let lastPos: number = null;
      while (cursor) {
        lastPos = cursor.value.position;
        parents.push(cursor.value.id);
        cursor = await cursor.continue();
      }
      lastPosObj[parents[pIndex]] = lastPos;
      pIndex++;
    }
    // Pass 2: change positions of done items
    for (let i = 0; i < parents.length; i++) {
      let dCursor = await index.openCursor(
        IDBKeyRange.bound(
          [parents[i], 'done', 0],
          [parents[i], 'done', Infinity],
        ),
      );
      let position =
        lastPosObj[parents[i]] === null ? 0 : lastPosObj[parents[i]];
      while (dCursor) {
        // Pass 3 Done introspection
        await orderKids(dCursor.value.id, posIndex);
        dCursor.update({
          ...dCursor.value,
          position,
        });
        position++;
        dCursor = await dCursor.continue();
      }
    }
  }
};

export { migrateData };
