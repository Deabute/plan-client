// budgetDb.ts copyright 2021 Paul Beaudet MIT License

import { getDb } from './dbCore';
import type { budgetI } from '../shared/interface';
import { createOid } from '../isomorphic/oid';
import { defaultFrame } from '../stores/defaultData';

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

const updateBudget = async (budget: budgetI) => {
  const db = await getDb();
  await db.put('budget', {
    ...budget,
    lastModified: Date.now(),
  });
};

export { newBudget, getCurrentBudget, updateBudget, getLastBudget };
