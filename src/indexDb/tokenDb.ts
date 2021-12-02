// tokenDb.ts ~ Copyright 2021 Paul Beaudet MIT License
import type {
  actionsI,
  relayPkt,
  sendPayload,
  syncCache,
} from '../connections/connectInterface';
import { wsSend } from '../connections/WebSocket';
import type { tokenI } from '../shared/interface';
import { syncingUp } from '../stores/peerStore';
import { getDb } from './dbCore';
import { packageCache } from './pskDb';

const getLatestToken = async (): Promise<tokenI | null> => {
  const db = await getDb();
  let cursor = await db
    .transaction('tokens')
    .objectStore('tokens')
    .openCursor(null, 'prev');
  // TODO test whether this should be backwards or index is needed
  if (cursor) return cursor.value;
  return null;
};

let syncBatch: relayPkt[] = [];
let batchOverflow: relayPkt[] = [];
// the timeout needs to be canceled if websocket frame capacity is exceeded (32k)
let batchTimeout: NodeJS.Timeout = null;
const SYNC_UP_FRAME = 1000;
const FRAME_LIMIT = 27000;

const sizeOfObjArrayAfterAdd = (objArray: any[], objToAdd: any) => {
  let size = new TextEncoder().encode(JSON.stringify(objToAdd)).length;
  objArray.forEach((obj) => {
    size += new TextEncoder().encode(JSON.stringify(obj)).length;
  });
  return size;
};

const batchSyncUp = async () => {
  const result = await getLatestToken();
  if (!result) return;
  const { token, ttl } = result;
  if (ttl < Date.now()) return;
  const { cypherText, cacheId }: syncCache = await packageCache(syncBatch);
  wsSend('syncUp', { cypherText, cacheId, token });
  batchTimeout = null;
  syncBatch = [];
  // this is just a timing thing, so long as the main batch staying in the frame
  // while the overflow is packing, the build up should release
  if (batchOverflow.length) {
    const { cypherText, cacheId }: syncCache = await packageCache(
      batchOverflow,
    );
    wsSend('syncUp', { cypherText, cacheId, token });
    batchOverflow = [];
  }
  syncingUp.set(false);
};

const syncUp = (action: actionsI, payload: sendPayload) => {
  const pkt: relayPkt = { action, payload };
  if (sizeOfObjArrayAfterAdd(syncBatch, pkt) < FRAME_LIMIT) {
    syncBatch.push(pkt);
  } else {
    if (!batchTimeout) {
      console.error('Exceeded frame size on first sync up packet!');
      return;
    }
    if (!batchOverflow.length) {
      clearTimeout(batchTimeout);
      batchSyncUp();
    }
    batchOverflow.push(pkt);
    return;
  }
  if (batchTimeout) return;
  syncingUp.set(true);
  batchTimeout = setTimeout(batchSyncUp, SYNC_UP_FRAME);
};

const addToken = async (token: tokenI) => {
  const db = await getDb();
  db.add('tokens', token);
};

export { getLatestToken, addToken, syncUp };
