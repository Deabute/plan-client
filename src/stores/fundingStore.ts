// fundingStore.ts Copyright 2021 Paul Beaudet MIT License

import { writable, Writable } from 'svelte/store';
import { editDue, editRecur } from './settingsStore';

const fundingTask: Writable<string> = writable('');

fundingTask.subscribe((taskId) => {
  if (!taskId) return;
  editDue.set(null);
  editRecur.set(null);
});

export { fundingTask };
