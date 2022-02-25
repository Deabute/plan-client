// viewStore.ts copyright 2021 Paul Beaudet MIT License

import { writable, Writable } from 'svelte/store';
import { showViews } from '../stores/settingsStore';
import { getDb } from './dbCore';

const showActivityColumn: Writable<boolean> = writable(true);
const showTimelineColumn: Writable<boolean> = writable(true);
const showAgendaColumn: Writable<boolean> = writable(true);
const showTopChild: Writable<boolean> = writable(false);
const showActivityMobile: Writable<boolean> = writable(true);
const showTimelineMobile: Writable<boolean> = writable(false);
const showAgendaMobile: Writable<boolean> = writable(false);
const showSideNav: Writable<boolean> = writable(true);
const showDone: Writable<boolean> = writable(true);
const showDonate: Writable<boolean> = writable(false);
const desktopMode: Writable<boolean> = writable(true);
const showMultiDevice: Writable<boolean> = writable(false);
const showFreshStart: Writable<boolean> = writable(false);

const views: {
  name: string;
  store: Writable<boolean | string>;
  default: boolean | string;
}[] = [
  { name: 'agenda', store: showAgendaColumn, default: true },
  { name: 'activity', store: showActivityColumn, default: true },
  { name: 'timeline', store: showTimelineColumn, default: true },
  { name: 'agendaMobile', store: showAgendaMobile, default: false },
  { name: 'activityMobile', store: showActivityMobile, default: true },
  { name: 'timelineMobile', store: showTimelineMobile, default: false },
  { name: 'topChild', store: showTopChild, default: false },
  { name: 'sideNav', store: showSideNav, default: true },
  { name: 'showDone', store: showDone, default: true },
  { name: 'showDonate', store: showDonate, default: false },
  { name: 'showMultiDevice', store: showMultiDevice, default: false },
  { name: 'showFreshStart', store: showFreshStart, default: false },
];

const toggleView = (name: string) => {
  // return as a click event holding name in closure
  return async () => {
    const view = views.find((v) => v.name === name);
    let newValue: boolean;
    const db = await getDb();
    view.store.update((store) => {
      newValue = !store;
      if (view.name === 'activity' && !newValue) {
        showAgendaColumn.set(true);
        db.put('views', { name: 'agenda', showing: true });
      }
      if (view.name === 'agenda' && !newValue) {
        showActivityColumn.set(true);
        db.put('views', { name: 'activity', showing: true });
      }
      return newValue;
    });
    if (
      view.name === 'showDonate' ||
      view.name === 'showMultiDevice' ||
      view.name === 'showFreshStart'
    ) {
      showViews.set(!newValue);
      if (view.name === 'showDonate' && newValue) {
        showMultiDevice.set(false);
        db.put('views', { name: 'showMultiDevice', showing: false });
        showFreshStart.set(false);
        db.put('views', { name: 'showFreshStart', showing: false });
      }
      if (view.name === 'showMultiDevice' && newValue) {
        showDonate.set(false);
        db.put('views', { name: 'showDonate', showing: false });
        showFreshStart.set(false);
        db.put('views', { name: 'showFreshStart', showing: false });
      }
      if (view.name === 'showFreshStart' && newValue) {
        showMultiDevice.set(false);
        db.put('views', { name: 'showMultiDevice', showing: false });
        showDonate.set(false);
        db.put('views', { name: 'showDonate', showing: false });
      }
    }
    db.put('views', { name: view.name, showing: newValue });
  };
};

const mobileToggle = (viewName: string) => {
  viewName = `${viewName}Mobile`;
  return async () => {
    const db = await getDb();
    views.forEach(({ name, store }) => {
      if (
        name === 'agendaMobile' ||
        name === 'activityMobile' ||
        name === 'timelineMobile'
      ) {
        let showing = false;
        if (name === viewName) showing = true;
        store.set(showing);
        db.put('views', { name, showing });
      }
    });
  };
};

const loadViewSettings = async () => {
  const db = await getDb();
  views.forEach(async (view) => {
    const viewSetting = await db.get('views', view.name);
    if (viewSetting) {
      view.store.set(viewSetting.showing);
      if (
        (view.name === 'showDonate' ||
          view.name === 'showMultiDevice' ||
          view.name === 'showFreshStart') &&
        viewSetting.showing
      ) {
        showViews.set(false);
      }
    } else {
      await db.add('views', { name: view.name, showing: view.default });
    }
  });
};

const getParentView = async (): Promise<string> => {
  const db = await getDb();
  const parent = await db.get('views', 'parentTask');
  let id = '1';
  if (parent?.showing && typeof parent.showing === 'string') {
    const task = await db.get('tasks', parent.showing);
    id = task ? task.id : '1';
  }
  return id;
};

export {
  loadViewSettings,
  showActivityColumn,
  showAgendaColumn,
  showTimelineColumn,
  showActivityMobile,
  showAgendaMobile,
  showTimelineMobile,
  showTopChild,
  toggleView,
  mobileToggle,
  showSideNav,
  getParentView,
  desktopMode,
  showDone,
  showDonate,
  showMultiDevice,
  showFreshStart,
};
