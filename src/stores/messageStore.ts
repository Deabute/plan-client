// messageStore.ts Copyright 2021 Paul Beaudet MIT License

import { writable, Writable } from 'svelte/store';

const messageStore: Writable<string[]> = writable([]);

const clearMessages = () => {
  messageStore.update(() => {
    return [];
  });
};

export { messageStore, clearMessages };
