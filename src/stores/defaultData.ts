// defaultData.ts Copyright Paul Beaudet 2021 MIT License
import type {
  taskStores,
  taskI,
  allStoreTypes,
  memStampI,
} from '../shared/interface';

const ProductName: string = 'Time Intent';
// - budgeting -
const frameOptions: number[] = [1, 2, 3, 4]; // Represented in weeks
const frameValues: number[] = [604800000, 1209600000, 1814400000, 2419200000];
const defaultFrame: number = frameValues[1]; // 1 Week in Milliseconds

const activitiesColumnName: string = 'Intent';
const timelineColumnName: string = 'Track';
const agendaColumnName: string = 'When';
// const peopleColumnName: string = 'People';
// const projectColumnName: string = 'Project';
// const reviewColumnNome: string = "review";

const genesisTask: taskI = {
  id: '1',
  parentId: '0',
  body: activitiesColumnName,
  position: 0,
  effort: 1,
  rating: 1,
  description: '',
  status: 'todo',
  priority: 0,
  fraction: defaultFrame,
  cadence: 'zero',
  lastModified: 0,
  timeCreated: 0,
  dueDate: 0,
  autoAssigned: true,
  count: 0,
  utilization: 0,
};

const stores: taskStores[] = ['tasks'];
const allStores: Array<allStoreTypes> = [
  'events',
  'tasks',
  'timeline',
  'budget',
  'connect',
  'profiles',
  'psks',
];

// Velocity is calculated in milliseconds
// This default value serves as a base starting point
// Until the planner establishes a dynamically changing personal velocity
// This default is: 30 Minutes => ( 30 * 60000 millis == 1 minute )
const startingVelocity: number = 1800000;

const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

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
    body: 'Click the recording task on another task to start another recording and stop this one',
  },
  {
    body: 'Clicking the check mark on the running task will start recording the next task in the "Intent Order"',
    children: [
      { body: 'Intent Order, has two priorities in the following order' },
      {
        body: `Priority one: First task set to "${agendaColumnName}" within the hour`,
      },
      { body: 'Priority two: Next task in the same folder' },
      {
        body: 'Having this system should alow quick use of the app without too much interaction',
      },
    ],
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
      {
        body: 'Why should I track eating and sleeping? (open for answers)',
        children: [
          {
            body: 'This a whole time accounting tool, it answers the question "where did the time go?"',
          },
          {
            body: 'It may not be important to know how long lunch takes, but it is helpful to know what time is left for new habits and hobbies and where they fit',
          },
          {
            body: 'Since eating is a non-negotiable thing that follows a specific pattern, the exact time it takes up contributes to knowing where that new cycling hobby fits into the picture',
          },
          {
            body: 'Sometimes its not a matter of whether the time is there its a factor of whether it fits',
          },
        ],
      },
    ],
  },
  { body: 'Sleep', fraction: hourInMillis * 8 * 7, cadence: 'w,w,1,0,0,0' },
  {
    body: 'Exercise',
    cadence: 'many',
    children: [{ body: 'Walk', cadence: 'many' }],
  },
  {
    body: 'Just For Fun',
    cadence: 'many',
    children: [
      { body: 'Streaming / TV', cadence: 'many' },
      { body: 'Read', cadence: 'many' },
    ],
  },
  {
    body: 'Chores',
    children: [
      { body: 'Cleaning', cadence: 'many' },
      { body: 'Take out Trash' },
    ],
  },
  {
    body: 'Social',
    cadence: 'many',
    children: [
      { body: 'Keep in touch with family', cadence: 'many' },
      { body: 'Keep in touch with friends', cadence: 'many' },
      { body: 'Professional Networking', cadence: 'many' },
      {
        body: `Feel free to make a list of friends and family, set some times "${agendaColumnName}" to reach out or get together!`,
      },
    ],
  },
  {
    body: 'Beginner Tips (Click open on this folder)',
    children: [
      {
        body: 'The goal is to take direction of how time is spent, from a longer term view then in the moment',
      },
      {
        body: 'The default term is two weeks from the time of opening the app, then two weeks from that, and so on (not currently editable)',
      },
      {
        body: 'Set a budget for this period by clicking the time slider under the task name',
      },
      {
        body: "Don't worry about getting the budget perfect, life happens, roll with the punches. The sliders can be pulled any time",
      },
      {
        body: 'This is about gaining realistic perspective on time use, not becoming a monk that self-flagellates',
      },
      {
        body: `Set an agenda for your day by giving "${agendaColumnName}" times to your task with the "${agendaColumnName}" option in task settings`,
      },
      { body: 'To remove / complete a task folder, click the check icon' },
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
        body: 'To set a task to recur click the gear icon and then "recur"',
        children: [
          { body: '"None" represents a one off task' },
          {
            body: `"Many" represents a repeating task, "${agendaColumnName}" dates are cleared when they are completed`,
          },
          {
            body: 'Day, Week Month, and Year give options to set cadence every number of those',
          },
        ],
      },
      {
        body: 'Your data is stored on this device! No sign in needed!',
      },
      {
        body: 'Information about paid features (Multi-Device & Backup)',
        children: [
          {
            body: 'Peer to peer and cloud multi-device is possible by selecting the multi device option in the side-bar',
          },
          {
            body: 'Backup regularly collects changes made and makes it possible to restore from a new client device',
          },
          {
            body: 'Currently these options are pre-release invite only, but it is also possible to request access',
          },
          {
            body: 'Peer sync instructions, used in Multi-device options',
            children: [
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
                body: 'Keep in mind with peer sync both instances of the app need to be reloaded at the same time to sync',
              },
            ],
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
        ...genesisTask,
        id,
        parentId,
        position,
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

const defaultNow: memStampI = {
  id: '0',
  taskId: '0',
  start: Date.now(),
  type: 'habit',
  lastModified: Date.now(),
  duration: null,
  body: 'Loading',
  done: false,
};

export {
  genesisTask,
  startingVelocity,
  stores,
  days,
  defaultNow,
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
  arrayOfDefaults,
  ProductName,
};
