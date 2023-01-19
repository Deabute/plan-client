// timePrimitives.ts Copyright 2021 Paul Beaudet MIT License
import {
  dayInMillis,
  days31,
  days366,
  hourInMillis,
  weekInMillis,
} from './timeConstants';
import type { periodsOfTime } from './timeInterface';

const timePeriods: periodsOfTime[] = ['hour', 'day', 'week', 'month', 'year'];

const timePeriodsInMillis: number[] = [
  hourInMillis,
  dayInMillis,
  weekInMillis,
  days31,
  days366,
];

export { timePeriods, timePeriodsInMillis };
// TODO consolidate with time constants
