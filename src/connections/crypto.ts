// crypto ~ Copyright 2021 Paul Beaudet MIT License
import { getKey, getPub, getConnectionCursor } from '../indexDb/connectionDB';
import { KEY_PAIR_CONFIG, SIGN_VERIFY_CONFIG } from '../stores/defaultData';
import type { announcePacket } from './connectInterface';

const stringToArrayBuff = (string: string): ArrayBuffer => {
  var buffer = new ArrayBuffer(string.length * 2); // 2 bytes for each char
  var bufferView = new Uint16Array(buffer);
  for (var i = 0; i < string.length; i++) {
    bufferView[i] = string.charCodeAt(i);
  }
  return buffer;
};

const signFromStrings = async (
  message: string,
  key: string = '',
): Promise<string> => {
  if (!key) key = await getKey();
  try {
    const messageBuffer = stringToArrayBuff(message);
    const cryptoKey = await crypto.subtle.importKey(
      'jwk',
      JSON.parse(key),
      KEY_PAIR_CONFIG,
      true,
      ['sign'],
    );
    const sig = await crypto.subtle.sign(
      SIGN_VERIFY_CONFIG,
      cryptoKey,
      messageBuffer,
    );
    return String.fromCharCode.apply(null, new Uint16Array(sig));
  } catch (error) {
    console.error(new Error(`signFromStrings: ${error}`));
  }
};

let numberOfPeers: number = 0;

const getAnnouncement = async (
  thisDevice: boolean = true,
): Promise<null | announcePacket> => {
  let cursor = await getConnectionCursor();
  const announce: announcePacket = {
    requester: '',
    peers: [],
    deviceCert: '',
    sig: '',
    thisDevice,
  };
  let key: string = '';
  while (cursor) {
    const { id, deviceCert, deviceKey } = cursor.value;
    if (deviceKey === '') {
      announce.peers = [...announce.peers, id];
    } else {
      announce.requester = id;
      announce.deviceCert = deviceCert;
      key = deviceKey;
    }
    cursor = await cursor.continue();
  }
  if (!announce.requester || !key || !announce.deviceCert) {
    return null;
  }
  numberOfPeers = announce.peers.length;
  announce.sig = await signFromStrings(announce.deviceCert, key);
  return announce;
};

const verifyFromPeerId = async (
  sig: string,
  message: string,
  peerId: string,
  deviceCert: string = '',
): Promise<boolean> => {
  const pubKey = await getPub(peerId, deviceCert);
  if (pubKey !== '' && typeof pubKey === 'string') {
    return await verifyFromStrings(sig, message, pubKey);
  }
  // if someone messes with the public key or id
  return false;
};

const verifyFromStrings = async (
  sig: string,
  message: string,
  pubKey: string,
): Promise<boolean> => {
  const pubCryptoKey = await crypto.subtle.importKey(
    'jwk',
    JSON.parse(pubKey),
    KEY_PAIR_CONFIG,
    true,
    ['verify'],
  );
  const validSig = await crypto.subtle.verify(
    SIGN_VERIFY_CONFIG,
    pubCryptoKey,
    stringToArrayBuff(sig),
    stringToArrayBuff(message),
  );
  return validSig;
};

export {
  signFromStrings,
  stringToArrayBuff,
  verifyFromStrings,
  verifyFromPeerId,
  getAnnouncement,
  numberOfPeers,
};
