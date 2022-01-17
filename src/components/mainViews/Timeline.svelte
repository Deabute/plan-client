<!-- Timeline.svelt Copyright 2021 Paul Beaudet MIT Licence -->
<script lang="ts">
  import { genesisTask, timelineColumnName } from '../../stores/defaultData';
  import Timestamp from '../../shared/Timestamp.svelte';
  import { recordTime, timeStore } from '../../stores/timeStore';
  import { page } from '../../indexDb/timelineDb';
  import {
    showTimelineColumn,
    showTimelineMobile,
  } from '../../indexDb/viewStoreDb';
  import ViewContainer from './ViewContainer.svelte';
  import ArrowDown from 'svelte-bootstrap-icons/lib/ArrowDown';
  import Stopwatch from 'svelte-bootstrap-icons/lib/Stopwatch';
  import { nextUp } from '../../stores/agendaStore';
  import { openFolder } from '../../stores/taskStore';
  import { moveTask } from '../../stores/settingsStore';
  import RecordBtn from 'svelte-bootstrap-icons/lib/RecordBtn';
  import FolderSymlink from 'svelte-bootstrap-icons/lib/FolderSymlink';
  import type { taskI } from '../../shared/interface';

  let canPageDown = true;
  let canPageUp = false;

  let loadingNextHistory: boolean = false;
  let loadingPastHistory: boolean = false;

  const scrollHandler = (element) => {
    const { scrollHeight, scrollTop, offsetHeight } = element.target;
    if (loadingNextHistory || loadingPastHistory) return;
    if (canPageDown && offsetHeight + scrollTop >= scrollHeight) {
      loadingNextHistory = true;
      setTimeout(async () => {
        const { complete, newHistory } = await page($timeStore, true);
        canPageDown = complete ? false : true;
        canPageUp = true;
        $timeStore.history = newHistory;
        loadingNextHistory = false;
      });
    }

    if (canPageUp && scrollTop === 0) {
      loadingPastHistory = true;
      setTimeout(async () => {
        element.target.scrollTop = 40;
        const { complete, newHistory } = await page($timeStore);
        canPageUp = complete ? false : true;
        canPageDown = true;
        $timeStore.history = newHistory;
        loadingPastHistory = false;
      });
    }
  };

  let next: taskI = {
    ...genesisTask,
    body: 'loading...',
  };
  nextUp.subscribe(async (nextTask) => {
    next = nextTask
      ? nextTask
      : {
          ...genesisTask,
          body: 'Make some more folders or this is the only one that can be worked on',
        };
  });

  const recordNextTask = async () => {
    recordTime(next);
  };
</script>

<ViewContainer
  desktopView={$showTimelineColumn}
  mobileView={$showTimelineMobile}
  id={timelineColumnName}
  {scrollHandler}
>
  <svelte:fragment slot="headerText">
    <span>
      <Stopwatch />
      <span class="header">
        &nbsp;
        {`${timelineColumnName}`}
      </span>
    </span>
  </svelte:fragment>
  <svelte:fragment slot="staticHeader">
    <div class="border-bottom border-dark">
      <div
        type="button"
        on:click={openFolder($nextUp, $moveTask)}
        class="pb-1 border-bottom"
      >
        <div class="row mb-1 text-center">
          <div class="col-2 align-self-end">
            {#if next.id !== '1'}
              <div
                type="button"
                class="row pb-2"
                on:click={openFolder(next, $moveTask)}
              >
                <FolderSymlink />
              </div>
              <div
                type="button"
                on:click={recordNextTask}
                class="row text-danger align-self-end"
              >
                <RecordBtn />
              </div>
            {/if}
          </div>
          <div class="col-8 text-secondary">{next.body}</div>
          <div class="col-2 text-success align-self-end">
            <div class="row pb-2 ps-3">Next</div>
            <div class="row"><ArrowDown /></div>
          </div>
        </div>
      </div>
      <Timestamp timestamp={$timeStore.now} inProgress={true} />
    </div>
  </svelte:fragment>
  <svelte:fragment slot="items">
    {#each $timeStore.history as timestamp (timestamp.start)}
      <Timestamp {timestamp} />
    {/each}
  </svelte:fragment>
</ViewContainer>

<style>
  .header {
    vertical-align: text-top;
  }
</style>
