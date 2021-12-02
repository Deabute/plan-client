// tipStore.ts Copyright 2021 Paul Beaudet MIT License

import { writable, Writable } from 'svelte/store';

const showToolTips: Writable<boolean> = writable(false);
const befuddlementClicks: Writable<number> = writable(0);
const visibleTip: Writable<string> = writable('');

const toolTips = {
  lastTask: [
    'Add next task to finish this one',
    'There is no end without a beginning and vice versa',
    'Do nothing is a paradox, doing implies something is happening',
    'This is the only thing that can be done, why do anything else?',
  ],
};

const toggleToolTips = () => {
  showToolTips.update((store) => {
    return !store;
  });
  befuddlementClicks.set(0);
  visibleTip.set('');
};

const giveATip = (tip: string = 'lastTask') => {
  showToolTips.set(true);
  befuddlementClicks.update((clicks) => {
    visibleTip.set(toolTips[tip][clicks]);
    clicks++;
    return clicks < toolTips[tip].length ? clicks : 0;
  });
};

export { showToolTips, toggleToolTips, giveATip, visibleTip };
