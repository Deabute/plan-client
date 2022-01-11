// migrations.ts copyright 2021 Paul Beaudet MIT License

import { getDb, lastDbVersion } from './dbCore';
// import { figureSprintValues } from './timelineDb';

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
  // version 16 getUtilizedMillis should add temp values to start off from
  // if (lastDbVersion > 16) {
  //   await figureSprintValues();
  // }
};

export { migrateData };
