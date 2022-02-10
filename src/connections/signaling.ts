// signaling Copyright 2021 Paul Beaudet MIT License
import { wsOn, wsSend } from './WebSocket';
import { checkExisting, getKey } from '../indexDb/connectionDB';
import type { announcePacket } from './connectInterface';
import { peerSyncEnabled, rtcPeers, pendingPeers } from '../stores/peerStore';
import { createDataChannel } from './dataChannels';
import { signFromStrings, verifyFromPeerId, getAnnouncement } from './crypto';

const iceServers = [
  { urls: process.env.ICE_SERVER_1 },
  { urls: process.env.ICE_SERVER_2 },
];

const onIceGatheringChange = (
  peerId: string,
  rtcObj: RTCPeerConnection,
  type: 'offer' | 'answer',
) => {
  return async () => {
    if (rtcObj.iceGatheringState === 'complete') {
      const deviceCert = await getKey(true);
      rtcPeers.update((peers) => {
        return peers.map((peer) => {
          if (peer.peerId === peerId) {
            const sdpString = JSON.stringify(peer.rtcObj.localDescription);
            signFromStrings(sdpString).then((sig) => {
              wsSend(type, {
                peerId,
                sig,
                sdpString,
                deviceCert,
                sdp: peer.rtcObj.localDescription,
              });
            });
          }
          return peer;
        });
      });
    }
  };
};

const createRTCPeer = async (
  peerId: string,
  type: 'offer' | 'answer',
  setup: (rtcObj: RTCPeerConnection) => Promise<boolean>,
) => {
  const rtcObj = new RTCPeerConnection({ iceServers });
  // A form of communication needs to be established before ICE events are set
  const sendFunc = createDataChannel(rtcObj, peerId);
  // rtcObj.onicecandidate = onIceCandidate(peerId);
  rtcObj.addEventListener(
    'icegatheringstatechange',
    onIceGatheringChange(peerId, rtcObj, type),
  );
  const remoteSet = await setup(rtcObj);
  // FUTURE: Make sure peer is unique
  rtcPeers.update((peers) => {
    return [
      ...peers,
      {
        peerId,
        rtcObj,
        iceCandidates: [],
        setRemoteSDP: remoteSet,
        remoteCandidates: [],
        sendFunc,
        connected: false,
        sank: false,
        heartbeat: 4,
      },
    ];
  });
};

// what to do when an offer is made to this client
const onOfferCreateAnswer = async ({
  sdp,
  sdpString,
  peerId,
  sig,
  deviceCert,
}) => {
  // check if sig is valid
  const valid = await verifyFromPeerId(sig, sdpString, peerId, deviceCert);
  if (valid !== true) return;
  // if receiving offer yet to create a peer instance
  createRTCPeer(peerId, 'answer', async (rtcObj) => {
    try {
      await rtcObj.setRemoteDescription(sdp);
      const answer = await rtcObj.createAnswer();
      await rtcObj.setLocalDescription(answer);
    } catch (error) {
      console.error(new Error(`in offer response: ${error}`));
    }
    return true; // return true when remote sdp was set
  });
};

const onAnswer = async ({ sdp, sdpString, peerId, sig }) => {
  const valid = await verifyFromPeerId(sig, sdpString, peerId);
  if (valid !== true) return;
  rtcPeers.update((peers) => {
    for (let i = 0; i < peers.length; i++) {
      if (peers[i].peerId === peerId) {
        peers[i].rtcObj.setRemoteDescription(sdp).catch((error) => {
          console.error(new Error(`onAnswer: ${error}`));
        });
        peers[i].setRemoteSDP = true;
      }
    }
    return peers;
  });
};

// Response to 'makeOffer' request from service,
// which is triggered by another peer's announcement
const onOfferAsk = async ({
  requester,
  sig,
  deviceCert,
  rmData,
}: announcePacket) => {
  try {
    // check if this is one of our existing connections
    if (await checkExisting(requester)) {
      makeOfferOnApproval(requester, sig, deviceCert);
      return;
    }
    // if not add to pending approvals
    pendingPeers.update((peers) => {
      return [...peers, { requester, sig, deviceCert, rmData }];
    });
  } catch (error) {
    console.error(new Error(`onOfferAsk: ${error}`));
  }
};

wsOn('makeOffer', onOfferAsk);
wsOn('offer', onOfferCreateAnswer);
wsOn('answer', onAnswer);

// check opt-in setup
const initConnectionSignaling = async () => {
  // bypass making a connection if client has yet to opt into peer connections
  const announce = await getAnnouncement();
  // The following condition should make it possible to call this function without opt-in
  peerSyncEnabled.set(announce?.peers.length ? true : false);
  if (announce) wsSend('announce', announce);
};

const makeOfferOnApproval = async (
  peerId: string,
  sig: string,
  deviceCert: string,
) => {
  const validSig = await verifyFromPeerId(sig, deviceCert, peerId, deviceCert);
  if (validSig !== true) return;
  createRTCPeer(peerId, 'offer', async (rtcObj) => {
    try {
      const desc = await rtcObj.createOffer();
      await rtcObj.setLocalDescription(desc);
    } catch (error) {
      console.error(new Error(`in make offer ${error}`));
    }
    return false;
  });
};

export { initConnectionSignaling, makeOfferOnApproval };
