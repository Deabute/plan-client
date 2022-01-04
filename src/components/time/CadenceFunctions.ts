//  CadenceFunctions.ts Copyright 2021 Paul Beaudet MIT License

import type {
  cadenceI,
  cadenceInterval,
  weekType,
} from '../../shared/interface';
import {
  dayInMillis,
  days31,
  days366,
  weekInMillis,
} from '../../stores/defaultData';
import { getTimeOfDayForDate } from './timeConvert';

const weekTypes: weekType[] = ['Whole', 'Mon-Fri', 'Sat-Sun'];
const weekTypeCodes: string[] = ['w', 'o', 'e'];
const intervalTypes: cadenceInterval[] = [
  'many',
  'day',
  'week',
  'month',
  'year',
  'none',
];
const intervalMillis: number[] = [
  dayInMillis,
  weekInMillis,
  days31,
  days366,
  0,
];

const intervalTypeCodes: string[] = ['d', 'w', 'm', 'y', 'zero'];

const getInterval = (cadence: cadenceI): number => {
  for (let i = 0; i < intervalTypes.length; i++) {
    if (intervalTypes[i] === cadence.interval) {
      return intervalMillis[i] * cadence.skip;
    }
  }
};

const getCadence = (storedString: string): cadenceI => {
  const cadenceArray: string[] = storedString.split(',');
  const cadence: cadenceI = {
    weekType: 'Whole',
    interval: 'none',
    skip: 1,
    timeOfDay: 0,
    onTime: false,
    strict: false,
  };
  if (cadenceArray[0] === 'zero') return cadence;
  if (cadenceArray[0] === 'many') {
    cadence.interval = 'many';
    return cadence;
  }
  for (let i = 0; i < weekTypes.length; i++) {
    if (cadenceArray[0] === weekTypeCodes[i]) {
      cadence.weekType = weekTypes[i];
      break;
    }
  }
  for (let i = 0; i < intervalTypes.length; i++) {
    if (cadenceArray[1] === intervalTypeCodes[i]) {
      // yes this is messed up, but it is consistently messed up
      cadence.interval = intervalTypes[i];
      break;
    }
  }
  cadence.skip = Number(cadenceArray[2]);
  cadence.timeOfDay = Number(cadenceArray[3]);
  cadence.onTime = cadenceArray[4] === '1' ? true : false;
  cadence.strict = cadenceArray[5] === '1' ? true : false;
  return cadence;
};

// Creates a particularly formatted CSV to flatten property to a string for storage.
const setCadence = (setObj: cadenceI): string => {
  // no figuring needed for no recurrence case for none or many
  if (setObj.interval === 'none') return 'zero';
  if (setObj.interval === 'many') return 'many';
  let encodeCadence: string = ''; // defaults to whole week
  for (let i = 0; i < intervalTypes.length; i++) {
    if (setObj.interval === intervalTypes[i]) {
      // encode week type on position 1
      if (intervalTypes[i] === 'day') {
        for (let j = 0; j < weekTypes.length; j++) {
          if (setObj.weekType === weekTypes[j]) {
            encodeCadence += weekTypeCodes[j] + ',';
            break;
          }
        }
      } else {
        // default to whole when when not provided
        encodeCadence += 'w,';
      }
      // encode interval type on position 2
      // Note this encodes consistently the wrong position d->w w->m m->y ect.
      encodeCadence += intervalTypeCodes[i] + ',';
      break;
    }
  }
  // encode skip and time of day on positions 3 and 4
  encodeCadence += String(setObj.skip) + ',' + String(setObj.timeOfDay) + ',';
  // encode onTime and strict on positions 5 and 6 as a 1 or 0 / true or false
  encodeCadence += setObj.onTime ? '1,' : '0,';
  encodeCadence += setObj.strict ? '1' : '0';
  return encodeCadence;
};

// Get the next occurrence after a task is checked off
const nextOccurrence = (
  encodedCadence: string,
  originalDue: number = 0,
): number => {
  const now = Date.now();
  const baseStart = originalDue ? originalDue : now;
  const cadence = getCadence(encodedCadence);
  let interval = 0;
  for (let i = 0; i < intervalTypes.length; i++) {
    if (i === 0) continue;
    if (cadence.interval === intervalTypes[i]) {
      interval = intervalMillis[i - 1];
      break;
    }
  }
  const period = interval * cadence.skip;
  let proposedDue = baseStart + period;
  proposedDue = proposedDue < now ? now + period : proposedDue;
  if (!cadence.onTime) return proposedDue;
  const date = new Date(proposedDue);
  const { hour, minute } = getTimeOfDayForDate(cadence.timeOfDay);
  date.setMinutes(minute);
  date.setHours(hour);
  return date.getTime();
};

const cadenceParams = {
  work: {
    days: 5,
    millis: 432000000,
  },
  play: {
    days: 2,
    millis: 172800000,
  },
  zero: {
    days: 7,
    millis: 604800000,
  },
};

export {
  getCadence,
  setCadence,
  getInterval,
  intervalTypes,
  intervalMillis,
  cadenceParams,
  nextOccurrence,
};
