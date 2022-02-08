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
  // console.log(`running initUser ${Date.now()}`);
  const db = await getDb();
  const transaction = db.transaction(['profiles', 'connect']);
  const userDb = transaction.objectStore('profiles');
  const connectDb = transaction.objectStore('connect');
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
  // payments can not be confirmed without user key
  // grab id if one has already been made (legacy data)
  let connectCursor = await connectDb.openCursor();
  let nameId: string = '';
  while (connectCursor) {
    const { deviceKey, userId } = connectCursor.value;
    if (deviceKey !== '') nameId = userId;
    connectCursor = await connectCursor.continue();
  }

  // connections could not have been made without our device private key
  // Peer sync not running
  return await generateProfile(nameId ? nameId : createOid());
};

const updateProfile = async (profile: profileI): Promise<profileI> => {
  const db = await getDb();
  const newProfile = { ...profile, lastConnect: Date.now() };
  await db.put('profiles', newProfile);
  return newProfile;
};

// this wont work with multi profile sync
const setPrimary = async (isPrimary: boolean = true): Promise<boolean> => {
  const db = await getDb();
  const transaction = db.transaction(['profiles', 'connect'], 'readwrite');
  const profileDb = transaction.objectStore('profiles');
  const connectDb = transaction.objectStore('connect');
  let connectCursor = await connectDb.openCursor();
  let currentProfile = '';
  while (connectCursor) {
    if (connectCursor.value.deviceKey) {
      currentProfile = connectCursor.value.userId;
      break;
    }
    connectCursor = await connectCursor.continue();
  }
  let cursor = await profileDb.openCursor();
  while (cursor) {
    if (cursor.value.id === currentProfile) {
      // TODO if one is already primary it should stay primary
      cursor.update({
        ...cursor.value,
        status: isPrimary ? 'primary' : 'undecided',
        lastConnect: Date.now(), // this might more appropriately be called last set
      });
      return true;
    }
    cursor = await cursor.continue();
  }
  return false;
};

const getPrimary = async (): Promise<profileI> => {
  const db = await getDb();
  const transaction = db.transaction(['profiles']);
  const userDb = transaction.objectStore('profiles');
  let cursor = await userDb.openCursor();
  while (cursor) {
    if (cursor.value.status === 'primary') {
      return cursor.value;
    }
    cursor = await cursor.continue();
  }
  return null;
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
  setPrimary,
  getPrimary,
  removeDataToBeSecondary,
  clearData,
};
