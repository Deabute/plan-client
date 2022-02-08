// backupRestoreDb Copyright 2022 Paul Beaudet MIT License
import { allStores } from '../stores/defaultData';
import { getDb } from './dbCore';
import { clearData } from './profilesDb';
import { writable, Writable } from 'svelte/store';

const backupStatus: Writable<string> = writable('Not connected');
const showBackupOptions: Writable<boolean> = writable(false);
const availableBackups: Writable<{ value: string; name: string }[]> = writable(
  [],
);

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
          backupStatus.set('not connected');
          showBackupOptions.set(false);
          ws = null;
        };
        showBackupOptions.set(true);
        backupStatus.set('Connected');
      };
    } catch (error) {
      console.error('Not a valid server to connect to');
      return false;
    }
  }
  return true;
};

const backupData = (name: string) => {
  return async () => {
    backupStatus.set(`Backup ${name} Started`);
    wsSend('backupStart', { value: Date.now(), name });
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
    wsSend('backupDone', { value: Date.now() });
    backupStatus.set(`Backup ${name} Complete`);
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
  availableBackups.update((restorePoints) => {
    const valueParts = value.split('_');
    const name = `${valueParts[2]} ${new Date(
      Number(valueParts[1]),
    ).toDateString()}`;
    return [...restorePoints, { value, name }];
  });
});

wsOn('lsRestoreNone', () => {
  backupStatus.set('no restore files');
});

const restore = (value: string) => {
  return () => {
    wsSend('restore', { value });
  };
};

let restoreReady: boolean = false;

wsOn('restoreStart', async () => {
  backupStatus.set('Restoring...');
  await clearData();
  restoreReady = true;
});

wsOn('restore', async ({ value }) => {
  while (!restoreReady) continue;
  const db = await getDb();
  const valueParts = value.split('~');
  if (valueParts.length > 2) {
    valueParts.forEach((part, i) => {
      if (i > 1) valueParts[1] += `~${part}`;
    });
  }
  db.put(valueParts[0], JSON.parse(valueParts[1]));
});

wsOn('restoreEnd', () => {
  while (!restoreReady) continue;
  backupStatus.set('restoration complete');
  restoreReady = false;
});

const connectBackupServer = (serverUrl: string) => {
  return async () => {
    const serverSetup = await openServerConnection(serverUrl);
    if (!serverSetup) {
      backupStatus.set('Connection failed');
      return;
    }
    wsSend('lsRestore');
    backupStatus.set('Connecting');
  };
};

export {
  backupData,
  showRestore,
  restore,
  connectBackupServer,
  backupStatus,
  availableBackups,
  showBackupOptions,
};
