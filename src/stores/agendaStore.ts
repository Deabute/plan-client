// agendaStore.ts Copyright 2021 Paul Beaudet MIT License
import { Writable, writable } from 'svelte/store';
import { getAgendaDb } from '../indexDb/taskDb';
import type { taskI, timestampI } from '../shared/interface';
import { nextRecording, nextUp } from './taskStore';

const agendaStore: Writable<taskI[]> = writable([]);

const loadAgenda = async (currentStamp: timestampI | null = null) => {
  if (currentStamp) nextUp.set(await nextRecording(currentStamp.taskId));
  const agenda: taskI[] = await getAgendaDb(0);
  agendaStore.set(agenda);
};

export { loadAgenda, agendaStore };
