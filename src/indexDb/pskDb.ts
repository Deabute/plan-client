// pskDb.ts ~ Copyright 2021 Paul Beaudet MIT License
// database access functions for pre-shared-keys
import type {
  relayPkt,
  syncCache,
  syncDownPacket,
} from '../connections/connectInterface';
import { generatePassword } from '../isomorphic/oid';
import type { pskI } from '../shared/interface';
import { getConnectionId } from './connectionDB';
import { getDb } from './dbCore';

const encryptionType: AesKeyGenParams = {
  name: 'AES-GCM',
  length: 256,
};

const keyUsages: KeyUsage[] = ['encrypt', 'decrypt'];

interface pskExpanded {
  psk: pskI;
  cryptoKey: CryptoKey;
  ivArray: ArrayBuffer;
}

const arrayBuffer2string = (buffer: ArrayBuffer) => {
  return String.fromCharCode.apply(null, new Uint8Array(buffer));
};
const stringToArrayBuffer = (string: string) => {
  let buffer = new ArrayBuffer(string.length);
  let bufView = new Uint8Array(buffer);
  for (let i = 0, strLen = string.length; i < strLen; i++) {
    bufView[i] = string.charCodeAt(i);
  }
  return buffer;
};

const generateSharedKey = async (number: number = 0): Promise<pskExpanded> => {
  const deviceId = await getConnectionId();
  if (!deviceId) return;
  const db = await getDb();
  const cryptoKey = await crypto.subtle.generateKey(
    encryptionType,
    true,
    keyUsages,
  );
  const key = JSON.stringify(await crypto.subtle.exportKey('jwk', cryptoKey));
  let cacheId = '';
  while (!cacheId) {
    let id = generatePassword(30);
    const existing = await db.get('psks', id);
    if (!existing) cacheId = id;
  }
  const ivArray = crypto.getRandomValues(new Uint8Array(12));
  const iv = String.fromCharCode.apply(null, ivArray);
  let psk: pskI = {
    cacheId,
    key,
    number,
    type: JSON.stringify(encryptionType),
    deviceId,
    iv,
    used: false,
  };
  await db.add('psks', psk);
  return {
    psk,
    cryptoKey,
    ivArray,
  };
};

const getLastKey = async (): Promise<pskExpanded> => {
  const deviceId = await getConnectionId();
  if (!deviceId) return;
  const db = await getDb();
  const pksStore = db.transaction('psks').objectStore('psks');
  const pskIndex = pksStore.index('device');
  const upperBound = [deviceId, Infinity];
  const lowerBound = [deviceId, 0];
  let cursor = await pskIndex.openCursor(
    IDBKeyRange.bound(lowerBound, upperBound),
    'prev',
  );
  if (cursor) {
    const { iv, key } = cursor.value;
    return {
      psk: cursor.value,
      ivArray: stringToArrayBuffer(iv),
      cryptoKey: await crypto.subtle.importKey(
        'jwk',
        JSON.parse(key),
        encryptionType,
        true,
        keyUsages,
      ),
    };
  }
  return await generateSharedKey();
};

const packageCache = async (data: relayPkt[]): Promise<syncCache> => {
  const { psk, cryptoKey, ivArray } = await getLastKey();
  const nextKey = await generateSharedKey(psk.number + 1);
  const msgBuffer = new TextEncoder().encode(
    JSON.stringify({
      nextPSK: nextKey.psk,
      data,
    }),
  );
  const cypherText: string = arrayBuffer2string(
    await crypto.subtle.encrypt(
      { name: encryptionType.name, iv: ivArray },
      cryptoKey,
      msgBuffer,
    ),
  );
  const db = await getDb();
  await db.put('psks', { ...psk, used: true });
  return { cacheId: psk.cacheId, cypherText };
};

const unpackCache = async (cache: syncCache): Promise<relayPkt[]> => {
  try {
    const db = await getDb();
    const psk = await db.get('psks', cache.cacheId);
    if (!psk) return;
    const iv = stringToArrayBuffer(psk.iv);
    const cryptoKey = await crypto.subtle.importKey(
      'jwk',
      JSON.parse(psk.key),
      encryptionType,
      true,
      keyUsages,
    );
    const cipherBuffer = stringToArrayBuffer(cache.cypherText);
    const decrypted = await crypto.subtle.decrypt(
      { name: encryptionType.name, iv },
      cryptoKey,
      cipherBuffer,
    );
    const pkt: syncDownPacket = JSON.parse(new TextDecoder().decode(decrypted));
    await db.put('psks', pkt.nextPSK);
    await db.put('psks', { ...psk, used: true });
    return pkt.data.map(({ action, payload }) => {
      return {
        action,
        payload,
        peerId: psk.deviceId,
      };
    });
  } catch (error) {
    console.error(new Error(error));
  }
  return null;
};

const getNextConnectionCacheId = async (): Promise<string> => {
  const db = await getDb();
  const trans = db.transaction(['connect', 'psks']);
  const connectStore = trans.objectStore('connect');
  const pskStore = trans.objectStore('psks');
  const pskIndex = pskStore.index('device');

  let deviceId = '';
  // TODO Should get a cache id for all connections that may need to be updated
  let connectCursor = await connectStore.openCursor();
  while (connectCursor) {
    const { deviceKey, id } = connectCursor.value;
    if (!deviceKey) {
      // this needs to consider many clients in future
      deviceId = id;
      break;
    }
    connectCursor = await connectCursor.continue();
  }
  if (!deviceId) return '';
  const lowerBound = [deviceId, 0];
  const upperBound = [deviceId, Infinity];
  let pskCursor = await pskIndex.openCursor(
    IDBKeyRange.bound(lowerBound, upperBound),
    'prev',
  );
  // get second to last psk (last one is pending to be used)
  let pendingCacheId: string = '';
  while (pskCursor) {
    if (pskCursor.value.used) break;
    pendingCacheId = pskCursor.value.cacheId;
    pskCursor = await pskCursor.continue();
  }
  return pendingCacheId;
};

export { packageCache, unpackCache, getNextConnectionCacheId };
