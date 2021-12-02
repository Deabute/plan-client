// duration Copyright Paul Beaudet 2021 MIT License

import { getRemainingMillis } from '../stores/budgetStore';
import { fibonacciScale, MAX_CHILDREN } from '../stores/defaultData';
import type { budgetI, taskListData } from '../shared/interface';
import {
  getCadence,
  intervalMillis,
  intervalTypes,
} from '../components/time/CadenceFunctions';

const getDuration = (
  list: taskListData,
  tach: number,
  budget: budgetI,
  cut: boolean = false,
): number => {
  // start with effort of parent
  let newDuration: number = 0;
  // potentially automatically set cut off for one off time boxes
  let setCutoff: boolean = false;
  // Make sure priority is a non-zero number
  const cutoff = list.lineage[0].priority
    ? list.lineage[0].priority
    : MAX_CHILDREN;
  // compile effort of children
  for (let i = 0; i < list.tasks.length; i++) {
    if (cut && i === cutoff) {
      break;
    }
    const { fraction, effort, rating, cadence } = list.tasks[i];
    if (cadence !== 'zero') {
      const cadenceObj = getCadence(cadence);
      // just figure occurrences between end of sprint and now
      const remainingTime: number = getRemainingMillis(budget);
      let window: number = 0;
      for (let i = 0; i < intervalMillis.length; i++) {
        if (cadenceObj.interval === intervalTypes[i]) {
          // Todo figure skip based on week types
          window = intervalMillis[i] * cadenceObj.skip;
          break;
        }
      }
      const occurrences: number =
        remainingTime > window ? remainingTime / window : 0;
      if (fraction) {
        newDuration += fraction * occurrences;
      } else {
        newDuration +=
          effort > rating
            ? effort * tach * occurrences
            : fibonacciScale[rating] * tach * occurrences;
      }
    } else if (fraction) {
      // fractions should be more complicated if they are recurring
      newDuration += fraction;
    } else {
      newDuration +=
        effort > rating ? effort * tach : fibonacciScale[rating] * tach;
    }
    if (
      list.lineage[0].id !== '1' &&
      !setCutoff &&
      list.lineage[0].fraction &&
      list.lineage[0].cadence === 'zero' &&
      newDuration > list.lineage[0].fraction
    ) {
      if (!list.lineage[0].priority || list.lineage[0].priority > i) {
        list.lineage[0].priority = i;
      }
      setCutoff = true;
    }
  }
  return newDuration;
};

export { getDuration };
