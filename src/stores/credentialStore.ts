// credentialStore.ts ~ Copyright 2022 Paul Beaudet MIT License

import { getDb } from '../indexDb/dbCore';
import type { profileI, tokenI } from '../shared/interface';
import { Writable, writable } from 'svelte/store';
import { generateProfile, getProfile } from '../indexDb/profilesDb';
import { createOid } from '../isomorphic/oid';
import { wsSend } from '../connections/WebSocket';
import { statusMsgs } from './defaultData';
import { secondTick } from './timeStore';

const authToken: Writable<tokenI> = writable({ token: '', ttl: 0 });
const authProfile: Writable<profileI> = writable({
  assumedAuthTTL: 0,
  name: '',
  key: '',
  cert: '',
  password: '',
  lastConnect: 0,
  firstConnect: 0,
  status: 'undecided',
  id: '',
});
const authStatus: Writable<string> = writable(statusMsgs.noAuth);

const loadCredentials = async () => {
  const db = await getDb();
  const transaction = db.transaction(['profiles', 'tokens']);
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
  ourProfile = ourProfile ? ourProfile : await generateProfile(createOid());
  authProfile.set(ourProfile);
  // Make sure we have a token if we have an active profile
  if (ourProfile.assumedAuthTTL < 2) return;
  const tokenDb = transaction.objectStore('tokens');
  let tCursor = await tokenDb.openCursor(null, 'prev');
  if (tCursor) authToken.set(tCursor.value);
};

authProfile.subscribe(({ assumedAuthTTL, id, password }) => {
  if (assumedAuthTTL === 0) return;
  if (assumedAuthTTL === 1) {
    authStatus.set(statusMsgs.interest);
    wsSend('requestAuthToken', { userId: id, password });
  }
});

let unsubscriber = null;

authToken.subscribe((token) => {
  if (!token.token) return;
  authStatus.set(Date.now() > token.ttl ? statusMsgs.auth : statusMsgs.renewal);
  if (unsubscriber) unsubscriber();
  unsubscriber = secondTick.subscribe(async (tick) => {
    if (tick > token.ttl) {
      authStatus.set(statusMsgs.renewal);
      const { id, password } = await getProfile();
      wsSend('requestAuthToken', { userId: id, password });
      unsubscriber();
      unsubscriber = null;
    }
  });
});

export { loadCredentials, authToken, authProfile, authStatus };
