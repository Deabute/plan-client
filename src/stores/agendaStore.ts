// agendaStore.ts Copyright 2021 Paul Beaudet MIT License
import { Writable, writable } from 'svelte/store';
import { giveATip } from '../components/ToolTips/tipStore';
import {
  getAgendaDb,
  getSiblingTaskById,
  nextOnAgenda,
} from '../indexDb/taskDb';
import { getRecordingId } from '../indexDb/timelineDb';
import type { taskI, taskListData } from '../shared/interface';
import { genesisTask } from './defaultData';

const agendaStore: Writable<taskI[]> = writable([]);

const nextRecording = async (recId: string = ''): Promise<taskI | null> => {
  if (!recId) recId = await getRecordingId();
  if (!recId) return null;
  const potentialAgendaItem = await nextOnAgenda(recId);
  if (potentialAgendaItem) return potentialAgendaItem;
  const store: taskListData = await getSiblingTaskById(recId);
  for (let i = 0; i < store.tasks.length; i++) {
    if (store.tasks[i].id !== recId) {
      // this will likely skip over higher priority task with top child
      if (store.tasks[i].topChild) {
        if (store.tasks[i].topChild.id !== recId) {
          return store.tasks[i].topChild;
        }
      } else {
        return store.tasks[i];
      }
    }
  }
  // given there are no more task in this list and its top level
  // send null to make completion impossible
  if (
    store.lineage.length === 0 ||
    store.lineage[0].id === genesisTask.id ||
    store.lineage[0].id === recId
  ) {
    giveATip('lastTask');
    return null;
  }
  // Record parent if no siblings exist
  return store.lineage[0];
};

// next task to be used after running task is marked off
const nextUp: Writable<taskI | null> = writable(null);
nextRecording().then((next) => {
  nextUp.set(next);
});

const loadAgenda = async () => {
  const agenda: taskI[] = await getAgendaDb();
  agendaStore.set(agenda);
};

const reloadNextTask = async (taskId: string = ''): Promise<taskI | null> => {
  const next = await nextRecording(taskId);
  nextUp.set(next);
  return next;
};

export { loadAgenda, agendaStore, nextUp, reloadNextTask, nextRecording };
