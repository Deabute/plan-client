// exportStore.ts Copyright 2021 Paul Beaudet MIT License

import { writable, Writable } from 'svelte/store';
import { allStores } from './defaultData';

const defaultData: string[] = [];
allStores.forEach(() => {
  defaultData.push('');
});
const exportStore: Writable<string[]> = writable([]);

const clearExports = () => {
  exportStore.update(() => {
    return [];
  });
};

export { exportStore, clearExports };
