<!-- Timeline.svelt Copyright 2021 Paul Beaudet MIT Licence -->
<script lang="ts">
  import { timelineColumnName } from '../../stores/defaultData';
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
  import RecordBtn from 'svelte-bootstrap-icons/lib/RecordBtn';
  import OpenFolderButton from '../ActionButtons/OpenFolderButton.svelte';
  import BodyAndAction from '../ActionButtons/BodyAndAction.svelte';

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

  let id = '1';
  let parentId = '1';
  let body = 'loading...';
  nextUp.subscribe(async (nextTask) => {
    id = nextTask ? nextTask.id : '1';
    parentId = nextTask ? nextTask.parentId : '1';
    body = nextTask
      ? nextTask.body
      : 'Make some more folders or this is the only one that can be worked on';
  });

  const recordNextTask = async () => {
    recordTime($nextUp);
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
      <div class="pb-1 border-bottom">
        <div class="row mb-1 text-center">
          <div class="col-2 align-self-end">
            {#if id !== '1'}
              <OpenFolderButton id={parentId} size="12 row pb-2" />
              <div
                type="button"
                on:click={recordNextTask}
                class="row text-danger align-self-end"
              >
                <RecordBtn />
              </div>
            {/if}
          </div>
          <BodyAndAction {body} id={parentId} size="8 text-secondary" />
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
