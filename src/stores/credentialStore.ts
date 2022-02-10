// credentialStore.ts ~ Copyright 2022 Paul Beaudet MIT License

import { getDb } from '../indexDb/dbCore';
import type { profileI, tokenI } from '../shared/interface';
import { get, Writable, writable } from 'svelte/store';
import { generateProfile } from '../indexDb/profilesDb';
import { createOid } from '../isomorphic/oid';
import { wsSend } from '../connections/WebSocket';
import { statusMsgs } from './defaultData';

const authToken: Writable<tokenI> = writable({ token: '', ttl: 0 });
const authProfile: Writable<profileI | null> = writable(null);
const authStatus: Writable<string> = writable(statusMsgs.noAuth);

const requestToken = ({ id, password }: profileI) => {
  wsSend('requestAuthToken', { userId: id, password });
};

const loadCredentials = async () => {
  const db = await getDb();
  const transaction = db.transaction(['profiles', 'tokens']);
  const userDb = transaction.objectStore('profiles');
  const tokenDb = transaction.objectStore('tokens');
  let tCursor = await tokenDb.openCursor(null, 'prev');
  if (tCursor) authToken.set(tCursor.value);
  let cursor = await userDb.openCursor();
  let ourProfile: profileI = null;
  while (cursor) {
    if (cursor.value.key !== '') {
      ourProfile = cursor.value;
      if (cursor.value.status === 'primary') break;
    }
    cursor = await cursor.continue();
  }
  if (ourProfile) {
    authProfile.set(ourProfile);
    return;
  }
  authProfile.set(await generateProfile(createOid()));
};

authProfile.subscribe((profile) => {
  if (!profile) return;
  if (!profile.assumedAuthTTL) return;
  if (profile.assumedAuthTTL === 1) {
    authStatus.set(statusMsgs.interest);
    requestToken(profile);
  }
});

authToken.subscribe((token) => {
  if (!token.token) return;
  const now = Date.now();
  const ttl = now > token.ttl ? 0 : token.ttl - now;
  authStatus.set(ttl ? statusMsgs.auth : statusMsgs.noAuth);
  setTimeout(() => {
    authStatus.set(statusMsgs.renewal);
    requestToken(get(authProfile));
  }, ttl);
});

export { loadCredentials, authToken, authProfile, authStatus };
