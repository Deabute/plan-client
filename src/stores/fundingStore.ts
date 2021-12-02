// fundingStore.ts Copyright 2021 Paul Beaudet MIT License

import { writable, Writable } from 'svelte/store';
import type { memTaskI } from '../shared/interface';
import { hourAndMinutesObj } from '../shared/velocity';

// Move budget feature
interface taskToChange {
  task: memTaskI | null;
  hours: number;
  minutes: number;
  availHours: number;
  availMin: number;
  totalHour: number;
  totalMin: number;
}
const fundSetting: Writable<taskToChange> = writable({
  task: null,
  hours: 0,
  minutes: 0,
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
    availHours: 0,
    availMin: 0,
    totalHour: 0,
    totalMin: 0,
  });
};

const openFundSettings = (task: memTaskI, otherTasks: memTaskI[]) => {
  return () => {
    const { hour, minute } = hourAndMinutesObj(task.fraction);
    let millisToDraw = 0;
    // TODO MillisToDraw is stored as writable budgetAvail, its already calculated
    otherTasks.forEach((otherTask) => {
      if (otherTask.id !== task.id) {
        if (otherTask.autoAssigned) millisToDraw += otherTask.fraction;
      }
    });
    const { hour: availHours, minute: availMin } =
      hourAndMinutesObj(millisToDraw);
    let totalMin = minute + availMin;
    let totalHour = hour + availHours + Math.trunc(totalMin / 60);
    totalMin = totalHour || totalMin > 59 ? 59 : totalMin;
    fundSetting.set({
      task,
      hours: hour,
      minutes: minute,
      availHours,
      availMin,
      totalHour,
      totalMin,
    });
  };
};

export { cancelFund, fundSetting, openFundSettings };
