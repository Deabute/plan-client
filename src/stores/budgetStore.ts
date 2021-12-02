// budgetStore.ts copyright 2021 Paul Beaudet MIT License
import { Writable, writable } from 'svelte/store';
import type { budgetI } from '../shared/interface';
import { getCurrentBudget, newBudget, updateBudget } from '../indexDb/budgetDb';
import { createOid } from '../isomorphic/oid';

const budgetStore: Writable<budgetI> = writable({
  id: '0',
  start: 0,
  frame: 0,
  lastModified: 1,
  number: 0,
});

const getBudget = async () => {
  let current = await getCurrentBudget();
  // new budget is only called here for budget zero
  current = current ? current : await newBudget();
  const endTime: number = current.start + current.frame;
  // auto start a new budget when done with old
  if (endTime <= Date.now()) {
    current = {
      id: createOid(),
      start: endTime,
      frame: current.frame,
      lastModified: 1, // this is going to sneak into memory, thats okay
      number: current.number + 1,
    };
    // save new budget
    await updateBudget(current);
  }
  budgetStore.update((store) => {
    return current;
  });
};

const getRemainingMillis = (budget: budgetI): number => {
  const end = budget.start + budget.frame;
  const current = Date.now();
  return current < end ? end - current : 0;
};

const getEndOfSprint = (budget: budgetI): string => {
  const endTime: number = budget.start + budget.frame;
  const date = new Date(endTime);
  let returnString = '';
  returnString += date.toDateString().slice(0, 15) + ' ';
  let hours = date.getHours();
  const meridian: string = hours > 11 ? 'PM' : 'AM';
  hours = hours > 12 ? hours - 12 : hours;
  hours = hours ? hours : 12;
  returnString += hours;
  returnString += meridian;
  return returnString;
};

export { budgetStore, getBudget, getRemainingMillis, getEndOfSprint };
