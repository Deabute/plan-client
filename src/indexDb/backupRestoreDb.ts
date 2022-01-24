// backupRestoreDb Copyright 2022 Paul Beaudet MIT License

import { allStores } from '../stores/defaultData';
import { getDb } from './dbCore';

const handlers = [
  {
    action: 'msg',
    func: (req: any) => {
      console.log(req.msg);
    },
  },
];

// shortcut for adding an event handler
const wsOn = (action: string, func: any) => {
  const found = handlers.find((handler, index) => {
    if (handler.action === action) {
      // overwrite current handler if it is assigned a subsequent time
      handlers[index] = { action, func };
      return true;
    }
  });
  if (found) return;
  handlers.push({ action, func });
};

// Listener for all incoming socket messages
const incoming = (event: any) => {
  let req = { action: null };
  // if error we don't care there is a default object
  try {
    req = JSON.parse(event.data);
  } catch (error) {
    console.log(error);
  }
  const eventToHandle = handlers.find(
    (handler) => req.action === handler.action,
  );
  if (eventToHandle) {
    eventToHandle.func(req);
  } else {
    console.log(`No handler: ${req.action}`);
  }
};

// Outgoing socket messages from client
const wsSend = async (ws: WebSocket, action: string, json: any = {}) => {
  json.action = action;
  let msg = '{"action":"error","error":"failed stringify"}';
  try {
    msg = JSON.stringify(json);
  } catch (error) {
    console.log(error);
  }
  ws.send(msg);
};

let blockExport: boolean = false;

wsOn('block', ({ value }) => {
  blockExport = value;
});

const exportData = (serverUrl: string) => {
  return () => {
    const ws = new WebSocket(serverUrl);
    ws.onopen = async () => {
      ws.onmessage = incoming;
      ws.onerror = console.error;
      ws.onclose = () => {
        console.log('export closed');
      };
      wsSend(ws, 'start', { value: Date.now() });
      const db = await getDb();
      const transaction = db.transaction(allStores);
      for (let i = 0; i < allStores.length; i++) {
        const store = transaction.objectStore(allStores[i]);
        let cursor = await store.openCursor();
        while (cursor) {
          wsSend(ws, 'backup', {
            store: allStores[i],
            value: JSON.stringify(cursor.value),
          });
          blockExport = true;
          while (blockExport);
          cursor = await cursor.continue();
        }
      }
      wsSend(ws, 'done', { value: Date.now() });
    };
  };
};

export { exportData };
