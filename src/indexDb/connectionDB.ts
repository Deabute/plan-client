// connectionDb.ts copyright 2021 Paul Beaudet MIT License
import type {
  PlanDB,
  IDBPCursorWithValue,
  connectionI,
} from '../shared/interface';
import { getDb } from './dbCore';
import { getDeviceId } from '../shared/conversions';
import { KEY_PAIR_CONFIG } from '../stores/defaultData';

const getConnectionCursor = async (): Promise<
  IDBPCursorWithValue<PlanDB, ['connect'], 'connect', unknown, 'readonly'>
> => {
  const db = await getDb();
  const transaction = db.transaction('connect');
  const connectDb = transaction.objectStore('connect');
  return connectDb.openCursor();
};

const newConnection = async (id: string) => {
  const db = await getDb();
  await db.add('connect', {
    id,
    deviceName: id,
    deviceKey: '',
    deviceCert: '',
    userId: '',
    lastConnect: 0,
    firstConnect: 0,
  });
};

// returns true if device already exist in store
const checkExisting = async (id: string): Promise<boolean> => {
  const db = await getDb();
  const result = await db.get('connect', id);
  // second condition should prevent a mirror attack
  return result && !result.deviceKey ? true : false;
};

const deleteConnection = async (id: string) => {
  const db = await getDb();
  await db.delete('connect', id);
};

const initDeviceID = async (userId: string) => {
  const db = await getDb();
  const transaction = db.transaction('connect');
  const connectDb = transaction.objectStore('connect');
  let cursor = await connectDb.openCursor();
  // Check if self-data exists already
  while (cursor) {
    if (cursor.value.deviceKey !== '') return;
    cursor = await cursor.continue();
  }
  // If not create self-data
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
  db.add('connect', {
    id: deviceId,
    deviceName: deviceId, // default to showing id, but can be short handed later
    deviceKey: JSON.stringify(
      await crypto.subtle.exportKey('jwk', keyPair.privateKey),
    ),
    deviceCert: pubKeyString,
    userId,
    lastConnect: timestamp,
    firstConnect: timestamp,
  });
};

const connectionTimestamp = async (peerId: string) => {
  const db = await getDb();
  const transaction = db.transaction('connect', 'readwrite');
  const connectStore = transaction.objectStore('connect');
  let cursor = await connectStore.openCursor();
  while (cursor) {
    if (cursor.value.id === peerId) {
      const currentTime = Date.now();
      const { firstConnect } = cursor.value;
      cursor.update({
        ...cursor.value,
        // check if this is the first time connecting
        firstConnect: firstConnect ? firstConnect : currentTime,
        lastConnect: currentTime,
      });
      return;
    }
    cursor = await cursor.continue();
  }
};

const getKey = async (pub: boolean = false): Promise<string> => {
  let cursor = await getConnectionCursor();
  while (cursor) {
    if (cursor.value.deviceKey) {
      return pub ? cursor.value.deviceCert : cursor.value.deviceKey;
    }
    cursor = await cursor.continue();
  }
  return '';
};

// either gets public key or decides if the one passed is trust worthy
const getPub = async (
  peerId: string,
  deviceCert: string = '',
): Promise<string> => {
  if (!peerId) return '';
  const db = await getDb();
  const result = await db.get('connect', peerId);
  // if not result, this connection hasn't even been approved
  if (!result) return '';
  if (result.deviceCert) {
    // if there was a cert passed and it doesn't match what we have for this id
    // ignore it
    if (deviceCert && deviceCert !== result.deviceCert) {
      console.error(new Error('deviceCert mis-match'));
      return '';
    }
    return result.deviceCert;
  }
  // if there isn't a result deviceCert and one is passed to this function
  // Trust it on the first pass and add it to our result document
  if (deviceCert) {
    const pubCryptoKey = await crypto.subtle.importKey(
      'jwk',
      JSON.parse(deviceCert),
      KEY_PAIR_CONFIG,
      true,
      ['verify'],
    );
    const matchDeviceId = await getDeviceId(pubCryptoKey);
    if (matchDeviceId !== peerId) {
      console.error(
        new Error(`peer ${peerId} did not match with ${matchDeviceId}`),
      );
      return '';
    }
    await db.put('connect', {
      ...result,
      deviceCert,
    });
    return deviceCert;
  }
};

const getConnectionId = async (): Promise<string> => {
  let cursor = await getConnectionCursor();
  while (cursor) {
    if (cursor.value.deviceKey) return cursor.value.id;
    cursor = await cursor.continue();
  }
  return null;
};

const getConnections = async (
  firstCon: boolean = false,
): Promise<{
  connections: connectionI[];
  id: string;
}> => {
  const connections: connectionI[] = [];
  let id = '';
  const db = await getDb();
  const transaction = db.transaction(['connect', 'profiles'], 'readwrite');
  const connectDb = transaction.objectStore('connect');

  let userId: string = '';
  if (firstCon) {
    // if this is the first connection set userId to the primary profile
    const userDb = transaction.objectStore('profiles');
    let uCursor = await userDb.openCursor();
    while (uCursor) {
      if (uCursor.value.status === 'primary') {
        userId = uCursor.value.id;
        break;
      }
      uCursor = await uCursor.continue();
    }
  }
  let cursor = await connectDb.openCursor();
  while (cursor) {
    if (userId) await cursor.update({ ...cursor.value, userId });
    if (cursor.value.deviceKey === '') {
      connections.push(cursor.value);
    } else {
      id = cursor.value.id;
    }
    cursor = await cursor.continue();
  }
  return {
    connections,
    id,
  };
};

export {
  getConnectionCursor,
  newConnection,
  checkExisting,
  deleteConnection,
  initDeviceID,
  connectionTimestamp,
  getKey,
  getPub,
  getConnectionId,
  getConnections,
};
