// profileDb.ts ~ Copyright 2021 Paul Beaudet MIT License

import { allStores, KEY_PAIR_CONFIG } from '../stores/defaultData';
import { getDb } from './dbCore';
import { getDeviceId } from '../shared/conversions';
import { createOid, generatePassword } from '../isomorphic/oid';
import type { profileI } from '../shared/interface';

const generateProfile = async (name: string): Promise<profileI> => {
  const db = await getDb();
  const keyPair: CryptoKeyPair = await crypto.subtle.generateKey(
    KEY_PAIR_CONFIG,
    true,
    ['sign', 'verify'],
  );
  const pubKeyString = JSON.stringify(
    await crypto.subtle.exportKey('jwk', keyPair.publicKey),
  );
  const deviceId = await getDeviceId(keyPair.publicKey);
  const timestamp = Date.now();
  const user: profileI = {
    id: deviceId,
    name, // default to showing id, but can be short handed later
    key: JSON.stringify(
      await crypto.subtle.exportKey('jwk', keyPair.privateKey),
    ),
    cert: pubKeyString,
    password: generatePassword(),
    assumedAuthTTL: 0,
    lastConnect: timestamp,
    firstConnect: timestamp,
    status: 'undecided',
  };
  db.add('profiles', user);
  return user;
};

// Also can be used as get user, will create a user if one doesn't exist
const initProfile = async (): Promise<profileI> => {
  const db = await getDb();
  const transaction = db.transaction(['profiles']);
  const userDb = transaction.objectStore('profiles');
  let cursor = await userDb.openCursor();
  let ourProfile: profileI = null;
  while (cursor) {
    if (cursor.value.key !== '') {
      ourProfile = cursor.value;
      if (cursor.value.status === 'primary') break;
    }
    cursor = await cursor.continue();
  }
  if (ourProfile) return ourProfile;
  return await generateProfile(createOid());
};

const updateProfile = async (profile: profileI): Promise<profileI> => {
  const db = await getDb();
  const changeProfile = { ...profile, lastConnect: Date.now() };
  await db.put('profiles', changeProfile);
  return changeProfile;
};

const getAllProfiles = async (): Promise<profileI[]> => {
  const userArray: profileI[] = [];
  const db = await getDb();
  const transaction = db.transaction(['profiles']);
  const userDb = transaction.objectStore('profiles');
  let cursor = await userDb.openCursor();
  while (cursor) {
    userArray.push(cursor.value); // found a user key
    cursor = await cursor.continue();
  }
  return userArray;
};

const removeDataToBeSecondary = async () => {
  const db = await getDb();
  const transaction = db.transaction(
    ['tasks', 'timeline', 'budget', 'events', 'tach'],
    'readwrite',
  );
  const tasks = transaction.objectStore('tasks');
  const timeline = transaction.objectStore('timeline');
  const budget = transaction.objectStore('budget');
  const events = transaction.objectStore('events');
  const tach = transaction.objectStore('tach');
  await tasks.clear();
  await timeline.clear();
  await budget.clear();
  await events.clear();
  await tach.clear();
};

const clearData = async () => {
  const db = await getDb();
  const transaction = db.transaction(allStores, 'readwrite');
  for (let i = 0; i < allStores.length; i++) {
    const store = transaction.objectStore(allStores[i]);
    await store.clear();
  }
};

export {
  generateProfile,
  initProfile,
  updateProfile,
  getAllProfiles,
  removeDataToBeSecondary,
  clearData,
};
