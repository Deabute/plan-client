//  CadenceFunctions.ts Copyright 2021 Paul Beaudet MIT License

const days366: number = 31622400000;
const days31: number = 2678400000;
const weekInMillis: number = 604800000;
const dayInMillis: number = 86400000;
const hourInMillis: number = 3600000;
const minInMillis: number = 60000;

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

export {
  days366,
  days31,
  weekInMillis,
  dayInMillis,
  hourInMillis,
  minInMillis,
  DAYS,
  DAYS_SHORT,
  MONTH,
  MONTH_SHORT,
};
