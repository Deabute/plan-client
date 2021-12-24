// fundingStore.ts Copyright 2021 Paul Beaudet MIT License

import { writable, Writable } from 'svelte/store';
import { hourAndMinutesObj } from '../components/time/timeConvert';
import type { memTaskI } from '../shared/interface';

// Move budget feature
interface taskToChange {
  task: memTaskI | null;
  hours: number;
  minutes: number;
  remainder: number;
  availHours: number;
  availMin: number;
  totalHour: number;
  totalMin: number;
}
const fundSetting: Writable<taskToChange> = writable({
  task: null,
  hours: 0,
  minutes: 0,
  remainder: 0,
  availHours: 0,
  availMin: 0,
  totalHour: 0,
  totalMin: 0,
});

const cancelFund = () => {
  fundSetting.set({
    task: null,
    hours: 0,
    minutes: 0,
    remainder: 0,
    availHours: 0,
    availMin: 0,
    totalHour: 0,
    totalMin: 0,
  });
};

const openFundSettings = (task: memTaskI, availBudget: number) => {
  return () => {
    const { hour, minute, remainder } = hourAndMinutesObj(task.fraction);
    const { hour: availHours, minute: availMin } =
      hourAndMinutesObj(availBudget);
    let totalMin = minute + availMin;
    let totalHour = hour + availHours + Math.trunc(totalMin / 60);
    totalMin = totalHour || totalMin > 59 ? 59 : totalMin;
    fundSetting.set({
      task,
      hours: hour,
      minutes: minute,
      remainder,
      availHours,
      availMin,
      totalHour,
      totalMin,
    });
  };
};

export { cancelFund, fundSetting, openFundSettings };
