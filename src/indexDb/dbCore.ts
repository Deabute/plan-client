// indexDB.ts copyright 2021 Paul Beaudet MIT License
import { IDBPDatabase, openDB, deleteDB } from 'idb';
import type { PlanDB } from '../shared/interface';

const DB_NAME = 'db0';
let dbObject: IDBPDatabase<PlanDB> | null = null;
let dbPromise: Promise<IDBPDatabase<PlanDB>> | null = null;
const currentDbVersion: number = 17;
// checking for last db version needs to be done after calling db
// in case of upgrade
let lastDbVersion: number = currentDbVersion;

const freshSetup = (db: IDBPDatabase<PlanDB>) => {
  const taskObjStore = db.createObjectStore('tasks', {
    keyPath: 'id',
  });
  taskObjStore.createIndex('byDueDate', 'dueDate');
  taskObjStore.createIndex('position', ['parentId', 'position']);
  taskObjStore.createIndex('priority', ['parentId', 'status', 'position']);
  const timeObjStore = db.createObjectStore('timeline', {
    keyPath: 'id',
  });
  timeObjStore.createIndex('timeOrder', 'start', { unique: true });
  const tachObjStore = db.createObjectStore('tach', { keyPath: 'id' });
  tachObjStore.createIndex('tachOrder', 'recorded', { unique: true });
  const budgetObjStore = db.createObjectStore('budget', {
    keyPath: 'id',
  });
  budgetObjStore.createIndex('budgetOrder', 'number', { unique: true });
  db.createObjectStore('connect', { keyPath: 'id' });
  const eventStore = db.createObjectStore('events', { keyPath: 'id' });
  eventStore.createIndex('eventOrder', 'timestamp');
  db.createObjectStore('views', { keyPath: 'name' });
  db.createObjectStore('profiles', { keyPath: 'id' });
  db.createObjectStore('tokens', { keyPath: 'ttl' });
  const keyStore = db.createObjectStore('psks', { keyPath: 'cacheId' });
  keyStore.createIndex('device', ['deviceId', 'number']);
};

const initDB = async (): Promise<IDBPDatabase<PlanDB>> => {
  try {
    const db0 = await openDB<PlanDB>(DB_NAME, currentDbVersion, {
      upgrade(db, oldVersion, newVersion, transaction) {
        lastDbVersion = oldVersion;
        if (oldVersion === 0) {
          console.log('starting from scratch');
          freshSetup(db);
          return;
        }
        if (oldVersion < 7) {
          console.log('fresh upgrade');
          // !!! This doesn't really work its more a hack !!!
          deleteDB(DB_NAME);
          // the delete op is async there is no way I know of to wait for it in this function
          // with out yielding to other operations looking to open the db for the app
          // before setup is complete
          freshSetup(db);
          // the way this works as is the delete op works, but the page needs to be refreshed
          // so it can start from scratch
          return;
        } // things really should look like the following going forward
        if (oldVersion < 8) {
          db.createObjectStore('connect', { keyPath: 'id' });
        }
        if (oldVersion < 9) {
          const budgetObjectStore = transaction.objectStore('budget');
          budgetObjectStore.deleteIndex('budgetOrder');
          budgetObjectStore.createIndex('budgetOrder', 'number', {
            unique: true,
          });
        }
        if (oldVersion < 10) {
          const eventStore = db.createObjectStore('events', { keyPath: 'id' });
          eventStore.createIndex('eventOrder', 'timestamp');
        }
        if (oldVersion < 11) {
          const tasksStore = transaction.objectStore('tasks');
          tasksStore.deleteIndex('byParent');
          tasksStore.createIndex('byDueDate', 'dueDate');
        }
        if (oldVersion < 12) {
          db.createObjectStore('views', { keyPath: 'name' });
        }
        if (oldVersion < 13) {
          db.createObjectStore('profiles', { keyPath: 'id' });
        }
        if (oldVersion < 14) {
          db.createObjectStore('tokens', { keyPath: 'ttl' });
        }
        if (oldVersion < 15) {
          const keyStore = db.createObjectStore('psks', { keyPath: 'cacheId' });
          keyStore.createIndex('device', ['deviceId', 'number']);
        }
        if (oldVersion < 17) {
          const tasksStore = transaction.objectStore('tasks');
          tasksStore.createIndex('position', ['parentId', 'position']);
        }
      },
      blocked() {
        console.log('blocked');
      },
      blocking() {
        console.log('blocking');
      },
      terminated() {
        console.log('terminated');
      },
    });
    dbObject = db0;
    return db0;
  } catch (error) {
    console.error(new Error(`IndexDB init: ${error}`));
  }
};

const getDb = async (): Promise<IDBPDatabase<PlanDB>> => {
  if (!dbPromise) dbPromise = initDB();
  return dbObject ? dbObject : await dbPromise;
};

const dropDB = async () => {
  await deleteDB('db0');
};

export { getDb, dropDB, currentDbVersion, lastDbVersion, DB_NAME };
