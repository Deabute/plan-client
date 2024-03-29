// credentialStore.ts ~ Copyright 2022 Paul Beaudet MIT License

import { getDb } from '../indexDb/dbCore';
import type { profileI, tokenI } from '../shared/interface';
import { Writable, writable } from 'svelte/store';
import { generateProfile, getProfile } from '../indexDb/profilesDb';
import { createOid } from '../isomorphic/oid';
import { wsSend } from '../connections/WebSocket';
import { defaultProfile, defaultToken, statusMsgs } from './defaultData';
import { secondTick } from './timeStore';

const authToken: Writable<tokenI> = writable(defaultToken);
const authProfile: Writable<profileI> = writable(defaultProfile);
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
    setTimeout(() => {
      wsSend('requestAuthToken', { userId: id, password });
    }, 1500);
  }
});

let unsubscriber = null;

authToken.subscribe((token) => {
  if (!token.token) return;
  authStatus.set(Date.now() > token.ttl ? statusMsgs.renewal : statusMsgs.auth);
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
