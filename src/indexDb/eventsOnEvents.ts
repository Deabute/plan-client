// eventsOnEvents ~ Copyright 2021 Paul Beaudet MIT License
import type { eventI } from '../shared/interface';
import { deleteConnection } from './connectionDB';
import { addStamp, removeStamp } from './timelineDb';
import { refreshTime } from '../stores/timeStore';
import { refreshTask } from '../stores/taskStore';
import { backfillPositions, placeFolderDb, updateTaskSafe } from './taskDb';
import { getBooleanStatus, syncingDown } from '../stores/peerStore';
import { loadAgenda } from '../stores/agendaStore';
import { eventsOn } from './eventsDb';
import { nextOccurrence } from '../components/time/CadenceFunctions';

const initEventsForEvents = () => {
  eventsOn('removeConnection', async ({ data }: eventI) => {
    const { id } = data;
    await deleteConnection(id);
  });

  eventsOn('removeTimestamp', async ({ data }: eventI) => {
    const { id } = data;
    await removeStamp(id);
    refreshTime();
  });

  eventsOn('newTimestamp', async ({ data }: eventI) => {
    await addStamp(data.stamp);
    if (!getBooleanStatus(syncingDown)) refreshTime();
  });

  eventsOn('checkOff', async ({ data }: eventI) => {
    if (data.task.cadence === 'zero') {
      await updateTaskSafe({ id: data.task.id, status: 'done' });
      await backfillPositions(data.task.parentId);
    } else {
      await updateTaskSafe({
        id: data.task.id,
        dueDate:
          data.task.cadence === 'many'
            ? 0
            : nextOccurrence(data.task.cadence, data.task.dueDate),
      });
    }
    if (!getBooleanStatus(syncingDown)) {
      refreshTask();
      loadAgenda();
    }
  });

  eventsOn('hideTask', async ({ data }: eventI) => {
    await updateTaskSafe({
      id: data.task.id,
      status: 'hide',
    });
    await backfillPositions(data.task.parentId);
    if (!getBooleanStatus(syncingDown)) refreshTask();
  });

  eventsOn('moveTask', async ({ data }: eventI) => {
    await placeFolderDb(data.task);
    if (data.backfill) backfillPositions(data.task.parentId);
    if (!getBooleanStatus(syncingDown)) refreshTask();
  });
};

export { initEventsForEvents };
