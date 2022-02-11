<!-- App.svelte Copyright 2021 Paul Beaudet MIT Licence -->
<script lang="ts">
  import Timeline from './components/mainViews/Timeline.svelte';
  import { getBudget } from './stores/budgetStore';
  import BudgetSetings from './components/menuItems/BudgetSetings.svelte';
  import { loadChildren } from './stores/taskStore';
  import { getTime } from './stores/timeStore';
  import { initConnectionSignaling } from './connections/signaling';
  import { migrateData } from './indexDb/migrations';
  import { loadAgenda } from './stores/agendaStore';
  import Agenda from './components/mainViews/Agenda.svelte';
  import {
    desktopMode,
    getParentView,
    loadViewSettings,
  } from './indexDb/viewStoreDb';
  import ToolTipBar from './components/ToolTips/ToolTipBar.svelte';
  import Utilized from './components/menuItems/Utilized.svelte';
  import DeleteData from './components/menuItems/DeleteData.svelte';
  import Footer from './components/Navigation/Footer.svelte';
  import TaskList from './components/mainViews/TaskList.svelte';
  import { showViews, showAddFolder } from './stores/settingsStore';
  import { initEventsForEvents } from './indexDb/eventsOnEvents';
  import UniNav from './components/Navigation/UniNav.svelte';
  import MultiDevice from './components/menuItems/MultiDevice.svelte';
  import { loadCredentials } from './stores/credentialStore';
  import Donate from './components/menuItems/Donate.svelte';

  // only one db store should be loaded at a time sequentialy
  // otherwise intializing data and migrations will get triggered
  // for each async call
  const loadPersistence = async () => {
    // Order is important here, otherwise data will attempt to be parsed before
    // it can be resolved
    try {
      await migrateData();
      await getBudget();
      await loadChildren(await getParentView());
      await getTime();
      await loadAgenda();
      await loadCredentials();
      loadViewSettings();
      // start p2p data sync if opt in
      initEventsForEvents();
      initConnectionSignaling();
    } catch (error) {
      console.error(new Error(`Persistence loading: ${error}`));
    }
  };
  loadPersistence();

  const desktopQuery = window.matchMedia('(max-width: 992px)');
  const tabletQuery = window.matchMedia('(min-width: 575px)');
  let tabletMode = tabletQuery.matches;
  $desktopMode = desktopQuery.matches ? false : true;

  const desktopModeSwitch = (query: any) => {
    $desktopMode = query.matches ? false : true;
  };

  const tabletModeSwitch = (query: any) => {
    tabletMode = query.matches ? true : false;
  };

  tabletQuery.addEventListener('change', tabletModeSwitch);
  desktopQuery.addEventListener('change', desktopModeSwitch);

  const getHeight = (keyBoard: boolean, desktop: boolean): string => {
    if (desktop) return '';
    return ` addFolder${keyBoard ? 'Showing' : 'Hidden'}`;
  };
</script>

<ToolTipBar />
<main class={`scroll-container${getHeight($showAddFolder, tabletMode)}`}>
  {#if tabletMode}
    <div class="flex-shrink-0 text-white bg-dark pe-2">
      <UniNav />
    </div>
  {/if}
  <MultiDevice />
  <BudgetSetings />
  <Utilized />
  <DeleteData />
  <Donate />
  {#if $showViews}
    <TaskList />
    <Timeline />
    <Agenda />
  {/if}
</main>
<Footer />

<style>
  @media (min-width: 575px) {
    main {
      max-height: 100vh;
      height: 100vh;
    }
  }
  .scroll-container {
    display: flex;
    flex-wrap: nowrap;
    overflow: hidden;
  }
  .addFolderShowing {
    max-height: 67vh;
  }
  .addFolderHidden {
    max-height: 87vh;
  }
</style>
