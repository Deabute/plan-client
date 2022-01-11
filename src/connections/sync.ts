// sync ~ Copyright 2021 Paul Beaudet MIT License

import { getDb } from '../indexDb/dbCore';
import type { allDataTypes, budgetI, connectionI } from '../shared/interface';
import { allStores } from '../stores/defaultData';
import type { sendFuncI } from './connectInterface';

const incomingConnect = async ({
  data,
  done,
}: {
  done: boolean;
  data: connectionI;
}) => {
  if (data) {
    const db = await getDb();
    const localData = await db.get('connect', data.id);
    if (!localData) {
      await db.add('connect', {
        ...data,
        lastConnect: 0,
        firstConnect: 0,
      });
    }
  }
};

const incomingBudget = async ({
  data,
  done,
}: {
  done: boolean;
  data: budgetI;
}) => {
  const db = await getDb();
  const localData = await db.getFromIndex('budget', 'budgetOrder', data.number);
  const budgetDb = db.transaction('budget', 'readwrite').objectStore('budget');
  if (localData) {
    if (data.lastModified === localData.lastModified) {
      if (data.start < localData.start) {
        // take potentially older data in the case modified time is the same
        await budgetDb.delete(localData.id);
        await budgetDb.add(data);
      }
    } else if (data.lastModified > localData.lastModified) {
      // keep most recent modification, put if remote is most recent
      await budgetDb.delete(localData.id);
      await budgetDb.add(data);
    }
  } else {
    await budgetDb.add(data);
  }
};

// creates a stream of our local data to peer
const outgoingChanges = async (sendFunc: sendFuncI) => {
  const db = await getDb();
  const transaction = db.transaction(allStores);
  for (let i = 0; i < allStores.length; i++) {
    if (allStores[i] === 'timeline') continue;
    if (allStores[i] === 'connect') {
      // skip this for now, wouldn't want to export your own private key
      const store = transaction.objectStore('connect');
      let cursor = await store.openCursor();
      while (cursor) {
        const data = { ...cursor.value };
        cursor = await cursor.continue();
        if (data.deviceKey && cursor) {
          continue; // skip sending null data unless it comes with a done sig
        }
        sendFunc(`sync-connect`, {
          data: data.deviceKey ? null : data, // skip this device's own entry
          done: cursor ? false : true,
        });
      }
      continue;
    }
    const store = transaction.objectStore(allStores[i]);
    let cursor = await store.openCursor();
    while (cursor) {
      const data: allDataTypes = { ...cursor.value };
      cursor = await cursor.continue();
      sendFunc(`sync-${allStores[i]}`, {
        data,
        done: cursor ? false : true,
      });
    }
  }
  sendFunc('finish-sync');
};

export { outgoingChanges, incomingConnect, incomingBudget };
