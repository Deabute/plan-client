// dataChannels ~ Copyright 2021 Paul Beaudet MIT License

import { get } from 'svelte/store';
import { connectionTimestamp } from '../indexDb/connectionDB';
import { getDb } from '../indexDb/dbCore';
import { syncUp } from '../indexDb/tokenDb';
import type { profileI, pskI } from '../shared/interface';
import { firstSync, rtcPeers } from '../stores/peerStore';
import type {
  actionsI,
  dataOnFuncs,
  handlerI,
  msgPayload,
  relayPkt,
  req,
  sendFuncI,
  sendPayload,
} from './connectInterface';
import { numberOfPeers } from './crypto';
import { incomingBudget, incomingConnect, outgoingChanges } from './sync';

let beating = false;

const heartbeat = () => {
  setTimeout(() => {
    rtcPeers.update((peers) => {
      peers = peers.filter((peer) => {
        if (!peer.connected) return peer;
        peer.heartbeat--;
        if (peer.heartbeat) {
          peer.sendFunc('ack');
          return peer;
        } else {
          console.log(`${peer.peerId} hb: disconnecting`);
          connectionTimestamp(peer.peerId);
        }
      });
      // call next beat unless we disconnected our last peer
      if (peers.length) heartbeat();
      beating = peers.length ? true : false;
      return peers;
    });
  }, 2000);
};

rtcPeers.subscribe((peers) => {
  if (peers.length && !beating) {
    heartbeat();
    beating = true;
  }
});

const detectHeartbeat = (peerId: string) => {
  rtcPeers.update((peers) => {
    for (let i = 0; i < peers.length; i++) {
      if (peers[i].peerId === peerId) {
        peers[i].heartbeat = 4;
        return peers;
      }
    }
    return peers;
  });
};

const disconnect = (peerId: string) => {
  connectionTimestamp(peerId);
  rtcPeers.update((peers) => {
    return peers.filter((peer) => peer.peerId !== peerId);
  });
};

const createSendFunc = (channel: RTCDataChannel): sendFuncI => {
  return (action: actionsI, payload: sendPayload) => {
    let sendString: string = '';
    try {
      const relayPkt: relayPkt = { action, payload };
      sendString = JSON.stringify(relayPkt);
    } catch (error) {
      console.error(new Error(`data send: ${error}`));
    }
    if (!sendString) return;
    channel.send(sendString);
  };
};

const handlers: handlerI[] = [];

const onEvent = (action: actionsI, func: dataOnFuncs) => {
  handlers.push({ action, func });
};

onEvent(
  'msg',
  async ({ data, peerId }: { peerId: string; data: msgPayload }) => {
    console.log(`${peerId} says ${data.msg}`);
  },
);

// response to a heartbeat tick sent after inactivity
onEvent('ack', async ({ peerId }) => {
  detectHeartbeat(peerId);
});
onEvent('sync-budget', incomingBudget);
onEvent('sync-connect', incomingConnect);
onEvent('disconnect', async ({ peerId }: { peerId: string }) => {
  disconnect(peerId);
});

const handleDataSync = async (pkt: relayPkt) => {
  let req: req = {};
  if (pkt?.peerId) req.peerId = pkt.peerId;
  if (pkt?.payload?.data) req.data = pkt.payload.data;
  if (pkt?.payload?.done) req.done = pkt.payload.done;
  for (let i = 0; i < handlers.length; i++) {
    if (pkt.action === handlers[i].action) {
      await handlers[i].func(req);
      break;
    }
  }
};

const incoming = (peerId: string) => {
  return (event: MessageEvent) => {
    // handles incoming RTC data channel msgs
    let req: relayPkt = { action: 'msg' };
    try {
      req = JSON.parse(event.data);
    } catch (error) {
      // Todo respond with invalid
      console.error(new Error(`incoming json parse ${error}`));
      return;
    }
    // append peer id to incoming events
    const reqWithId: relayPkt = { ...req, peerId };
    handleDataSync(reqWithId);
  };
};

// once the two clients connect if its the first time one will decide to dump their data
// Meanwhile the other is going to try to spam the other with data to fill what is being emptied
// dont set or send out going until this is settled
const onChannelConnection = (peerId: string, sendFunc: sendFuncI) => {
  // returns the event handler for ondatachannel with peerId in closure
  return (event: RTCDataChannelEvent) => {
    const channel = event.channel;
    channel.onmessage = incoming(peerId);
    channel.onopen = async () => {
      rtcPeers.update((peers) => {
        for (let i = 0; i < peers.length; i++) {
          if (peers[i].peerId === peerId) {
            peers[i].connected = true;
            return peers;
          }
        }
        return peers;
      });
      await connectionTimestamp(peerId);
      await outgoingChanges(sendFunc);
      const first = get(firstSync);
      if (first && !first.done && first.peerId === peerId) {
        firstSync.set({ ...first, done: true });
      }
    };
    channel.onclose = () => {
      disconnect(peerId);
    };
  };
};

const createDataChannel = (
  rtcObj: RTCPeerConnection,
  peerId: string,
): sendFuncI => {
  // send func has to be created from this data channel
  // not the one from the onChannel event
  const dataChannel = rtcObj.createDataChannel(peerId);
  const sendFunc = createSendFunc(dataChannel);
  rtcObj.ondatachannel = onChannelConnection(peerId, sendFunc);
  return sendFunc;
};

// sends a message to all connections
const peerBroadcast = (action: actionsI, payload: sendPayload) => {
  let peersSentTo = 0;
  rtcPeers.update((peers) => {
    return peers.map((peer) => {
      if (peer.sendFunc) {
        peer.sendFunc(action, payload);
        peersSentTo++;
      }
      return peer;
    });
  });
  // don't bother the server if these change have been synced with all connections
  if (peersSentTo !== numberOfPeers) syncUp(action, payload);
};

onEvent('sync-psks', async ({ data }: { data: pskI }) => {
  const db = await getDb();
  const existing = await db.get('psks', data.cacheId);
  if (existing?.used) return;
  await db.put('psks', data);
});

onEvent('sync-profiles', async ({ data }: { data: profileI }) => {
  const db = await getDb();
  const exists = await db.get('profiles', data.id);
  if (!exists) await db.put('profiles', data);
});

onEvent('finish-sync', async ({ peerId }: { peerId: string }) => {
  rtcPeers.update((peers) => {
    for (let i = 0; i < peers.length; i++) {
      if (peers[i].peerId === peerId) {
        peers[i].sank = true;
        return peers;
      }
    }
    return peers;
  });
});

export { createDataChannel, peerBroadcast, onEvent, handleDataSync };
