// backupRestoreDb Copyright 2022 Paul Beaudet MIT License

import { Dpad, Info } from 'svelte-bootstrap-icons';
import { allStores } from '../stores/defaultData';
import { getDb } from './dbCore';
import { clearData } from './profilesDb';

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

const waitForOpenConnection = (socket: WebSocket) => {
  return new Promise((resolve, reject) => {
    const maxNumberOfAttempts = 10;
    const intervalTime = 200; //ms

    let currentAttempt = 0;
    const interval = setInterval(() => {
      if (currentAttempt > maxNumberOfAttempts - 1) {
        clearInterval(interval);
        reject(new Error('Maximum number of attempts exceeded'));
      } else if (socket.readyState === socket.OPEN) {
        clearInterval(interval);
        resolve(true);
      }
      currentAttempt++;
    }, intervalTime);
  });
};

let blockExport: boolean = false;
wsOn('block', ({ value }) => {
  blockExport = value;
});

let ws: WebSocket = null;

// Outgoing socket messages from client
const wsSend = async (action: string, json: any = {}) => {
  // console.log(`trying to send ${action} when open is ${wsOpen}`);
  // if (!wsOpen) return;
  json.action = action;
  let msg = '{"action":"error","error":"failed stringify"}';
  try {
    msg = JSON.stringify(json);
  } catch (error) {
    console.log(error);
  }
  await waitForOpenConnection(ws);
  ws.send(msg);
};

const openServerConnection = async (serverUrl: string): Promise<boolean> => {
  if (!ws) {
    try {
      ws = new WebSocket(serverUrl);
      ws.onopen = () => {
        ws.onmessage = incoming;
        ws.onerror = console.error;
        ws.onclose = () => {
          console.log('Backup restore connection closed');
          ws = null;
        };
        console.log('setting connection to open');
      };
    } catch (error) {
      console.error('Not a valid server to connect to');
      return false;
    }
  }
  return true;
};

const exportData = (serverUrl: string) => {
  return async () => {
    if (!(await openServerConnection(serverUrl))) return;
    wsSend('start', { value: Date.now() });
    const db = await getDb();
    const transaction = db.transaction(allStores);
    for (let i = 0; i < allStores.length; i++) {
      const store = transaction.objectStore(allStores[i]);
      let cursor = await store.openCursor();
      while (cursor) {
        wsSend('backup', {
          store: allStores[i],
          value: JSON.stringify(cursor.value),
        });
        blockExport = true;
        while (blockExport);
        cursor = await cursor.continue();
      }
    }
    wsSend('done', { value: Date.now() });
  };
};

const showRestore = (serverUrl: string) => {
  return async () => {
    const serverSetup = await openServerConnection(serverUrl);
    if (!serverSetup) return;
    wsSend('lsRestore');
  };
};

wsOn('lsRestore', ({ value }) => {
  console.log(value);
});

wsOn('lsRestoreNone', () => {
  console.log('Issue with finding restore files');
});

const restore = (serverUrl: string) => {
  return async () => {
    const serverSetup = await openServerConnection(serverUrl);
    if (!serverSetup) return;
    wsSend('restore');
  };
};

let restoreReady: boolean = false;

wsOn('restoreStart', async () => {
  await clearData();
  restoreReady = true;
});

wsOn('restore', async ({ value }) => {
  while (!restoreReady) continue;
  // console.log(value);
  const db = await getDb();
  const valueParts = value.split('~');
  if (valueParts.length > 2) {
    console.log('>2~');
    return;
  }
  db.put(valueParts[0], JSON.parse(valueParts[1]));
});

export { exportData, showRestore, restore };
