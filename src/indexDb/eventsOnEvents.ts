// eventsOnEvents ~ Copyright 2021 Paul Beaudet MIT License
import type { eventI } from '../shared/interface';
import { deleteConnection } from './connectionDB';
import {
  addStamp,
  editStamp,
  moveUtilization,
  removeStamp,
} from './timelineDb';
import { refreshTime } from '../stores/timeStore';
import { refreshTask, updateNextOrDone } from '../stores/taskStore';
import { backfillPositions, placeFolderDb, updateTaskSafe } from './taskDb';
import { getBooleanStatus, syncingDown } from '../stores/peerStore';
import { loadAgenda } from '../stores/agendaStore';
import { eventsOn } from './eventsDb';

const initEventsForEvents = () => {
  eventsOn('removeConnection', async ({ data }: eventI) => {
    const { id } = data;
    await deleteConnection(id);
  });

  eventsOn('removeTimestamp', async ({ data }: eventI) => {
    const { id } = data;
    await removeStamp(id);
    if (!getBooleanStatus(syncingDown)) refreshTime();
  });

  eventsOn('newTimestamp', async ({ data }: eventI) => {
    await addStamp(data.stamp);
    if (!getBooleanStatus(syncingDown)) refreshTime();
  });

  eventsOn('editTimestamp', async ({ data }: eventI) => {
    await editStamp(data.stamp);
    if (!getBooleanStatus(syncingDown)) {
      refreshTime(false);
      refreshTask();
    }
  });

  eventsOn('checkOff', async ({ data }: eventI) => {
    await updateNextOrDone(data.task, false);
    if (!getBooleanStatus(syncingDown)) {
      refreshTask();
      refreshTime();
      loadAgenda();
    }
  });

  eventsOn('hideTask', async ({ data }: eventI) => {
    await updateTaskSafe(
      {
        id: data.task.id,
        status: 'hide',
      },
      false,
      false,
    );
    await backfillPositions(data.task.parentId, data.task.lastModified);
    if (!getBooleanStatus(syncingDown)) {
      refreshTask();
      refreshTime();
      loadAgenda();
    }
  });

  eventsOn('moveTask', async ({ data }: eventI) => {
    await placeFolderDb(data.task);
    if (data.backfill) {
      await backfillPositions(data.backfill, data.task.lastModified);
      moveUtilization(data.task.id, data.task.parentId);
    }
    if (!getBooleanStatus(syncingDown)) refreshTask();
  });
};

export { initEventsForEvents };
