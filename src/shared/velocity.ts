// velocity.ts Copyright Paul Beaudet 2021 MIT License

import {
  dayInMillis,
  hourInMillis,
  minInMillis,
  startingVelocity,
} from '../stores/defaultData';

// thresh holds tested in ascending order from smallest measurement to largest
// This way the most typical use cases do the least work
const getDurationEstimate = (
  effortUnits: number,
  tach: number = startingVelocity,
): string => {
  const totalMillis = effortUnits * tach;
  return getEstimate(totalMillis);
};

const getEstimate = (totalMillis: number): string => {
  // given no task to add up show nothing.
  if (!totalMillis) {
    return '';
  }
  // figure minutes to completion (round up min: LOWEST_VELOCITY max 99)
  if (totalMillis <= 5940000) {
    const totalMinutes = Math.ceil(totalMillis / 60000);
    return `${totalMinutes}M`;
  }
  // figure hours to completion after 99 minutes (round up min: 2 max: 23)
  if (totalMillis <= 82800000) {
    const totalHours = Math.ceil(totalMillis / 3600000);
    return `${totalHours}H`;
  }
  // figure days to completion after day velocity thresh hold (round up, min: 1, max 27)
  // Day velocity thresh hold: how many task typically get done
  // TODO take defragmenting into consideration
  // eg two 5 point task may not be possible in one day
  // whereas 10 one point task might be.
  if (totalMillis <= 2332800000) {
    const totalDays = Math.ceil(totalMillis / 86400000);
    return `${totalDays}D`;
  }
  // figure weeks to completion after 4 weeks (round up, min 4, max 51)
  if (totalMillis <= 30844800000) {
    const totalWeeks = Math.ceil(totalMillis / 604800000);
    return `${totalWeeks}W`;
  }

  // figure years to completion (round up, min 1, max 6)
  if (totalMillis <= 189345600000) {
    const totalYears = Math.ceil(totalMillis / 31557600000);
    return `${totalYears}Y`;
  } else {
    // Figure if this is not possible (over 6 years) show 9 effort point
    return '9'; // AKA not practical
  }
};

const getHourAndMinutes = (totalMillis: number): string => {
  const days =
    totalMillis >= dayInMillis ? Math.floor(totalMillis / dayInMillis) : 0;
  let returnString: string = days ? days + 'D ' : '';
  let remainingMillis =
    totalMillis >= dayInMillis ? totalMillis % dayInMillis : totalMillis;
  const hours =
    remainingMillis >= hourInMillis
      ? Math.floor(remainingMillis / hourInMillis)
      : 0;
  returnString = hours ? returnString + hours + 'H ' : returnString;
  remainingMillis =
    totalMillis >= hourInMillis
      ? remainingMillis % hourInMillis
      : remainingMillis;
  const minutes =
    remainingMillis >= minInMillis
      ? Math.floor(remainingMillis / minInMillis)
      : 0;
  returnString = minutes ? returnString + minutes + 'M ' : returnString;
  return returnString;
};

const hourAndMinutesObj = (
  totalMillis: number,
): { hour: number; minute: number } => {
  const hour =
    totalMillis >= hourInMillis ? Math.trunc(totalMillis / hourInMillis) : 0;
  const remainingMillis =
    totalMillis >= hourInMillis ? totalMillis % hourInMillis : totalMillis;
  const minute =
    remainingMillis >= minInMillis
      ? Math.trunc(remainingMillis / minInMillis)
      : 0;
  // there may be remaining millis from here but its not enough for
  // users to ask for => remaining < 60000
  return {
    hour,
    minute,
  };
};

const justHoursOrMinutes = (millis: number): string => {
  const { hour, minute } = hourAndMinutesObj(millis);
  if (hour === 0 && minute === 0) return '0';
  return `${hour ? `${hour} Hour${hour > 1 ? 's' : ''}` : ''}${
    minute
      ? `${hour ? ' ' : ''}${
          minute ? `${minute} Min${minute > 1 ? 's' : ''}` : ''
        }`
      : ''
  }`;
};

const getHours = (totalMillis: number): string => {
  const hours = totalMillis / hourInMillis;
  const remainder = totalMillis % hourInMillis;
  return `${remainder ? hours.toFixed(1) : Math.trunc(hours)}`;
};

export {
  getDurationEstimate,
  getEstimate,
  getHourAndMinutes,
  getHours,
  hourAndMinutesObj,
  justHoursOrMinutes,
};
