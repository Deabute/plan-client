// events ~ Copyright 2021 Paul Beaudet MIT License

import type {
  eventActions,
  eventFuncs,
  eventHandler,
  eventI,
  eventValue,
} from '../shared/interface';
import { getDb } from './dbCore';
import { createOid } from '../isomorphic/oid';
import { peerBroadcast, onEvent } from '../connections/dataChannels';

const addEvent = async (action: eventActions, data: eventValue) => {
  const db = await getDb();
  const event: eventI = {
    id: createOid(),
    timestamp: Date.now(),
    action,
    data,
  };
  db.add('events', event);
  peerBroadcast('sync-events', { data: event });
};

// onEvent should really be called on peer data...
onEvent('sync-events', async ({ data }: { data: eventI }) => {
  const db = await getDb();
  const existing = await db.get('events', data.id);
  if (existing) return;
  await db.put('events', data);
  await incomingEvents(data);
});

const eventHandlers: eventHandler[] = [];

const eventsOn = (action: eventActions, func: eventFuncs) => {
  for (let i = 0; i < eventHandlers.length; i++) {
    if (eventHandlers[i].action === action) {
      eventHandlers[i] = { action, func };
      return;
    }
  }
  eventHandlers.push({ action, func });
};

const incomingEvents = async (event: eventI) => {
  for (let i = 0; i < eventHandlers.length; i++) {
    if (eventHandlers[i].action === event.action) {
      await eventHandlers[i].func(event);
      break;
    }
  }
};

export { addEvent, eventsOn };
