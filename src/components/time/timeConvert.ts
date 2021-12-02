// timeConvert.svelte Copyright 2021 Paul Beaudet MIT License

import type { AmPm } from '../../shared/interface';
import {
  DAYS_SHORT,
  hourInMillis,
  minInMillis,
  MONTH_SHORT,
} from '../../stores/defaultData';

const get12Hour = (h: number): number => {
  h = h > 12 ? h - 12 : h;
  return h ? h : 12;
};

const get24Hour = (hour12: number, meridiem: AmPm): number => {
  if (meridiem === 'AM') {
    if (hour12 === 12) hour12 = 0;
    return hour12;
  }
  if (hour12 === 12) return hour12;
  hour12 += 12;
  return hour12;
};

const daysInMonth = (y: number, m: number): number => {
  return new Date(y, m, 0).getDate();
};

const getHumanReadableStamp = (
  stamp: number,
  showYear: boolean = true,
): string => {
  if (!stamp) return '';
  const dateStart = new Date(stamp);
  let hour = dateStart.getHours();
  const meridian = hour > 11 ? 'PM' : 'AM';
  hour = get12Hour(hour);
  const dayOfWeek = DAYS_SHORT[dateStart.getDay()];
  const monthValue = dateStart.getMonth();
  const month = MONTH_SHORT[monthValue];
  const dayOfMonth = dateStart.getDate();
  const minute = dateStart.getMinutes();
  const year = showYear ? dateStart.getFullYear() : '';
  return `${dayOfWeek} ${month} ${dayOfMonth}, ${hour}:${String(
    minute,
  ).padStart(2, '0')} ${meridian} ${year}`;
};

const getDurationStamp = (millis: number): string => {
  const hours = millis >= hourInMillis ? Math.trunc(millis / hourInMillis) : 0;
  let remaining = millis >= hourInMillis ? millis % hourInMillis : millis;
  const minutes =
    remaining >= minInMillis ? Math.trunc(remaining / minInMillis) : 0;
  remaining = remaining >= minInMillis ? remaining % minInMillis : remaining;
  const seconds = remaining >= 1000 ? Math.trunc(remaining / 1000) : 0;
  return `${hours}:${minutes < 10 ? `0${minutes}` : minutes}:${
    seconds < 10 ? `0${seconds}` : seconds
  }`;
};

export {
  get12Hour,
  get24Hour,
  daysInMonth,
  getHumanReadableStamp,
  getDurationStamp,
};
