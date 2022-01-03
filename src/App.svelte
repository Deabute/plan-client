<!-- App.svelt Copyright 2021 Paul Beaudet MIT Licence -->
<script lang="ts">
  import Timeline from './components/mainViews/Timeline.svelte';
  import { loadTach } from './stores/velocityStore';
  import Messages from './components/menuItems/Messages.svelte';
  import { getBudget } from './stores/budgetStore';
  import BudgetSetings from './components/menuItems/BudgetSetings.svelte';
  import { loadTask } from './stores/taskStore';
  import { getTime } from './stores/timeStore';
  import { initConnectionSignaling } from './connections/signaling';
  import PeersPending from './connections/PeersPending.svelte';
  import { migrateData } from './indexDb/migrations';
  import { loadAgenda } from './stores/agendaStore';
  import Agenda from './components/mainViews/Agenda.svelte';
  import { getParentView, loadViewSettings } from './indexDb/viewStoreDb';
  import ToolTipBar from './components/ToolTips/ToolTipBar.svelte';
  import Utilized from './components/menuItems/Utilized.svelte';
  import DeleteData from './components/menuItems/DeleteData.svelte';
  import Footer from './components/Navigation/Footer.svelte';
  import TaskList from './components/mainViews/TaskList.svelte';
  import { showAddFolder } from './stores/settingsStore';
  import SideNav from './components/Navigation/SideNav.svelte';
  import CloudSync from './components/menuItems/CloudSync.svelte';
  import { initEventsForEvents } from './indexDb/eventsOnEvents';
  import PeerToPeer from './components/menuItems/PeerToPeer.svelte';

  // only one db store should be loaded at a time sequentialy
  // otherwise intializing data and migrations will get triggered
  // for each async call
  const loadPersistence = async () => {
    // Order is important here, otherwise data will attempt to be parsed before
    // it can be resolved
    try {
      await migrateData();
      await getBudget();
      await loadTach();
      const task = await getParentView();
      // const task = genesisTask;
      // const renderParent = false;
      const listOfTask = await loadTask(task, false);
      await getTime(listOfTask);
      await loadAgenda();
      loadViewSettings();
      // start p2p data sync if opt in
      initEventsForEvents();
      initConnectionSignaling();
    } catch (error) {
      console.error(new Error(`Persistence loading: ${error}`));
    }
  };
  loadPersistence();
</script>

<Messages />
<PeerToPeer />
<BudgetSetings />
<PeersPending />
<ToolTipBar />
<Utilized />
<DeleteData />
<CloudSync />
<div class="d-none d-lg-block">
  <main class="scroll-container desktopMode">
    <SideNav />
    <TaskList />
    <Timeline />
    <Agenda />
  </main>
</div>
<div class="d-none d-sm-block d-lg-none">
  <main class="scroll-container desktopMode">
    <SideNav mobile={true} />
    <TaskList isMobile={true} />
    <Timeline isMobile={true} />
    <Agenda isMobile={true} />
  </main>
</div>
<div class="d-block d-sm-none">
  <main
    class={`scroll-container addFolder${$showAddFolder ? 'Showing' : 'Hidden'}`}
  >
    <TaskList isMobile={true} />
    <Timeline isMobile={true} />
    <Agenda isMobile={true} />
  </main>
</div>
<Footer />

<style>
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
  .desktopMode {
    max-height: 100vh;
    height: 100vh;
  }
</style>
