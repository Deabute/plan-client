// interface.ts Copyright 2021 Paul Beaudet MIT License
import type {
  DBSchema,
  IDBPDatabase,
  IDBPTransaction,
  IDBPCursorWithValue,
} from 'idb';

type statI = 'done' | 'todo' | 'hide';

// stored data for task
interface taskI {
  id: string; // Way to uniquely identify task
  parentId: string; // Parent of task
  body: string; // Planner note of what this task is
  position: number; // order of priority
  effort: number; // total effort of children
  rating: number; // given effort by planner
  description: string; // Extra information about the task
  status: statI; // 'done', 'todo', 'hide'
  // budgeting concerns
  priority: number; // defaults to last task position (0 on create)
  // Line is drawn after task in this position
  fraction: number; // defaults to needed or total remaining if needed exceeds that number
  // "needed" is counted to the priority line
  cadence: string; // defaults to zero
  lastModified: number; // timestamp of last modification
  timeCreated: number; // timestamp of creation
  dueDate: number; // Date that task needs to be completed by
  autoAssigned: boolean; // if fraction was assigned by app or user to determine its flexibility
  count: number; // temp: occurrences per this sprint
  utilization: number; // temp: total time used per this sprint
}

interface incomingTaskI {
  data: taskI;
  done: boolean;
}

interface optionalTaskI {
  id: string; // Way to uniquely identify task
  parentId?: string; // Parent of task
  body?: string; // Planner note of what this task is
  position?: number; // order of priority
  effort?: number; // total effort of children
  rating?: number; // given effort by planner
  description?: string; // Extra information about the task
  status?: statI; // 'done', 'todo', 'hide'
  // budgeting concerns
  priority?: number; // defaults to last task position (0 on create)
  // Line is drawn after task in this position
  fraction?: number; // defaults to needed or total remaining if needed exceeds that number
  // "needed" is counted to the priority line
  cadence?: string; // defaults to zero
  lastModified?: number; // timestamp of last modification
  timeCreated?: number; // timestamp of creation
  dueDate?: number; // Date that task needs to be completed by
  autoAssigned?: boolean; // if fraction was assigned by app or user to determine its flexibility
  count?: number;
  utilization?: number;
}

// Stored data for connection information of other devices to sync with and self
interface connectionI {
  id: string; // unique hash of client device self signed cert
  deviceName: string; // User given name to device
  deviceKey: string; // Private key of this device or empty string for other devices
  deviceCert: string; // signed public key for this device
  userId: string; // unique user id (can have multiple devices)
  lastConnect: number; // js timestamp of last time this device was online or connected with this device
  firstConnect: number; // js timestamp of creation or first connection
}

// in the future switching ids could share with different clients
// maybe the id should decide the db that gets used?

type profileStatus =
  | 'primary' // Profile actively being sank
  | 'undecided' // profile not actively being sank
  | 'share'; // used for other users that are shared with

// Stored data for self and other users that are connected with
interface profileI {
  id: string; // unique hash of user self signed cert for connection or self
  name: string; // non-unique name user gives themselves as shorthand
  key: string; // private key of this user if self, empty string if other
  cert: string; // self signed cert of this user
  password: string;
  assumedAuthTTL: number; // what we think we paid for (service is source of truth)
  lastConnect: number; // using as lastModified
  firstConnect: number;
  status: profileStatus;
}

// References to items shared by who when specific task checking is desired
interface shareI {
  id: string;
  taskId: string; // id of task (if task share)
  parent: string; // parent task of shared task (1 is a complete sync with user, timeline, and budget data)
  sharedBy: string; // userId of who shared
  // all else aside id & shared by could be the same, this would still signal a task sync across different users)
}

interface tokenI {
  token: string; // unique token given to us from service
  ttl: number; // timestamp of expiration
}

// Pre-shared-keys
interface pskI {
  cacheId: string; // Where data will be stored
  key: string; // encryption key
  number: number; // order in series of created keys
  type: string; // encryption algorithm
  deviceId: string; // connection using this key
  iv: string; // individual value to go with key
  used: boolean; // if packed or unpacked with
}

// in memory data for task
// topChild: determined greatest priority grandchild
interface memTaskI extends taskI {
  topChild?: taskI | null;
}

interface timestampI {
  id: string; // id of this timestamp (needed by idb)
  taskId: string; // id of associated task
  start: number; // unix timestamp
  type: string; // what store this activity comes from
  lastModified: number; // Resolve edits between peers
}

interface memStampI extends timestampI {
  duration: number | null; // Note of current or past duration (for moving)
  body: string; // Place holder for associated task body
  status: statI; // placeholder to note completion status
  cadence: string; // placeholder for cadence
}

interface velocityI {
  id: string; // key value
  millis: number; // how many milliseconds one story point takes
  recorded: number; // when reading was taken (as task are completed)
}

// top level budget data for entire app
interface budgetI {
  id: string; // Unique identifier for Database
  start: number; // JS timestamp in milliseconds
  frame: number; // default time frame is 2 weeks in milliseconds
  lastModified: number; // set source of truth
  number: number; // which sprint since inception of app use
}
// See taskI for budget items to do with priority

interface eventValue {
  id?: string;
  parentId?: string;
  budget?: number;
  unlock?: boolean;
  due?: number;
  timestamp?: number;
  optIn?: boolean;
  task?: taskI;
  stamp?: timestampI;
  cadenceChange?: string;
  backfill?: string;
}

type eventActions =
  | 'removeConnection'
  | 'removeTimestamp'
  | 'newTimestamp'
  | 'checkOff'
  | 'hideTask'
  | 'moveTask'
  | 'setDue'
  | 'setBudget'
  | 'setRecur'
  | 'editTimestamp'
  | 'peerSyncOptIn'
  | 'addConnection'
  | 'newFolder';

interface eventI {
  id: string;
  timestamp: number;
  action: eventActions;
  data: eventValue;
}

type eventFuncs = ((data: eventI) => void) | ((data: eventI) => Promise<void>);
interface eventHandler {
  action: eventActions;
  func: eventFuncs;
}

interface viewsI {
  name: string;
  showing: boolean | string;
}

// IndexDB Schema
interface PlanDB extends DBSchema {
  tasks: {
    key: string;
    value: taskI;
    indexes: {
      byDueDate: number;
      priority: [string, string, number];
      position: [string, number];
    };
  };
  timeline: {
    // this is not really needed if events are indexed properly
    key: string;
    value: timestampI;
    indexes: { timeOrder: number };
  };
  tach: {
    key: string;
    value: velocityI;
    indexes: { tachOrder: number };
  };
  budget: {
    key: string;
    value: budgetI;
    indexes: { budgetOrder: number };
  };
  connect: {
    key: string;
    value: connectionI;
  };
  events: {
    key: string;
    value: eventI;
    indexes: { eventOrder: number };
  };
  views: {
    key: string;
    value: viewsI;
  };
  profiles: {
    key: string;
    value: profileI;
  };
  tokens: {
    key: number;
    value: tokenI;
  };
  psks: {
    key: string;
    value: pskI;
    indexes: {
      device: [string, number];
    };
  };
}

// Data type for writable stores to be passed to task list
interface taskListData {
  tasks: memTaskI[];
  lineage: taskI[];
}

interface timeLineData {
  now: memStampI;
  history: memStampI[];
}

// Valid data constants
type taskStores = 'tasks';
type timeStore = 'timeline';
type allStoreTypes =
  | taskStores
  | timeStore
  | 'budget'
  | 'connect'
  | 'events'
  | 'profiles'
  | 'psks';
// TODO add views?
type reallyAllStoreTypes = allStoreTypes | 'tokens' | 'views';
type indexOptions =
  | 'timeOrder'
  | 'budgetOrder'
  | 'byParent'
  | 'priority'
  | 'eventOrder';
type actionTypes = 'done' | 'record' | 'remove';
type AmPm = 'AM' | 'PM';

type weekType = 'Sat-Sun' | 'Mon-Fri' | 'Whole';
// none = one off / many = many times / other = once every x
type cadenceInterval = 'one-off' | 'many' | 'day' | 'week' | 'month' | 'year';
interface cadenceI {
  weekType: weekType; // modifier for day interval (defaults to whole)
  interval: cadenceInterval;
  skip: number; // every x intervals (defaults to one, cant be zero)
  timeOfDay: number; // time of day per occurrence
  onTime: boolean; // Determines if time of day is adhered to
  strict: boolean; // can only be done at this time vs loosely this cadence
  // e.g. sleep strictly happens at your bed time, but mow the lawn loosely happens once a week
}

type allDataTypes =
  | taskI
  | connectionI
  | budgetI
  | timestampI
  | profileI
  | shareI
  | eventI
  | pskI;

type settingNames = 'history' | 'duration' | 'freshStart';

type navTypes = 'button' | 'link';

interface navItems {
  link: string;
  text: string;
  icon: string;
  type: navTypes;
}

interface prices {
  unit_amount: number;
  currency: string;
  recurring: {
    interval: string;
  };
  product: {
    name: string;
    description: string;
  };
  id: string;
}

interface stripSub {
  id: string;
  status: string;
  current_period_end: number;
  default_payment_method: {
    card: {
      last4: number;
    };
  };
  plan: {
    amount: number;
    interval: string;
  };
}

export type {
  taskI,
  connectionI,
  profileI,
  profileStatus,
  shareI,
  tokenI,
  PlanDB,
  IDBPDatabase,
  IDBPTransaction,
  IDBPCursorWithValue,
  taskStores,
  memTaskI,
  taskListData,
  indexOptions,
  timestampI,
  memStampI,
  timeStore,
  actionTypes,
  timeLineData,
  velocityI,
  budgetI,
  allStoreTypes,
  AmPm,
  cadenceI,
  weekType,
  cadenceInterval,
  allDataTypes,
  eventActions,
  eventValue,
  eventI,
  eventFuncs,
  eventHandler,
  settingNames,
  pskI,
  optionalTaskI,
  incomingTaskI,
  statI,
  navTypes,
  navItems,
  prices,
  reallyAllStoreTypes,
  stripSub,
};
