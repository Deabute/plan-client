// defaultData.ts Copyright Paul Beaudet 2021 MIT License

import type {
  taskStores,
  taskI,
  columnIds,
  velocityI,
  allStoreTypes,
} from '../shared/interface';
import { createOid } from '../isomorphic/oid';

// - budgeting -
const frameOptions: number[] = [1, 2, 3, 4]; // Represented in weeks
const frameValues: number[] = [604800000, 1209600000, 1814400000, 2419200000];
const defaultFrame: number = frameValues[1]; // 1 Week in Milliseconds

// IDs of columns
const genId: { [key: string]: columnIds } = {
  todo: '1',
  done: '2',
  time: '3',
};

const activitiesColumnName: string = 'Plan';
const timelineColumnName: string = 'Track';
const agendaColumnName: string = 'Do';
// const peopleColumnName: string = 'People';
// const projectColumnName: string = 'Project';
// const reviewColumnNome: string = "review";

const genesisTask: taskI = {
  id: genId.todo,
  parentId: '0',
  body: activitiesColumnName,
  position: 0,
  effort: 0,
  rating: 0,
  description: '',
  status: 'todo',
  priority: 0,
  fraction: defaultFrame,
  cadence: 'zero',
  lastModified: 0,
  timeCreated: 0,
  dueDate: 0,
  autoAssigned: true,
};

const timelineParent: taskI = {
  ...genesisTask,
  id: genId.time,
  body: timelineColumnName,
};

const stores: taskStores[] = ['tasks'];
const allStores: Array<allStoreTypes> = [
  'events',
  'tasks',
  'timeline',
  'tach',
  'budget',
  'connect',
  'profiles',
  'psks',
];

// Effort point weight scale
// -0: Will not do, Maybe available is shared categories
// -1: Most basic unit, no problem
// -2: Easy but incrementally tougher than a one
// -3 (3): Also incrementally tougher than a 2
// -4 (5): Known difficulty, significantly tougher than a 3
// -5 (8): Known unknowns, significantly tougher than a 4
// -6 (13): Unknown Unknowns; approachable - could be hard could be easy, have no idea
// -7 (21): unknown unknowns; scary - I'm not completely avoiding this...
// ...cont.. but it puts me off. About 2x tougher than a 6
// -8 (34): Here be dragons
// -9 (55 but actually 0): There is no spoon! physics lies! everything is a conspiracy!
// 0 and 9 are practically the same multiplier-wise, meaning wise they read as follows
// 9 not doing because thought to be impossible
// 0 not doing because the desire is not there
// These are the multipliers for the 10 point effort scale
const fibonacciScale: number[] = [0, 1, 2, 3, 5, 8, 13, 21, 34, 0];

// Velocity is calculated in milliseconds
// This default value serves as a base starting point
// Until the planner establishes a dynamically changing personal velocity
// This default is: 30 Minutes => ( 30 * 60000 millis == 1 minute )
const startingVelocity: number = 1800000;

const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const createDefaultTask = (): taskI => {
  return {
    position: 0,
    parentId: genesisTask.id,
    id: '',
    body: 'Plan',
    effort: 1,
    rating: 1,
    description: 'default task',
    status: 'todo',
    priority: 0,
    fraction: 0,
    // cadence: 'w,d,1,8',
    cadence: 'zero',
    lastModified: 1,
    timeCreated: 1,
    dueDate: 0,
    autoAssigned: true,
  };
};

const defaultNow = {
  id: '0',
  taskId: '0',
  start: Date.now(),
  type: 'habit',
  lastModified: Date.now(),
  duration: null,
  body: 'Loading',
  effort: 9,
  done: false,
};

const newTach = (millis: number): velocityI => {
  return {
    id: createOid(),
    millis,
    recorded: Date.now(),
  };
};

const shownStamps: number = 22;
const days366: number = 31622400000;
const days31: number = 2678400000;
const weekInMillis: number = 604800000;
const dayInMillis: number = 86400000;
const hourInMillis: number = 3600000;
const minInMillis: number = 60000;
const INACTIVE_MILLIS: number = minInMillis * 9;
const FIVE_MIN = 300000;

const MAX_CHILDREN: number = 1000;
const getPriorityIndexRange = (parentId: string): IDBKeyRange => {
  const lowerBound = [parentId, 'todo', 0];
  const upperBound = [parentId, 'todo', MAX_CHILDREN];
  return IDBKeyRange.bound(lowerBound, upperBound);
};

const KEY_PAIR_CONFIG: EcKeyGenParams = {
  name: 'ECDSA',
  namedCurve: 'P-384',
};

const SIGN_VERIFY_CONFIG: EcdsaParams = {
  name: 'ECDSA',
  hash: {
    name: 'SHA-384',
  },
};

const DAYS: string[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const DAYS_SHORT: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MONTH: string[] = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTH_SHORT: string[] = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const utilizationOptions: string[] = [
  'Today',
  'Yesterday',
  'This Sprint',
  'Last Sprint',
  'This Month',
  'Last Month',
  'This Week',
  'Last Week',
];

interface defaultObj {
  body: string;
  fraction?: number;
  children?: defaultObj[];
  due?: number;
  cadence?: string;
}

// NOTE! The first 25 chars of every body needs to be unique.
// Or else it will disappear on peer sync
const arrayOfDefaults: defaultObj[] = [
  {
    body: 'Click "rec" on another task to start another recording and stop this one (Beginner Tips maybe?)',
  },
  {
    body: 'Work',
    fraction: hourInMillis * 40,
    cadence: 'many',
    children: [
      { body: 'Planning', cadence: 'w,w,1,0,0,0' },
      {
        body: 'Check how my time was utilized this week',
        cadence: 'w,m,1,0,0,0',
        due: Date.now() + weekInMillis,
      },
    ],
  },
  {
    body: 'Eat',
    cadence: 'many',
    children: [
      { body: 'Breakfast', cadence: 'w,w,1,0,0,0' },
      { body: 'Lunch', cadence: 'w,w,1,0,0,0' },
      { body: 'Dinner', cadence: 'w,w,1,0,0,0' },
    ],
  },
  { body: 'Sleep', fraction: hourInMillis * 8 * 7, cadence: 'w,w,1,0,0,0' },
  {
    body: 'Chores',
    children: [
      { body: 'Cleaning', cadence: 'many' },
      { body: 'Take out Trash' },
    ],
  },
  {
    body: 'Beginner Tips (Click open on this folder)',
    children: [
      {
        body: 'The goal is tell your time what to do',
      },
      {
        body: 'Set a budget for your week by clicking the time slider under the task name',
      },
      {
        body: 'Set an agenda for your day by giving "do" times to your task with the "when" editor',
      },
      { body: 'To remove a task folder, click edit then click done' },
      {
        body: 'Views (Open me!)',
        children: [
          {
            body: 'Under "View" in the side bar and select another type to see your data in a different light',
          },
          {
            body: `"${activitiesColumnName}" shows tasks organized into a folder directory structure`,
          },
          {
            body: `"${timelineColumnName}" shows the tasks being recorded and previous recordings`,
          },
          {
            body: `"${agendaColumnName}" shows tasks that have been marked to be done`,
            due: Date.now() + hourInMillis * 2,
          },
        ],
      },
      {
        body: 'To set a recurring task click "edit" and then "many"',
        children: [
          { body: '"None" represents a one off task' },
          {
            body: '"Many" represents a repeating task, do dates are cleared when they are completed',
          },
          {
            body: 'Day, Week Month, and Year give options to set cadence every number of those',
          },
        ],
      },
      {
        body: 'Your data is stored on this device! No sign in needed! Sync with another device for a back up',
      },
      {
        body: 'Syncing up with another device (Open me!)',
        children: [
          { body: 'Go to "setup" in the top bar and then "Peer Sync' },
          {
            body: 'Opt-in on Device A. It will generate a long id to share with Device B',
          },
          {
            body: "Opt-in with Device B and paste in Device B's id. Then click connect",
          },
          {
            body: "Device A should now ask if its okay to connect to Device B's id",
          },
          {
            body: 'Check to be sure at least the last hand full of characters match in the ID',
          },
          { body: "Don't accept connect request from unknown device ids" },
          {
            body: 'Keep in mind with peer sync both instances of the app need to be up at the same time to sync',
          },
          {
            body: 'Cloud sync is our paid subscription service for convenient syncing',
          },
        ],
      },
    ],
  },
];

const getColdStartData = (): taskI[] => {
  let now = Date.now();
  const taskArray: taskI[] = [];
  const recursiveTaskFolderCreation = (
    defaultArray: defaultObj[],
    parentId: string,
  ) => {
    defaultArray.forEach((task, position) => {
      const id = task.body.slice(0, 24);
      taskArray.push({
        id,
        parentId,
        description: '',
        priority: 0,
        status: 'todo',
        position,
        rating: 1,
        effort: 1,
        fraction: task?.fraction ? task.fraction : 0,
        dueDate: task?.due ? task.due : 0,
        body: task.body,
        timeCreated: now,
        lastModified: now,
        autoAssigned: task?.fraction && task.fraction ? false : true,
        cadence: task?.cadence ? task.cadence : 'zero',
      });
      if (task?.children) {
        recursiveTaskFolderCreation(task.children, id);
      }
    });
  };
  recursiveTaskFolderCreation(arrayOfDefaults, '1');

  return taskArray;
};

export {
  genesisTask,
  startingVelocity,
  fibonacciScale,
  stores,
  timelineParent,
  genId,
  days,
  createDefaultTask,
  defaultNow,
  newTach,
  allStores,
  shownStamps,
  defaultFrame,
  frameOptions,
  frameValues,
  dayInMillis,
  hourInMillis,
  minInMillis,
  weekInMillis,
  INACTIVE_MILLIS,
  getPriorityIndexRange,
  FIVE_MIN,
  MAX_CHILDREN,
  KEY_PAIR_CONFIG,
  SIGN_VERIFY_CONFIG,
  DAYS,
  DAYS_SHORT,
  MONTH,
  MONTH_SHORT,
  utilizationOptions,
  timelineColumnName,
  agendaColumnName,
  activitiesColumnName,
  getColdStartData,
  days31,
  days366,
};
