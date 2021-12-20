//  CadenceFunctions.ts Copyright 2021 Paul Beaudet MIT Licence

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
    timeOfDay: 12,
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
      cadence.interval = intervalTypes[i];
      break;
    }
  }
  cadence.skip = Number(cadenceArray[2]);
  cadence.timeOfDay = Number(cadenceArray[3]);
  return cadence;
};

// Creates a particularly formated CSV to flaten property to a string for storage.
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
      // encode inverval type on position 2
      encodeCadence += intervalTypeCodes[i] + ',';
      break;
    }
  }
  // encode skip and time of day on positions 3 and 4
  encodeCadence += String(setObj.skip) + ',' + String(setObj.timeOfDay);
  return encodeCadence;
};

const nextOccurance = (
  encodedCadence: string,
  originalDue: number = 0,
): number => {
  const baseStart = originalDue ? originalDue : Date.now();
  const cadence = getCadence(encodedCadence);
  let interval = 0;
  for (let i = 0; i < intervalTypes.length; i++) {
    if (i === 0) continue;
    if (cadence.interval === intervalTypes[i]) {
      interval = intervalMillis[i - 1];
      break;
    }
  }
  return baseStart + interval * cadence.skip;
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
  nextOccurance,
};
