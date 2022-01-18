// settingsStore.ts Copyright 2021 Paul Beaudet MIT License

import { writable, Writable } from 'svelte/store';
import type { requesterInfo } from '../connections/connectInterface';
import type { memTaskI, settingNames, taskI } from '../shared/interface';
import { utilizationOptions } from './defaultData';

// Incoming request to approve device connections
const pendingPeers: Writable<requesterInfo[]> = writable([]);
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

const toggleAddFolder = () => {
  showAddFolder.update((showing) => {
    return !showing;
  });
};

const editTask: Writable<memTaskI | null> = writable(null);

const showPeerSync: Writable<boolean> = writable(false);
const showHistory: Writable<boolean> = writable(false);
const showDuration: Writable<boolean> = writable(false);
const showFreshStart: Writable<boolean> = writable(false);
const showCloudSync: Writable<boolean> = writable(false);
const showViews: Writable<boolean> = writable(true);

const settingDialogs: { name: settingNames; store: Writable<boolean> }[] = [
  { name: 'peerSync', store: showPeerSync },
  { name: 'history', store: showHistory },
  { name: 'duration', store: showDuration },
  { name: 'freshStart', store: showFreshStart },
  { name: 'cloudSync', store: showCloudSync },
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
const newProfile: Writable<boolean> = writable(false);

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
  pendingPeers,
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
  showPeerSync,
  showFreshStart,
  showDuration,
  showCloudSync,
  toggleSettingDialog,
  newProfile,
  editToggle,
  showViews,
};
