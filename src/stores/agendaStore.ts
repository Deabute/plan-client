// agendaStore.ts Copyright 2021 Paul Beaudet MIT License
import { Writable, writable } from 'svelte/store';
import { giveATip } from '../components/ToolTips/tipStore';
import {
  getAgendaDb,
  getSiblingTaskById,
  nextOnAgenda,
} from '../indexDb/taskDb';
import type { taskI, taskListData, timestampI } from '../shared/interface';
import { genesisTask } from './defaultData';

const agendaStore: Writable<taskI[]> = writable([]);

// next task to be used after running task is marked off
const nextUp: Writable<taskI | null> = writable(null);

const nextRecording = async (taskId: string): Promise<taskI | null> => {
  const potentialAgendaItem = await nextOnAgenda(taskId);
  if (potentialAgendaItem) return potentialAgendaItem;
  const store: taskListData = await getSiblingTaskById(taskId);
  for (let i = 0; i < store.tasks.length; i++) {
    if (store.tasks[i].id !== taskId) {
      // this will likely skip over higher priority task with top child
      if (store.tasks[i].topChild) {
        if (store.tasks[i].topChild.id !== taskId) {
          return store.tasks[i].topChild;
        }
      } else {
        return store.tasks[i];
      }
    }
  }
  // given there are no more task in this list and its top level
  // send null to make completion impossible
  if (store.lineage.length === 0 || store.lineage[0].id === genesisTask.id) {
    giveATip('lastTask');
    return null;
  }
  // Record parent if no siblings exist
  return store.lineage[0];
};

const loadAgenda = async (currentStamp: timestampI | null = null) => {
  if (currentStamp) nextUp.set(await nextRecording(currentStamp.taskId));
  const agenda: taskI[] = await getAgendaDb();
  agendaStore.set(agenda);
};

export { loadAgenda, agendaStore, nextRecording, nextUp };
