// settingsStore.ts Copyright 2021 Paul Beaudet MIT License

import { writable, Writable } from 'svelte/store';
import type { memTaskI, settingNames, taskI } from '../shared/interface';
import { utilizationOptions } from './defaultData';

const showAddFolder: Writable<boolean> = writable(false);

const selectedUtilizationOption: Writable<string> = writable(
  utilizationOptions[2], // 'This Sprint"
);
const utilizeRange: Writable<{ start: number; end: number }> = writable({
  start: 0,
  end: 0,
});

// Store for movements
const moveTask: Writable<memTaskI | null> = writable(null);

// Store for which due date is being edited
const editDue: Writable<taskI | null> = writable(null);
const toggleEditDue = (task: memTaskI) => {
  return () => {
    editDue.update((due) => {
      return !due ? task : due.id === task.id ? null : task;
    });
  };
};

const editRecur: Writable<taskI | null> = writable(null);
const toggleEditRecur = (task: memTaskI) => {
  return () => {
    editRecur.update((recur) => {
      return !recur ? task : recur.id === task.id ? null : task;
    });
  };
};

const createExport: Writable<taskI | null> = writable(null);
const toggleCreateExport = (task: memTaskI) => {
  return () => {
    createExport.update((create) => {
      // if no task then task else if task.ids are same toggle off else on
      return !create ? task : create.id === task.id ? null : task;
    });
  };
};

const toggleAddFolder = () => {
  showAddFolder.update((showing) => {
    return !showing;
  });
};

const editTask: Writable<memTaskI | null> = writable(null);

const showHistory: Writable<boolean> = writable(false);
const showDuration: Writable<boolean> = writable(false);
const showViews: Writable<boolean> = writable(true);

const settingDialogs: { name: settingNames; store: Writable<boolean> }[] = [
  { name: 'history', store: showHistory },
  { name: 'duration', store: showDuration },
];

const toggleSettingDialog = (name: settingNames) => {
  return () => {
    let toggleAllSettingsOff = true;
    settingDialogs.forEach((setting) => {
      setting.store.update((showing) => {
        if (setting.name === name && !showing) {
          showViews.set(false);
          toggleAllSettingsOff = false;
          return true;
        }
        return false;
      });
    });
    if (toggleAllSettingsOff) showViews.set(true);
  };
};

const editToggle = (task: memTaskI = null) => {
  return () => {
    editTask.update((taskToEdit) => {
      if (task === null) return null;
      return taskToEdit?.id === task.id ? null : task;
    });
  };
};

editTask.subscribe(() => {
  editRecur.set(null);
});

export {
  selectedUtilizationOption,
  utilizeRange,
  moveTask,
  editDue,
  toggleEditDue,
  editRecur,
  toggleEditRecur,
  showAddFolder,
  toggleAddFolder,
  editTask,
  showHistory,
  showDuration,
  toggleSettingDialog,
  editToggle,
  showViews,
  createExport,
  toggleCreateExport,
};
