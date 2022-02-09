// connectInterface ~ Copyright 2021 Paul Beaudet MIT License
import type { allDataTypes, taskI, pskI } from '../shared/interface';

interface requesterInfo {
  requester: string;
  sig: string;
  deviceCert: string;
  rmData: boolean; // if this is the first sync, is data removed?
}

interface makeOfferPacket extends requesterInfo {
  sig: string;
}

interface announcePacket extends makeOfferPacket {
  peers: string[];
}

type actionsI =
  | 'msg'
  | 'task'
  | 'sync-tasks'
  | 'sync-budget'
  | 'sync-timeline'
  | 'sync-connect'
  | 'sync-events'
  | 'sync-profiles'
  | 'sync-psks'
  | 'disconnect'
  | 'record'
  | 'check-off'
  | 'finish-sync'
  | 'ack';

interface msgPayload {
  msg: string;
}
interface taskPayload {
  body: string;
  lineage: taskI[];
  currentTimestamp: number;
  taskId: string;
}
interface sendPayload {
  data: allDataTypes | msgPayload | taskPayload | null;
  done?: boolean;
}

interface relayPkt {
  action: actionsI;
  payload?: sendPayload;
  peerId?: string;
}
interface req {
  data?: allDataTypes | msgPayload | taskPayload | null;
  done?: boolean;
  peerId?: string;
}

type dataOnFuncs = (req: req) => Promise<void>;
type sendFuncI = (action: actionsI, payload?: sendPayload) => void;

interface handlerI {
  action: string;
  func: dataOnFuncs;
}

interface peersI {
  peerId: string;
  rtcObj: RTCPeerConnection;
  iceCandidates: RTCIceCandidate[];
  setRemoteSDP: boolean;
  remoteCandidates: RTCIceCandidate[];
  sendFunc: sendFuncI | null;
  connected: boolean;
  sank: boolean;
  heartbeat: number;
  // disconnect: NodeJS.Timeout;
}

interface syncCache {
  cacheId: string;
  cypherText: string;
}

interface syncDownPacket {
  data: relayPkt[];
  nextPSK: pskI;
}

type generalStatus = 'P2P' | 'Offline' | 'Disconnected' | 'Cloud';
type specificStatus = 'Syncing' | 'Idle' | 'Pending Upload';

export type {
  announcePacket,
  makeOfferPacket,
  peersI,
  dataOnFuncs,
  sendFuncI,
  handlerI,
  actionsI,
  requesterInfo,
  syncCache,
  syncDownPacket,
  sendPayload,
  relayPkt,
  msgPayload,
  req,
  taskPayload,
  generalStatus,
  specificStatus,
};
