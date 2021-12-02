// agendaStore.ts Copyright 2021 Paul Beaudet MIT License
import { Writable, writable } from 'svelte/store';
import { getAgendaDb } from '../indexDb/taskDb';
import type { taskI } from '../shared/interface';

const agendaStore: Writable<taskI[]> = writable([]);

const loadAgenda = async () => {
  // let topOfAgenda: number = 0;
  // agendaStore.update((store) => {
  //   topOfAgenda = store.length ? store[0].dueDate : 0;
  //   return store;
  // });
  const agenda: taskI[] = await getAgendaDb(0);
  agendaStore.set(agenda);
};

export { loadAgenda, agendaStore };
