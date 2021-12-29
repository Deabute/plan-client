<!-- Timeline.svelt Copyright 2021 Paul Beaudet MIT Licence -->
<script lang="ts">
  import { timelineColumnName } from '../../stores/defaultData';
  import Timestamp from '../../shared/Timestamp.svelte';
  import { timeStore } from '../../stores/timeStore';
  import { page } from '../../indexDb/timelineDb';
  import {
    showTimelineColumn,
    showTimelineMobile,
  } from '../../indexDb/viewStoreDb';
  import ViewContainer from './ViewContainer.svelte';
  import ArrowDown from 'svelte-bootstrap-icons/lib/ArrowDown';
  import type { memTaskI } from '../../shared/interface';
  import { nextRecording } from '../../stores/taskStore';
  import Stopwatch from 'svelte-bootstrap-icons/lib/Stopwatch';

  export let isMobile: boolean = false;

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

  let nextTaskBody: string = 'Loading';
  timeStore.subscribe(async ({ now }) => {
    const nextTask: memTaskI = await nextRecording(now.taskId);
    nextTaskBody = nextTask
      ? nextTask.body
      : 'Make some more folders or this is the only one that can be worked on';
  });
</script>

<ViewContainer
  desktopView={$showTimelineColumn}
  mobileView={$showTimelineMobile}
  id={timelineColumnName}
  {scrollHandler}
  {isMobile}
>
  <svelte:fragment slot="headerText">
    <span>
      <Stopwatch />
      <span class="header">
        &nbsp;
        {`${timelineColumnName}`}
      </span>
    </span>
    <!-- &nbsp; -->
    <!-- {timelineColumnName} -->
  </svelte:fragment>
  <svelte:fragment slot="staticHeader">
    <div class="border-bottom border-dark">
      <div class="pb-1 border-bottom">
        <div class="row mb-1 text-center">
          <div class="col-2 text-success align-self-end">Next</div>
          <div class="col-8">{nextTaskBody}</div>
          <div class="col-2 text-success align-self-end"><ArrowDown /></div>
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
